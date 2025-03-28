import os
import json
from typing import Dict, Any, List, Optional

def get_outputs_dir():
    """Obtiene la ruta al directorio de salidas"""
    return os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "crewAPI", "outputs")

def load_json_file(file_path):
    """Carga un archivo JSON de manera segura"""
    try:
        if not os.path.exists(file_path):
            return {}
        
        if os.path.getsize(file_path) == 0:
            return {}
        
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    except Exception as e:
        print(f"Error al cargar archivo JSON {file_path}: {str(e)}")
        return {}

def get_product_info() -> Dict[str, Any]:
    """Obtiene la información del producto"""
    product_file = os.path.join(get_outputs_dir(), "producto.json")
    return load_json_file(product_file)

def get_reviewer_profiles() -> List[Dict[str, Any]]:
    """Obtiene los perfiles de los revisores"""
    reviewers_file = os.path.join(get_outputs_dir(), "reviewers.json")
    reviewers_data = load_json_file(reviewers_file)
    
    # Manejar dos formatos posibles de archivo de revisores
    if isinstance(reviewers_data, dict) and "profiles" in reviewers_data:
        return reviewers_data["profiles"]
    elif isinstance(reviewers_data, list):
        return reviewers_data
    else:
        return []

def get_reviews() -> List[Dict[str, Any]]:
    """Obtiene todas las reseñas generadas"""
    reviews_file = os.path.join(get_outputs_dir(), "reviews.json")
    reviews_data = load_json_file(reviews_file)
    
    # Manejar el formato del archivo de reseñas
    if isinstance(reviews_data, dict) and "reviews" in reviews_data:
        return reviews_data["reviews"]
    elif isinstance(reviews_data, list):
        return reviews_data
    else:
        return []

def get_analysis() -> Dict[str, Any]:
    """Obtiene el análisis final"""
    analysis_file = os.path.join(get_outputs_dir(), "informe_final.json")
    return load_json_file(analysis_file)

def get_all_results() -> Dict[str, Any]:
    """Obtiene todos los resultados generados"""
    return {
        "product": get_product_info(),
        "reviewers": get_reviewer_profiles(),
        "reviews": get_reviews(),
        "analysis": get_analysis()
    } 