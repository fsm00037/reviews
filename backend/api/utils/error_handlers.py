from flask import jsonify
from werkzeug.exceptions import HTTPException

def register_error_handlers(app):
    """
    Registra manejadores de errores para la aplicación Flask
    
    Args:
        app: Instancia de la aplicación Flask
    """
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify(error=str(e)), 400
    
    @app.errorhandler(404)
    def not_found(e):
        return jsonify(error="Recurso no encontrado"), 404
    
    @app.errorhandler(500)
    def server_error(e):
        return jsonify(error="Error interno del servidor"), 500
    
    @app.errorhandler(Exception)
    def handle_exception(e):
        # Manejar excepciones no HTTP específicamente
        if isinstance(e, HTTPException):
            return jsonify(error=str(e)), e.code
        
        # Para cualquier otro tipo de error
        return jsonify(error=str(e)), 500 