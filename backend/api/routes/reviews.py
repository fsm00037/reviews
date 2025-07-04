from flask import Blueprint, jsonify, request
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

# Crear un Blueprint para las rutas relacionadas con las reseñas
reviews_bp = Blueprint('reviews', __name__, url_prefix='/api')

@reviews_bp.route('/health', methods=['GET'])
def health_check():
    """Verificar que la API está funcionando"""
    return jsonify({"status": "ok", "timestamp": time.time()})

@reviews_bp.route('/clean-outputs', methods=['POST'])
def clean_outputs_endpoint():
    """Limpia la carpeta de outputs antes de iniciar un nuevo análisis"""
    try:
        clean_outputs()
        return jsonify({"status": "success", "message": "Outputs limpiados correctamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@reviews_bp.route('/phase1', methods=['POST'])
def phase1_product_info():
    """
    Fase 1: Extraer información del producto
    
    Espera un JSON con:
    - product_url: URL del producto
    - model_name: (opcional) nombre del modelo a utilizar
    """
    data = request.json
    
    if not data or 'product_url' not in data:
        return jsonify({"error": "Se requiere la URL del producto"}), 400
    
    product_url = data['product_url']
    model_name = data.get('model_name', None)
    
    try:
        # Primero limpiar la carpeta de outputs
        clean_outputs()
        # Ejecutar fase 1
        execute_phase1(product_url, model_name)
        return jsonify({"status": "success", "message": "Fase 1 completada correctamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@reviews_bp.route('/phase2', methods=['POST'])
def phase2_create_reviewers():
    """
    Fase 2: Crear perfiles de usuario
    
    Espera un JSON con:
    - num_reviewers: número de reseñadores a crear
    - profile_parameters: parámetros de los perfiles a crear
    - model_name: (opcional) nombre del modelo a utilizar
    """
    data = request.json
    
    if not data or 'num_reviewers' not in data or 'profile_parameters' not in data:
        return jsonify({"error": "Se requieren el número de reseñadores y los parámetros de los perfiles"}), 400
    
    num_reviewers = data['num_reviewers']
    profile_parameters = data['profile_parameters']
    model_name = data.get('model_name', None)
    
    try:
        execute_phase2(num_reviewers, profile_parameters, model_name)
        return jsonify({"status": "success", "message": "Fase 2 completada correctamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@reviews_bp.route('/phase3', methods=['POST'])
def phase3_generate_reviews():
    """
    Fase 3: Generar reseñas
    
    Espera un JSON con:
    - product_info: información del producto
    - user_profiles: perfiles de usuario
    - model_name: (opcional) nombre del modelo a utilizar
    """
    data = request.json
    
    if not data:
        return jsonify({"error": "Se requiere un cuerpo JSON válido"}), 400
    
    # Obtener datos del cuerpo JSON
    product_info = data.get('product_info')
    user_profiles = data.get('user_profiles')
    model_name = data.get('model_name', None)
    
    if not product_info:
        return jsonify({"error": "Se requiere product_info en el cuerpo de la petición"}), 400
    
    if not user_profiles:
        return jsonify({"error": "Se requiere user_profiles en el cuerpo de la petición"}), 400
    
    try:
        execute_phase3(product_info, user_profiles, model_name)
        return jsonify({"status": "success", "message": "Fase 3 completada correctamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@reviews_bp.route('/phase4', methods=['POST'])
def phase4_analyze_reviews():
    """
    Fase 4: Compilar reseñas y generar informe final
    
    Espera un JSON con:
    - model_name: (opcional) nombre del modelo a utilizar
    """
    data = request.json
    model_name = data.get('model_name', None) if data else None
    
    try:
        # Verificar que existen reseñas
        reviews = get_reviews()
        
        if not reviews:
            return jsonify({"error": "No se ha ejecutado la fase 3 o no hay reseñas generadas"}), 400
        
        execute_phase4(model_name)
        return jsonify({"status": "success", "message": "Fase 4 completada correctamente"}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@reviews_bp.route('/analyze-all', methods=['POST'])
def analyze_product_all_phases():
    """
    Ejecutar todas las fases en secuencia
    
    Espera un JSON con:
    - product_url: URL del producto
    - num_reviewers: (opcional) número de reseñadores a crear
    - model_name: (opcional) nombre del modelo a utilizar
    """
    data = request.json
    
    if not data or 'product_url' not in data:
        return jsonify({"error": "Se requiere la URL del producto"}), 400
    
    product_url = data['product_url']
    num_reviewers = data.get('num_reviewers', 3)
    model_name = data.get('model_name', None)
    
    try:
        # Primero limpiar la carpeta de outputs
        clean_outputs()
        
        # Ejecutar fase 1
        execute_phase1(product_url, model_name)
        
        # Ejecutar fase 2
        phase2_results = execute_phase2(num_reviewers, model_name)
        
        # Ejecutar fase 3
        phase3_results = execute_phase3(get_product_info(), get_reviewer_profiles(), model_name)
        
        # Ejecutar fase 4
        execute_phase4(model_name)
        
        return jsonify({"status": "success", "message": "Análisis completo finalizado correctamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@reviews_bp.route('/results', methods=['GET'])
def get_results():
    """Obtener todos los resultados generados hasta el momento"""
    return jsonify(get_all_results())

@reviews_bp.route('/product', methods=['GET'])
def get_product():
    """Obtener la información del producto analizado"""
    return jsonify(get_product_info())

@reviews_bp.route('/reviewers', methods=['GET'])
def get_reviewers():
    """Obtener perfiles de los reseñadores"""
    return jsonify(get_reviewer_profiles())

@reviews_bp.route('/reviews', methods=['GET'])
def get_all_reviews():
    """Obtener todas las reseñas generadas"""
    return jsonify(get_reviews())

@reviews_bp.route('/analysis', methods=['GET'])
def get_results_analysis():
    """Obtener el análisis final de las reseñas"""
    return jsonify(get_analysis()) 