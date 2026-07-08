from flask import Blueprint, request, jsonify
from api.utils import db
import litellm
import os

compare_bp = Blueprint('compare', __name__, url_prefix='/api')

@compare_bp.route('/compare', methods=['POST'])
def compare_sessions():
    data = request.get_json() or {}
    session_id_1 = data.get('session_id_1')
    session_id_2 = data.get('session_id_2')
    
    if not session_id_1 or not session_id_2:
        return jsonify({"error": "Se requieren session_id_1 y session_id_2"}), 400
        
    p1 = db.get_product(session_id_1)
    a1 = db.get_analysis(session_id_1)
    
    p2 = db.get_product(session_id_2)
    a2 = db.get_analysis(session_id_2)
    
    if not p1 or not p2:
        return jsonify({"error": "No se encontraron los productos para comparar"}), 404
        
    # Construir resumen de datos para el prompt
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
    
    # Llamar a LiteLLM para generar el reporte de comparación
    api_base = os.environ.get("OPENAI_API_BASE", "http://ada01.ujaen.es:8080/v1")
    model_name = os.environ.get("OPENAI_MODEL_NAME", "ada01.ujaen.es:8080/v1")
    
    prompt = f"""
    Actúa como un analista de mercado y consultor experto de producto. 
    Analiza y compara los siguientes dos productos basándote en su descripción y en el feedback simulado de sus clientes:
    
    {prod1_summary}
    
    ---
    
    {prod2_summary}
    
    Genera un informe comparativo detallado y profesional en español. El informe debe estructurarse en formato Markdown con las siguientes secciones:
    1. ### Resumen Ejecutivo: Breve contraste general de ambos productos.
    2. ### Análisis de Satisfacción del Cliente: Comparación de cómo los clientes perciben la calidad y utilidad de cada uno.
    3. ### Ventajas Competitivas Clave: Qué hace a cada producto destacar sobre el otro.
    4. ### Puntos Críticos y Áreas de Riesgo: Debilidades importantes identificadas por los clientes.
    5. ### Veredicto y Recomendaciones: A qué segmento de clientes le conviene cada producto y cuál ofrece mejor relación calidad-precio.
    
    Sé conciso, directo, analítico y profesional.
    """
    
    try:
        custom_llm_provider = None
        if "ada01.ujaen.es" in api_base:
            custom_llm_provider = "openai"
            
        response = litellm.completion(
            model=model_name,
            messages=[{"role": "user", "content": prompt}],
            api_base=api_base,
            custom_llm_provider=custom_llm_provider,
            temperature=0.7
        )
        report = response.choices[0].message.content
        return jsonify({
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
        }), 200
    except Exception as e:
        return jsonify({"error": f"Error al generar la comparación con LLM: {str(e)}"}), 500
