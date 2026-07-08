from flask import Blueprint, jsonify, request
from api.utils import db
import litellm
import os

improvements_bp = Blueprint('improvements', __name__, url_prefix='/api')

@improvements_bp.route('/sessions/<session_id>/improvements', methods=['GET'])
def get_or_generate_improvements(session_id):
    # Intentar obtener de cache
    cached = db.get_improvements(session_id)
    if cached:
        return jsonify({"session_id": session_id, "improvements": cached}), 200
        
    p = db.get_product(session_id)
    a = db.get_analysis(session_id)
    
    if not p or not a:
        return jsonify({"error": "No se encontraron datos del producto o análisis para esta sesión"}), 404
        
    # Construir resumen de la sesión
    prod_summary = f"""
    Producto: {p.get('name')}
    Categoría: {p.get('category')}
    Precio: {p.get('price')}
    Descripción: {p.get('description')}
    Valoración media: {a.get('average_rating', 'N/A')}
    Puntos fuertes (positivos): {", ".join(a.get('positive_points', [])) if a.get('positive_points') else 'Ninguno'}
    Quejas/Puntos críticos (negativos): {", ".join(a.get('negative_points', [])) if a.get('negative_points') else 'Ninguno'}
    """
    
    # Llamar a LiteLLM
    api_base = os.environ.get("OPENAI_API_BASE", "http://ada01.ujaen.es:8080/v1")
    model_name = os.environ.get("OPENAI_MODEL_NAME", "ada01.ujaen.es:8080/v1")
    
    prompt = f"""
    Actúa como un consultor líder en diseño e innovación de producto.
    Basándote en la siguiente ficha técnica de producto y la retroalimentación de los clientes simulados:
    
    {prod_summary}
    
    Desarrolla un Plan de Innovación y Mejora del Producto para superar las quejas de los clientes y potenciar las ventas.
    El reporte debe estar en formato Markdown y estructurarse de la siguiente manera:
    
    1. ### 🛠️ Mejoras de Diseño y Usabilidad:
       - Cómo resolver los problemas estéticos o de facilidad de uso señalados.
    2. ### ⚙️ Mejoras de Calidad y Características Técnicas:
       - Características adicionales o cambios materiales requeridos.
    3. ### 💰 Ajustes en la Estrategia de Precio y Posicionamiento:
       - Si el precio es adecuado para el valor ofrecido y qué cambios estratégicos sugerir.
    4. ### 📈 Plan de Acción de Marketing y Comunicación:
       - Cómo comunicar estas mejoras para ganarse al cliente objetivo.
       
    Sé muy específico, práctico y orientado a resultados de negocio reales.
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
        
        # Guardar en cache
        db.save_improvements(session_id, report)
        
        return jsonify({"session_id": session_id, "improvements": report}), 200
    except Exception as e:
        return jsonify({"error": f"Error al generar las mejoras del producto con el LLM: {str(e)}"}), 500

@improvements_bp.route('/sessions/<session_id>/create-improved', methods=['POST'])
def create_improved_product_endpoint(session_id):
    user_id_header = request.headers.get("X-User-Id")
    user_id = None
    if user_id_header:
        try:
            user_id = int(user_id_header)
        except ValueError:
            pass

    p = db.get_product(session_id)
    improvements_report = db.get_improvements(session_id)
    
    if not p:
        return jsonify({"error": "No se encontró el producto original"}), 404
        
    if not improvements_report:
        # Intentar generarlo primero
        try:
            # Llamar directamente a la función de generación
            conn = db.get_connection()
            # Si no existe, simulamos la generación
            p_summary = f"Producto: {p.get('name')}\nCategoría: {p.get('category')}\nPrecio: {p.get('price')}\nDescripción: {p.get('description')}"
            api_base = os.environ.get("OPENAI_API_BASE", "http://ada01.ujaen.es:8080/v1")
            model_name = os.environ.get("OPENAI_MODEL_NAME", "ada01.ujaen.es:8080/v1")
            
            prompt = f"Actúa como un consultor líder en diseño e innovación de producto. Basándote en el producto:\n{p_summary}\nGenera una propuesta de mejora estructurada en Markdown."
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
            improvements_report = response.choices[0].message.content
            db.save_improvements(session_id, improvements_report)
        except Exception as e:
            return jsonify({"error": f"No se pudo obtener el reporte de mejoras: {str(e)}"}), 400

    # Generar producto mejorado mediante LiteLLM
    import uuid
    import json
    
    prompt = f"""
    Actúa como un diseñador de producto e ingeniero de innovación.
    A partir de la información original del producto:
    {json.dumps(p)}
    
    Y del siguiente plan de mejoras del producto:
    {improvements_report}
    
    Crea una versión mejorada del producto. Debes responder EXCLUSIVAMENTE con un objeto JSON estructurado así (sin markdown, sin bloques ```json, solo el texto plano del JSON):
    {{
      "name": "Nombre mejorado (añade 'Mejorado', 'v2' o 'Pro')",
      "description": "Nueva descripción detallada que describa las mejoras introducidas",
      "price": "Precio estratégico sugerido (ej. '$21.99' o '$19.99')",
      "category": "{p.get('category')}",
      "image": "{p.get('image', '/placeholder.svg')}",
      "main_features": [
        {{"feature": "característica", "value": "valor mejorado"}}
      ],
      "technical_specs": [
        {{"spec": "especificación", "value": "valor mejorado"}}
      ]
    }}
    """
    
    api_base = os.environ.get("OPENAI_API_BASE", "http://ada01.ujaen.es:8080/v1")
    model_name = os.environ.get("OPENAI_MODEL_NAME", "ada01.ujaen.es:8080/v1")
    
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
        content = response.choices[0].message.content.strip()
        
        # Sanear respuesta por si incluye bloques markdown ```json
        if content.startswith("```"):
            lines = content.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            content = "\n".join(lines).strip()
            
        product_data = json.loads(content)
        
        # Generar un nuevo ID de sesión para el producto hijo
        new_session_id = f"improved-{uuid.uuid4().hex[:12]}"
        
        # Inicializar sesión e insertar producto como hijo
        db.init_child_session(new_session_id, session_id, user_id=user_id)
        db.save_product(new_session_id, product_data, user_id=user_id)
        
        return jsonify({
            "status": "success",
            "session_id": new_session_id,
            "product": product_data
        }), 200
    except Exception as e:
        return jsonify({"error": f"Error al generar el producto mejorado: {str(e)}"}), 500
