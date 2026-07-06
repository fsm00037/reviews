from flask import Blueprint, jsonify, request, Response
import time
import json
from api.services.crew_service import (
    execute_phase1,
    execute_phase2,
    execute_phase3,
    execute_phase4,
    clean_outputs
)
from api.services.results_service import (
    get_product_info,
    get_reviewer_profiles,
    get_reviews,
    get_analysis,
    get_all_results
)
from api.utils import db

# Crear un Blueprint para las rutas relacionadas con las reseñas
reviews_bp = Blueprint('reviews', __name__, url_prefix='/api')

def get_session_id():
    """Obtiene el identificador de sesión único de las cabeceras HTTP"""
    return request.headers.get('X-Session-ID', 'default-session')

@reviews_bp.route('/health', methods=['GET'])
def health_check():
    """Verificar que la API está funcionando"""
    return jsonify({"status": "ok", "timestamp": time.time()})

@reviews_bp.route('/sessions', methods=['GET'])
def get_recent_sessions_endpoint():
    """Obtener las sesiones recientes con datos"""
    try:
        sessions = db.get_recent_sessions()
        return jsonify(sessions), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@reviews_bp.route('/clean-outputs', methods=['POST'])
def clean_outputs_endpoint():
    """Limpia la carpeta de outputs antes de iniciar un nuevo análisis"""
    session_id = get_session_id()
    try:
        clean_outputs(session_id)
        return jsonify({"status": "success", "message": "Outputs limpiados correctamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@reviews_bp.route('/phase1', methods=['POST'])
def phase1_product_info():
    """
    Fase 1: Extraer información del producto (Asíncrona)
    """
    session_id = get_session_id()
    data = request.json
    
    if not data or 'product_url' not in data:
        return jsonify({"error": "Se requiere la URL del producto"}), 400
    
    product_url = data['product_url']
    model_name = data.get('model_name', None)
    
    try:
        res = execute_phase1(product_url, model_name, session_id)
        return jsonify(res), 202
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@reviews_bp.route('/phase2', methods=['POST'])
def phase2_create_reviewers():
    """
    Fase 2: Crear perfiles de usuario (Asíncrona)
    """
    session_id = get_session_id()
    data = request.json
    
    if not data or 'num_reviewers' not in data or 'profile_parameters' not in data:
        return jsonify({"error": "Se requieren el número de reseñadores y los parámetros de los perfiles"}), 400
    
    num_reviewers = data['num_reviewers']
    profile_parameters = data['profile_parameters']
    model_name = data.get('model_name', None)
    
    try:
        res = execute_phase2(num_reviewers, profile_parameters, model_name, session_id)
        return jsonify(res), 202
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@reviews_bp.route('/phase3', methods=['POST'])
def phase3_generate_reviews():
    """
    Fase 3: Generar reseñas (Asíncrona)
    """
    session_id = get_session_id()
    data = request.json
    
    if not data:
        return jsonify({"error": "Se requiere un cuerpo JSON válido"}), 400
    
    product_info = data.get('product_info')
    user_profiles = data.get('user_profiles')
    model_name = data.get('model_name', None)
    
    if not product_info:
        return jsonify({"error": "Se requiere product_info en el cuerpo de la petición"}), 400
    
    if not user_profiles:
        return jsonify({"error": "Se requiere user_profiles en el cuerpo de la petición"}), 400
    
    try:
        res = execute_phase3(product_info, user_profiles, model_name, session_id)
        return jsonify(res), 202
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@reviews_bp.route('/phase4', methods=['POST'])
def phase4_analyze_reviews():
    """
    Fase 4: Compilar reseñas y generar informe final (Asíncrona)
    """
    session_id = get_session_id()
    data = request.json
    model_name = data.get('model_name', None) if data else None
    
    try:
        # Verificar en SQLite que existen reseñas para esta sesión
        reviews = get_reviews(session_id)
        if not reviews:
            return jsonify({"error": "No se ha ejecutado la fase 3 o no hay reseñas generadas para esta sesión"}), 400
        
        res = execute_phase4(model_name, session_id)
        return jsonify(res), 202
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@reviews_bp.route('/results', methods=['GET'])
def get_results():
    """Obtener todos los resultados generados hasta el momento para la sesión"""
    session_id = get_session_id()
    results = get_all_results(session_id)
    if not results.get("product") or not results["product"].get("name"):
        return jsonify({"error": "No hay resultados para esta sesión"}), 404
    return jsonify(results)

@reviews_bp.route('/product', methods=['GET'])
def get_product():
    """Obtener la información del producto analizado"""
    session_id = get_session_id()
    
    # Comprobar si hubo fallos en segundo plano
    status_info = db.get_task_status(session_id, 'phase1')
    if status_info['status'] == 'failed':
        return jsonify({"error": "La Fase 1 falló", "details": status_info['error']}), 500
        
    product_info = get_product_info(session_id)
    if not product_info or not product_info.get("name"):
        return jsonify({"error": "Información de producto no lista"}), 404
        
    return jsonify(product_info)

@reviews_bp.route('/reviewers', methods=['GET'])
def get_reviewers():
    """Obtener perfiles de los reseñadores"""
    session_id = get_session_id()
    
    status_info = db.get_task_status(session_id, 'phase2')
    if status_info['status'] == 'failed':
        return jsonify({"error": "La Fase 2 falló", "details": status_info['error']}), 500
        
    reviewers = get_reviewer_profiles(session_id)
    # Si la lista está vacía y la tarea sigue en proceso, retornar 404 para seguir esperando
    if not reviewers and status_info['status'] in ['pending', 'running']:
        return jsonify({"error": "Perfiles de reseñadores no listos"}), 404
        
    return jsonify(reviewers)

@reviews_bp.route('/reviews', methods=['GET'])
def get_all_reviews():
    """Obtener todas las reseñas generadas"""
    session_id = get_session_id()
    
    status_info = db.get_task_status(session_id, 'phase3')
    if status_info['status'] == 'failed':
        return jsonify({"error": "La Fase 3 falló", "details": status_info['error']}), 500
        
    reviews = get_reviews(session_id)
    # Si la lista está vacía y la tarea sigue en proceso, retornar 404 para seguir esperando
    if not reviews and status_info['status'] in ['pending', 'running']:
        return jsonify({"error": "Reseñas no listas"}), 404
        
    return jsonify(reviews)

@reviews_bp.route('/analysis', methods=['GET'])
def get_results_analysis():
    """Obtener el análisis final de las reseñas"""
    session_id = get_session_id()
    
    status_info = db.get_task_status(session_id, 'phase4')
    if status_info['status'] == 'failed':
        return jsonify({"error": "La Fase 4 falló", "details": status_info['error']}), 500
        
    analysis = get_analysis(session_id)
    if status_info['status'] in ['pending', 'running'] or not analysis or not analysis.get("average_rating"):
        return jsonify({"error": "Análisis no listo"}), 404
        
    return jsonify(analysis)

@reviews_bp.route('/status/<phase>', methods=['GET'])
def get_phase_status(phase):
    """Obtener el estado de ejecución de una fase"""
    session_id = get_session_id()
    status_info = db.get_task_status(session_id, phase)
    return jsonify(status_info), 200

@reviews_bp.route('/events/<session_id>', methods=['GET'])
def sse_events(session_id):
    """Canal de Server-Sent Events (SSE) para emitir progreso en tiempo real"""
    from api.utils.pubsub import pubsub
    
    def event_stream():
        # Suscribir una cola de mensajes para esta sesión
        q = pubsub.subscribe(session_id)
        # Emitir bloque de comentarios (padding) de 2KB para desactivar buffering del navegador/proxy
        yield f": { ' ' * 2048 }\n\n"
        # Emitir primer mensaje de conexión exitosa
        yield f"data: {json.dumps({'type': 'connected'})}\n\n"
        
        try:
            while True:
                try:
                    # Esperar por nuevos mensajes de la cola de la sesión
                    # Timeout de 15 segundos para enviar pings para que la conexión no se caiga
                    message = q.get(timeout=15.0)
                    yield f"data: {message}\n\n"
                except queue.Empty:
                    # Enviar ping para mantener la conexión HTTP abierta
                    yield f"data: {json.dumps({'type': 'ping'})}\n\n"
        except GeneratorExit:
            # Captura cuando el cliente cierra la conexión
            pass
        finally:
            # Desuscribir para liberar memoria
            pubsub.unsubscribe(session_id, q)
            
    response = Response(event_stream(), mimetype='text/event-stream')
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['Connection'] = 'keep-alive'
    response.headers['X-Accel-Buffering'] = 'no'
    return response