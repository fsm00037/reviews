from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from api.utils import db

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Nombre de usuario y contraseña requeridos"}), 400
        
    username = username.strip()
    if len(username) < 3:
        return jsonify({"error": "El nombre de usuario debe tener al menos 3 caracteres"}), 400
    if len(password) < 6:
        return jsonify({"error": "La contraseña debe tener al menos 6 caracteres"}), 400
        
    existing_user = db.get_user_by_username(username)
    if existing_user:
        return jsonify({"error": "El nombre de usuario ya está registrado"}), 400
        
    password_hash = generate_password_hash(password)
    user_id = db.create_user(username, password_hash)
    
    if not user_id:
        return jsonify({"error": "No se pudo crear el usuario"}), 500
        
    return jsonify({
        "message": "Usuario registrado con éxito",
        "user": {
            "id": user_id,
            "username": username
        }
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Nombre de usuario y contraseña requeridos"}), 400
        
    user = db.get_user_by_username(username.strip())
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({"error": "Credenciales inválidas"}), 401
        
    return jsonify({
        "message": "Inicio de sesión exitoso",
        "user": {
            "id": user['id'],
            "username": user['username']
        }
    }), 200

@auth_bp.route('/me', methods=['GET'])
def me():
    user_id_header = request.headers.get("X-User-Id")
    if not user_id_header:
        return jsonify({"error": "No autorizado"}), 401
        
    try:
        user_id = int(user_id_header)
        user = db.get_user_by_id(user_id)
        if not user:
            return jsonify({"error": "Usuario no encontrado"}), 404
        return jsonify({"user": user}), 200
    except ValueError:
        return jsonify({"error": "ID de usuario inválido"}), 400
