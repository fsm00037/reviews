# Configuration file for product review system

import os

# API Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# LLM Configuration
DEFAULT_MODEL = "gemini/gemini-2.0-flash"

# File paths for intermediate results
OUTPUT_DIR = "backend/crew/outputs"
PRODUCT_INFO_FILE = f"{OUTPUT_DIR}/producto.json"
USER_PROFILES_FILE = f"{OUTPUT_DIR}/reviewers.json"
REVIEWS_DIR = f"{OUTPUT_DIR}/reviews"
FINAL_REPORT_FILE = f"{OUTPUT_DIR}/informe_final.md"

# Default parameters
DEFAULT_NUM_REVIEWERS = 3

# Example product URLs for testing
EXAMPLE_URLS = {
    "ikea": "https://www.ikea.com/es/es/p/tradfri-kit-basico-iluminacion-inteligente-regulac-lumin-inalambr-color-espectro-blanco-10547603/",
    "coche": "https://www.flexicar.es/coches-ocasion/audi-a3-sportback-20-tdi-clean-150-quat-s-line-diesel-manual-barakaldo_903000000139395/",
    "electronica": "https://es.shein.com/1pc-3-In-1-SD-TF-USB-Memory-Card-Reader-Adapter-Compatible-With-IPhone-16-Pro-Max-16-Pro-16-Plus-16-15-14-13-12-11-XS-XR-8-7-6-S24-S23-S22-S21-IPad-Laptop-p-40261992.html"
}

# Agent configuration
AGENT_CONFIG = {
    "product_info": {
        "role": "Especialista en Análisis de Productos",
        "goal": "Extraer y estructurar información detallada de productos en formato JSON",
        "backstory": """Eres un experto en analizar productos online. Tu especialidad es extraer 
        información detallada y presentarla de manera estructurada y útil."""
    },
    "user_creator": {
        "role": "Creador de Perfiles de Usuario",
        "goal": "Generar perfiles de usuario realistas y diversos para evaluar productos",
        "backstory": """Eres un experto en demografía y comportamiento del consumidor. 
        Tu trabajo es crear perfiles de usuario diversos y realistas que representen diferentes 
        segmentos del mercado."""
    },
    "reviewer": {
        "role": "Crítico de Producto",
        "goal": "Evaluar el producto desde tu perspectiva personal y generar una reseña detallada",
        "backstory": "Personalizado según el perfil del usuario"
    },
    "compiler": {
        "role": "Compilador de Reseñas",
        "goal": "Recopilar y analizar todas las reseñas de usuario de manera organizada",
        "backstory": """Eres un especialista en análisis de datos y presentación de información.
        Tu trabajo es recopilar reseñas de productos, analizarlas y presentarlas de manera 
        clara y útil."""
    }
}