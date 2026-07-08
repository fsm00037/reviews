from flask import Blueprint, request, jsonify
from api.utils import db

populations_bp = Blueprint('populations', __name__, url_prefix='/api/populations')

def get_user_id():
    user_id_header = request.headers.get("X-User-Id")
    if user_id_header:
        try:
            return int(user_id_header)
        except ValueError:
            pass
    return None

@populations_bp.route('', methods=['GET'])
def list_populations():
    user_id = get_user_id()
    if not user_id:
        return jsonify({"error": "No autorizado"}), 401
        
    pops = db.get_saved_populations(user_id)
    return jsonify(pops), 200

@populations_bp.route('', methods=['POST'])
def save_new_population():
    user_id = get_user_id()
    if not user_id:
        return jsonify({"error": "No autorizado"}), 401
        
    data = request.get_json() or {}
    name = data.get('name')
    description = data.get('description', '')
    num_reviewers = data.get('num_reviewers')
    profile_parameters = data.get('profile_parameters')
    
    if not name or not num_reviewers or not profile_parameters:
        return jsonify({"error": "Faltan campos obligatorios (name, num_reviewers, profile_parameters)"}), 400
        
    try:
        num_reviewers = int(num_reviewers)
    except ValueError:
        return jsonify({"error": "num_reviewers debe ser un número entero"}), 400
        
    pop_id = db.save_population(user_id, name, description, num_reviewers, profile_parameters)
    return jsonify({
        "message": "Población guardada con éxito",
        "id": pop_id
    }), 201

@populations_bp.route('/<int:pop_id>', methods=['DELETE'])
def delete_population(pop_id):
    user_id = get_user_id()
    if not user_id:
        return jsonify({"error": "No autorizado"}), 401
        
    success = db.delete_saved_population(pop_id, user_id)
    if not success:
        return jsonify({"error": "No se pudo encontrar o eliminar la población"}), 404
        
    return jsonify({"message": "Población eliminada con éxito"}), 200
