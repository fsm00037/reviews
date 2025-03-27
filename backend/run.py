#!/usr/bin/env python3
"""
Script para iniciar la API Flask que sirve como backend del simulador de reviews.
"""

import os
import sys
from pathlib import Path

# Añadir el directorio raíz al path para importar desde la carpeta backend
root_dir = Path(__file__).resolve().parent
sys.path.append(str(root_dir))

# Importar la aplicación Flask
from app import app

if __name__ == "__main__":
    # Configurar el puerto desde una variable de entorno o usar 5000 como default
    port = int(os.environ.get("PORT", 5000))
    
    print(f"Iniciando API del Simulador de Reviews...")
    print(f"API disponible en: http://localhost:{port}")
    print(f"Accede a la documentación de la API en la sección README.md")
    
    # Iniciar la aplicación Flask
    app.run(host="0.0.0.0", port=port, debug=True) 