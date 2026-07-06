import json
import os
from crewai import Task, Agent
from typing import List, Dict, Any
import config
from models import Product, BotProfile, Review, AnalysisResult, UserProfilesResponse



def create_product_info_task(product_url: str, agent: Agent, output_file: str = config.PRODUCT_INFO_FILE):
    """Create and return the product information task"""
    
    return Task(
        description=f"""
        1. Visita la URL: {product_url}
        2. Extrae toda la información disponible sobre el producto
        3. Estructura la información en un formato JSON que incluya:
           - name: nombre del producto
           - description: descripción detallada
           - main_features: lista de diccionarios con características principales
           - technical_specs: lista de diccionarios con especificaciones técnicas 
           - price: precio como string
           - category: categoría del producto
           - image: URL de la imagen del producto
           - rating: valoración general (si está disponible)
        4. Asegúrate de que la información sea precisa y esté bien organizada en formato JSON
        """,
        agent=agent,
        expected_output="Un objeto JSON con información detallada del producto",
        output_file=output_file,
        output_json=Product
    )

def create_user_profile_task(profile_parameters: Dict[str, Any], agent: Agent, index: int, total: int, existing_profiles: List[Dict[str, Any]], output_file: str, product_instructions: str = ""):
    """Create and return a task to generate a single user profile"""
    existing_info = ""
    if existing_profiles:
        existing_info = f"\nPERFILES YA GENERADOS (Evita repetir nombres, biografías o trasfondos similares):\n"
        for p in existing_profiles:
            existing_info += f"- {p.get('name')} ({p.get('gender')}, {p.get('age')} años) de {p.get('location')}. Bio: {p.get('bio')}\n"
            
    return Task(
        description=f"""
        1. Genera un (1) único perfil de usuario realista y detallado para evaluar el producto. Este es el perfil {index} de un total de {total} perfiles a generar.
        {product_instructions}
        2. El perfil debe crearse considerando estos rangos demográficos y de personalidad de la población (de 0 a 100): {json.dumps(profile_parameters, ensure_ascii=False)}
        {existing_info}
        3. El perfil de usuario generado debe estar en formato JSON e incluir:
           - id: un número único (usa {index})
           - name: nombre completo en español (nombre y apellido realistas)
           - avatar: una URL de imagen de perfil ficticia
           - bio: una biografía breve
           - age: edad (número entero)
           - location: ubicación en España (ej. Madrid, Barcelona, Sevilla, Valencia...)
           - gender: género (Male, Female o Other)
           - education_level: nivel educativo
           - personality: un objeto con rasgos de personalidad (valores de 0 a 100):
             * introvert_extrovert
             * analytical_creative
             * busy_free_time
             * disorganized_organized
             * independent_cooperative
             * environmentalist
             * safe_risky
           - backstory: historia detallada del usuario con su experiencia, intereses y motivaciones.
        4. El perfil debe ser original, diverso y complementar a los perfiles ya generados.
        """,
        agent=agent,
        expected_output="Un único perfil de usuario en formato JSON en español",
        output_file=output_file,
        output_json=BotProfile
    )

def create_reviewer_task(product_info: Dict[str, Any], profile: Dict[str, Any], agent: Agent, index: int, reviews_dir: str = config.REVIEWS_DIR):
    """Create and return a reviewer task based on a user profile"""
    review_file = os.path.join(reviews_dir, f"review_{index}.json")
    
    return Task(
        description=f"""
        1. Revisa la siguiente información de producto: {json.dumps(product_info, ensure_ascii=False)}
        2. Evalúa el producto desde la perspectiva de tu perfil personal: {json.dumps(profile, ensure_ascii=False)}
        3. Genera una reseña en formato JSON que incluya:
           - id: un número único (usa {index})
           - bot_id: el ID del perfil del usuario ({profile.get('id', index)})
           - product_id: 1
           - rating: una puntuación de 1 a 5 estrellas
           - title: un título breve y descriptivo
           - content: el contenido detallado de la review
        """,
        agent=agent,
        expected_output="Una reseña detallada del producto desde la perspectiva del usuario en formato JSON",
        output_file=review_file,
        output_json=Review
    )

def create_reviewer_tasks(product_info: Dict[str, Any], profiles: List[Dict[str, Any]], agents: List[Agent], reviews_dir: str = config.REVIEWS_DIR) -> List[Task]:
    """Create and return a list of reviewer tasks based on user profiles"""
    tasks = []
    for i, (profile, agent) in enumerate(zip(profiles, agents)):
        tasks.append(create_reviewer_task(product_info, profile, agent, i, reviews_dir))
    return tasks

def create_compiler_task(agent: Agent, final_report_file: str = config.FINAL_REPORT_FILE, reviews_dir: str = config.REVIEWS_DIR):
    """Create and return the review compiler task"""
    return Task(
        description=f"""
        1. Estudia y analiza las reseñas de los usuarios en formato JSON del directorio {reviews_dir}
        2. Organiza la información en un formato JSON claro y estructurado
        3. Calcula la valoración media del producto
        4. Destaca puntos fuertes y débiles mencionados con frecuencia
        5. Genera un resumen general de las opiniones
        6. Sugiere cómo se podría mejorar el producto
        7. El resultado debe tener la siguiente estructura:
           - average_rating: valoración media (número)
           - rating_distribution: lista con 5 números (cantidad de reseñas con 1, 2, 3, 4 y 5 estrellas)
           - positive_points: lista de puntos positivos
           - negative_points: lista de puntos negativos
           - keyword_analysis: lista de objetos con word, count, sentiment
           - demographic_insights: lista de insights demográficos
        """,
        agent=agent,
        expected_output="Un informe completo con el análisis de las reseñas en formato JSON en español",
        output_file=final_report_file,
        output_json=AnalysisResult
    ) 