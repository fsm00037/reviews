"""
Módulo crew - Simulador de reviews de productos

Este módulo proporciona funcionalidades para:
1. Generar perfiles de bots basados en parámetros demográficos
2. Generar reviews de productos usando esos perfiles
3. Analizar las reviews para obtener insights
"""

# Importar directamente los componentes importantes
from .tasks import (
    Product, 
    BotPersonality, 
    BotProfile, 
    Review, 
    KeywordAnalysis, 
    AnalysisResult
)

from .api_tasks import (
    generate_bot_profiles,
    generate_product_reviews,
    CrewSettings
)

# Versión del módulo
__version__ = '1.0.0' 