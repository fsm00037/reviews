import os
import json
from typing import Dict, Any, List, Optional
from api.utils import db

def get_product_info(session_id: str = "default-session") -> Dict[str, Any]:
    """Obtiene la información del producto desde SQLite"""
    return db.get_product(session_id)

def get_reviewer_profiles(session_id: str = "default-session") -> List[Dict[str, Any]]:
    """Obtiene los perfiles de los revisores desde SQLite"""
    return db.get_reviewers(session_id)

def get_reviews(session_id: str = "default-session") -> List[Dict[str, Any]]:
    """Obtiene todas las reseñas generadas desde SQLite"""
    return db.get_reviews(session_id)

def get_analysis(session_id: str = "default-session") -> Dict[str, Any]:
    """Obtiene el análisis final desde SQLite"""
    return db.get_analysis(session_id)

def get_all_results(session_id: str = "default-session") -> Dict[str, Any]:
    """Obtiene todos los resultados generados para la sesión"""
    return {
        "product": get_product_info(session_id),
        "reviewers": get_reviewer_profiles(session_id),
        "reviews": get_reviews(session_id),
        "analysis": get_analysis(session_id)
    } 