from flask import Blueprint, request, jsonify
from api.utils import db
import litellm
import os
import json as _json
import threading
import uuid

compare_bp = Blueprint('compare', __name__, url_prefix='/api')

# Almacenamiento en memoria de resultados de comparación pendientes/completados
_comparison_store: dict = {}
_comparison_lock = threading.Lock()


def _run_comparison(job_id: str, p1: dict, a1: dict, p2: dict, a2: dict):
    """Ejecuta la comparación en un hilo de fondo y guarda el resultado en el store."""
    try:
        prod1_summary = f"""
Producto 1: {p1.get('name')}
Categoría: {p1.get('category')}
Precio: {p1.get('price')}
Descripción: {p1.get('description')}
Valoración media: {a1.get('average_rating', 'N/A')}
Puntos positivos: {", ".join(a1.get('positive_points', [])) if a1.get('positive_points') else 'Ninguno'}
Puntos negativos: {", ".join(a1.get('negative_points', [])) if a1.get('negative_points') else 'Ninguno'}
"""

        prod2_summary = f"""
Producto 2: {p2.get('name')}
Categoría: {p2.get('category')}
Precio: {p2.get('price')}
Descripción: {p2.get('description')}
Valoración media: {a2.get('average_rating', 'N/A')}
Puntos positivos: {", ".join(a2.get('positive_points', [])) if a2.get('positive_points') else 'Ninguno'}
Puntos negativos: {", ".join(a2.get('negative_points', [])) if a2.get('negative_points') else 'Ninguno'}
"""

        api_base = os.environ.get("OPENAI_API_BASE", "http://ada01.ujaen.es:8080/v1")
        model_name = os.environ.get("OPENAI_MODEL_NAME", "ada01.ujaen.es:8080/v1")

        prompt = f"""
Actúa como un analista de mercado y consultor experto de producto.
Analiza y compara los siguientes dos productos basándote en su descripción y en el feedback simulado de sus clientes:

{prod1_summary}

---

{prod2_summary}

Genera un informe comparativo detallado y profesional en español. El informe debe estructurarse con las siguientes secciones en texto plano (sin bloques de código markdown, sin caracteres especiales de formato que no sean listas):
1. RESUMEN EJECUTIVO: Breve contraste general de ambos productos.
2. ANÁLISIS DE SATISFACCIÓN: Comparación de cómo los clientes perciben la calidad de cada uno.
3. VENTAJAS COMPETITIVAS: Qué hace a cada producto destacar sobre el otro.
4. PUNTOS CRÍTICOS: Debilidades importantes identificadas por los clientes.
5. VEREDICTO Y RECOMENDACIONES: A qué segmento de clientes le conviene cada producto.

Sé conciso, directo, analítico y profesional.
"""

        custom_llm_provider = None
        if "ada01.ujaen.es" in api_base:
            custom_llm_provider = "openai"

        response = litellm.completion(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            api_base=api_base,
            custom_llm_provider=custom_llm_provider,
            temperature=0.7,
            timeout=120  # Timeout de 2 minutos
        )
        report = response.choices[0].message.content

        result = {
            "status": "done",
            "product1": {
                "name": p1.get('name'),
                "image": p1.get('image'),
                "price": p1.get('price'),
                "category": p1.get('category'),
                "average_rating": a1.get('average_rating'),
                "positive_points": a1.get('positive_points', []),
                "negative_points": a1.get('negative_points', [])
            },
            "product2": {
                "name": p2.get('name'),
                "image": p2.get('image'),
                "price": p2.get('price'),
                "category": p2.get('category'),
                "average_rating": a2.get('average_rating'),
                "positive_points": a2.get('positive_points', []),
                "negative_points": a2.get('negative_points', [])
            },
            "comparison_report": report
        }
    except Exception as e:
        import traceback
        result = {
            "status": "error",
            "error": f"Error al generar la comparación: {str(e)}",
            "details": traceback.format_exc()
        }

    with _comparison_lock:
        _comparison_store[job_id] = result


@compare_bp.route('/compare', methods=['POST'])
def compare_sessions():
    """Inicia una comparación en background y devuelve un job_id inmediatamente."""
    try:
        data = request.get_json() or {}
        session_id_1 = data.get('session_id_1')
        session_id_2 = data.get('session_id_2')

        if not session_id_1 or not session_id_2:
            return jsonify({"error": "Se requieren session_id_1 y session_id_2"}), 400

        p1 = db.get_product(session_id_1)
        a1 = db.get_analysis(session_id_1) or {}
        p2 = db.get_product(session_id_2)
        a2 = db.get_analysis(session_id_2) or {}

        if not p1 or not p2:
            return jsonify({"error": "No se encontraron los productos para comparar. Asegúrate de que ambas simulaciones tienen datos."}), 404

        # Normalizar listas JSON (por seguridad)
        for a in [a1, a2]:
            for key in ['positive_points', 'negative_points', 'demographic_insights']:
                v = a.get(key)
                if isinstance(v, str):
                    try:
                        a[key] = _json.loads(v)
                    except Exception:
                        a[key] = []
                elif v is None:
                    a[key] = []

        # Generar un job_id único y marcar como pendiente
        job_id = uuid.uuid4().hex
        with _comparison_lock:
            _comparison_store[job_id] = {"status": "pending"}

        # Lanzar comparación en hilo de fondo (no bloquea el servidor)
        t = threading.Thread(target=_run_comparison, args=(job_id, p1, a1, p2, a2), daemon=True)
        t.start()

        return jsonify({"job_id": job_id, "status": "pending"}), 202

    except Exception as e:
        import traceback
        return jsonify({"error": f"Error iniciando la comparación: {str(e)}", "details": traceback.format_exc()}), 500


@compare_bp.route('/compare/<job_id>', methods=['GET'])
def get_comparison_result(job_id: str):
    """Devuelve el resultado de una comparación por su job_id."""
    with _comparison_lock:
        result = _comparison_store.get(job_id)

    if result is None:
        return jsonify({"error": "Job no encontrado"}), 404

    if result.get("status") == "pending":
        return jsonify({"status": "pending"}), 202

    if result.get("status") == "error":
        return jsonify(result), 500

    return jsonify(result), 200
