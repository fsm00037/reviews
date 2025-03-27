"""
CrewAPI Module - API JSON para el sistema de revisiones de productos
"""

from .models import (
    Product,
    BotPersonality,
    BotProfile,
    Review,
    KeywordAnalysis,
    AnalysisResult,
    APIRequest,
    APIResponse
)

from .crew import (
    run_api,
    main,
    run_phase1,
    run_phase2,
    run_phase3,
    run_phase4
)

__all__ = [
    # Models
    'Product',
    'BotPersonality',
    'BotProfile',
    'Review',
    'KeywordAnalysis',
    'AnalysisResult',
    'APIRequest',
    'APIResponse',
    
    # API functions
    'run_api',
    'main',
    'run_phase1',
    'run_phase2',
    'run_phase3',
    'run_phase4'
] 