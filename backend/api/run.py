#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Punto de entrada principal para la API de análisis de productos.
Ejecuta este archivo para iniciar el servidor.
"""

import sys
import os

# Añadir los directorios necesarios al path de Python para resolver las importaciones
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
api_dir = os.path.abspath(os.path.dirname(__file__))
crewapi_dir = os.path.abspath(os.path.join(backend_dir, "crewAPI"))

# Añadir todas las rutas necesarias
sys.path.insert(0, project_root)
sys.path.insert(0, backend_dir)
sys.path.insert(0, api_dir)
sys.path.insert(0, crewapi_dir)

# Importar el módulo de la aplicación
from api import create_app

if __name__ == "__main__":
    print("Iniciando API de análisis de productos...")
    print(f"Python Path: {sys.path}")
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000) 