# Importar los servicios
from api.services.crew_service import (
    execute_product_analysis, 
    execute_phase1,
    execute_phase2,
    execute_phase3,
    execute_phase4
)
from api.services.results_service import get_all_results, get_product_info, get_reviewer_profiles, get_reviews, get_analysis 