# Task definitions for product review system

from crewai import Task, Agent
import json
from typing import List, Dict, Any
import config
import os
from pydantic import BaseModel
from typing import Optional

def ensure_output_dir():
    """Ensure the output directory exists and initialize empty JSON files"""
    if not os.path.exists(config.OUTPUT_DIR):
        os.makedirs(config.OUTPUT_DIR)
    if not os.path.exists(config.REVIEWS_DIR):
        os.makedirs(config.REVIEWS_DIR)
        
    # Initialize empty JSON files with proper structure if they don't exist
    if not os.path.exists(config.USER_PROFILES_FILE):
        with open(config.USER_PROFILES_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)
            
    if not os.path.exists(config.PRODUCT_INFO_FILE):
        with open(config.PRODUCT_INFO_FILE, 'w', encoding='utf-8') as f:
            json.dump({
                "nombre": "",
                "descripción": "",
                "características_principales": [],
                "especificaciones_técnicas": {},
                "precio": "",
                "valoración_general": 0
            }, f, ensure_ascii=False, indent=2)
            
    if not os.path.exists(config.FINAL_REPORT_FILE):
        with open(config.FINAL_REPORT_FILE, 'w', encoding='utf-8') as f:
            json.dump({
                "valoración_media": 0,
                "resumen": "",
                "puntos_fuertes": [],
                "puntos_débiles": [],
                "sugerencias_mejora": []
            }, f, ensure_ascii=False, indent=2)

def create_product_info_task(product_url: str, agent: Agent):
    """Create and return the product information task"""
    ensure_output_dir()
    
    return Task(
        description=f"""
        1. Visita la URL: {product_url}
        2. Extrae toda la información disponible sobre el producto
        3. Estructura la información en un formato JSON que incluya:
           - nombre
           - descripción
           - características principales
           - especificaciones técnicas
           - precio
           - valoración general (si está disponible)
        4. Asegúrate de que la información sea precisa y esté bien organizada
        """,
        agent=agent,
        expected_output="Un objeto JSON con información detallada del producto",
        output_file=config.PRODUCT_INFO_FILE
    )

def create_user_profiles_task(num_reviewers: int, agent: Agent):
    """Create and return the user profiles creation task"""
    ensure_output_dir()
    
    return Task(
        description=f"""
        1. Genera {num_reviewers} perfiles de usuario diferentes para evaluar el producto
        2. Cada perfil debe incluir:
           - name
           - backstory (edad, ocupación, nivel de conocimiento tecnológico, hábitos de gasto...) en forma de párrafo
        3. Los perfiles deben ser diversos y representativos de diferentes segmentos de mercado
        """,
        agent=agent,
        expected_output=f"Una lista con {num_reviewers} perfiles de usuario en español en formato JSON",
        output_file=config.USER_PROFILES_FILE
    )

def create_reviewer_task(product_info: Dict[str, Any], profile: Dict[str, Any], agent: Agent, index: int):
    """Create and return a reviewer task based on a user profile"""
    review_file = os.path.join(config.REVIEWS_DIR, f"review_{index}.md")
    
    # Ensure the reviews directory exists
    if not os.path.exists(config.REVIEWS_DIR):
        os.makedirs(config.REVIEWS_DIR)
    
    return Task(
        description=f"""
        1. Revisa la siguiente información de producto: {json.dumps(product_info, ensure_ascii=False)}
        2. Evalúa el producto desde la perspectiva de tu perfil personal: {json.dumps(profile, ensure_ascii=False)}
        3. Genera una reseña detallada que incluya:
           - Tu impresión general
           - Lo que más te gustó
           - Lo que menos te gustó
           - Si recomendarías el producto
           - Una puntuación de 1 a 5 estrellas
        """,
        agent=agent,
        expected_output="Una reseña detallada del producto desde la perspectiva del usuario en formato markdown",
        output_file=review_file
        
    )

def create_reviewer_tasks(product_info: Dict[str, Any], profiles: List[Dict[str, Any]], agents: List[Agent]) -> List[Task]:
    """Create and return a list of reviewer tasks based on user profiles"""
    tasks = []
    for i, (profile, agent) in enumerate(zip(profiles, agents)):
        tasks.append(create_reviewer_task(product_info, profile, agent, i))
    return tasks

def create_compiler_task(agent: Agent):
    """Create and return the review compiler task"""
    
    # Create a directory reading tool to access review files
   
    
    return Task(
        description=f"""
        1. Estudia y analiza las reseñas de los usuarios en el directorio {config.REVIEWS_DIR}
        2. Organiza la información en un formato claro y estructurado
        3. Calcula la valoración media del producto
        4. Destaca puntos fuertes y débiles mencionados con frecuencia
        5. Genera un resumen general de las opiniones
        6. Sugiere cómo se podría mejorar el producto
        """,
        agent=agent,
        expected_output="Un informe completo con todas las reseñas y análisis en español y en formato markdown",
        output_file=config.FINAL_REPORT_FILE
    )