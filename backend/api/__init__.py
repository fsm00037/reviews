from flask import Flask
from flask_cors import CORS
import os

def create_app():
    """Función de fábrica para la aplicación Flask"""
    app = Flask(__name__)
    CORS(app)
    
    # Registrar rutas
    from api.routes.reviews import reviews_bp
    app.register_blueprint(reviews_bp)
    
    # Registrar manejadores de errores
    from api.utils.error_handlers import register_error_handlers
    register_error_handlers(app)
    
    # Asegurar que existen los directorios de salida
    output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "crewAPI", "outputs")
    reviews_dir = os.path.join(output_dir, "reviews")
    
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(reviews_dir, exist_ok=True)
    
    return app 