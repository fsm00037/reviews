import warnings
import os
import json
import re
from crewai import Crew, Process, LLM
from typing import Dict, Any, List, Union
import config
from agents import (
    create_llm,
    create_product_info_agent,
    create_user_creator_agent,
    create_reviewer_agents,
    create_compiler_agent
)
from tasks import (
    create_product_info_task,
    create_user_profiles_task,
    create_reviewer_tasks,
    create_compiler_task
)
from models import APIRequest, APIResponse, Product, BotProfile, Review, AnalysisResult

# Warning control
warnings.filterwarnings('ignore')

def load_json_file(file_path):
    """
    Carga y devuelve el contenido de un archivo JSON de manera segura.
    
    Args:
        file_path (str): Ruta al archivo JSON a cargar
        
    Returns:
        dict o list: Contenido del archivo JSON
        
    Raises:
        Exception: Si hay un error al leer o decodificar el archivo
    """
    try:
        # Verificar si el archivo existe y no está vacío
        if not os.path.exists(file_path):
            # Crear un archivo vacío con una estructura JSON válida
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump({}, f)
            return {}
            
        if os.path.getsize(file_path) == 0:
            # Si el archivo está vacío, devolver un diccionario vacío
            return {}
        
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                return data
            except json.JSONDecodeError as e:
                # Si el JSON no es válido, crear un nuevo archivo con JSON válido
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump({}, f)
                
                raise json.JSONDecodeError(
                    f"Invalid JSON in {file_path}: {str(e)}", "", e.pos
                )
    except Exception as e:
        # Si hay algún otro error, también crear un archivo con JSON válido
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump({}, f)
        except:
            pass
            
        raise Exception(f"Error reading {file_path}: {str(e)}")

def load_reviews(reviews_dir: str = config.REVIEWS_DIR) -> List[Review]:
    """Load all review files from the reviews directory"""
    reviews = []
    if os.path.exists(reviews_dir):
        for filename in os.listdir(reviews_dir):
            if filename.endswith('.json'):
                file_path = os.path.join(reviews_dir, filename)
                try:
                    with open(file_path, 'r', encoding='utf-8') as file:
                        content = json.load(file)
                        reviews.append(Review(**content))
                except Exception as e:
                    print(f"Error loading review file {filename}: {e}")
    return reviews

def run_phase1(product_url: str, model_name: str = None) -> Dict[str, Any]:
    """Run phase 1: Extract product info"""
    # Create LLM instance
    llm = create_llm(model_name)
    
    # Create product info agent
    product_info_agent = create_product_info_agent(llm)
    
    # Create product info task
    product_info_task = create_product_info_task(product_url, product_info_agent)
    
    # Create and run product info crew
    product_crew = Crew(
        agents=[product_info_agent],
        tasks=[product_info_task],
        verbose=True,
        process=Process.sequential
    )
    
    # Run the crew and get the Product object directly
    product_results = product_crew.kickoff()
    
    return product_results
    

def run_phase2(num_reviewers: int, model_name: str = None) -> Dict[str, Any]:
    """Run phase 2: Create user profiles"""
    # Ensure output directories exist
  
    
    # Create LLM instance
    llm = create_llm(model_name)
    
    # Create user creator agent
    user_creator_agent = create_user_creator_agent(llm)
    
    # Create user profiles only if num_reviewers > 0
    if num_reviewers > 0:
        # Create user profiles task
        user_profiles_task = create_user_profiles_task(num_reviewers, user_creator_agent)
        
        # Create and run user profiles crew
        user_crew = Crew(
            agents=[user_creator_agent],
            tasks=[user_profiles_task],
            verbose=True,
            process=Process.sequential
        )
        
        # Run the crew and get List[BotProfile] directly
        user_results = user_crew.kickoff()
        
    return user_results

def run_phase3(product_info: Dict[str, Any], user_profiles: List[Dict[str, Any]], model_name: str = None) -> Dict[str, Any]:
    """Run phase 3: Generate reviews"""
    # Ensure output directories exist
    print(user_profiles)
    # Create LLM instance
    llm = create_llm(model_name)
    
    
   
    # Create reviewer agents
    reviewer_agents = create_reviewer_agents(user_profiles, llm)
    
    # Create reviewer tasks
    reviewer_tasks = create_reviewer_tasks(product_info, user_profiles, reviewer_agents)
    
    # Create and run crew
    phase3_crew = Crew(
        agents=reviewer_agents,
        tasks=reviewer_tasks,
        verbose=True,
        process=Process.sequential
    )
    
    # Run the crew - each task produces a Review object
    phase3_crew.kickoff()
    
    # Load reviews
    try:
        reviews_list = load_reviews(config.REVIEWS_DIR)
        reviews = [review.model_dump() for review in reviews_list] if reviews_list else []
        with open(os.path.join(config.OUTPUT_DIR, 'reviews.json'), 'w', encoding='utf-8') as json_file:
            json.dump({"reviews": reviews}, json_file, ensure_ascii=False, indent=4)
    
    except Exception as e:
        print(f"Error loading reviews: {e}")
        reviews = []
    
    return reviews

def run_phase4(model_name: str = None) -> Dict[str, Any]:
    """Run phase 4: Compile reviews and generate final report"""
    # Ensure output directories exist
    
    # Create LLM instance
    llm = create_llm(model_name)
    
    # Create compiler agent
    compiler_agent = create_compiler_agent(llm)
    
    # Create compiler task
    compiler_task = create_compiler_task(compiler_agent)
    
    # Create and run crew
    compiler_crew = Crew(
        agents=[compiler_agent],
        tasks=[compiler_task],
        verbose=True,
        process=Process.sequential
    )
    
    # Run the crew and get the AnalysisResult object directly
    phase4_results = compiler_crew.kickoff()
    
    return phase4_results
    
    

def run_api(request: APIRequest) -> APIResponse:
    """
    Función API principal que ejecuta el proceso completo y devuelve los resultados en formato JSON.
    
    Args:
        request (APIRequest): Objeto de solicitud con los parámetros necesarios
    
    Returns:
        APIResponse: Objeto de respuesta con los resultados en formato JSON
    """
    # Ejecutar la fase 1: Extraer información del producto
    phase1_results = run_phase1(request.product_url, request.model_name)
    product_info = phase1_results.raw
    
    # Ejecutar la fase 2: Crear perfiles de usuario
    phase2_results = run_phase2(request.num_reviewers, request.model_name)
    user_profiles = phase2_results.to_dict()['profiles']
    
    # Ejecutar la fase 3: Generar reseñas
    phase3_results = run_phase3(product_info, user_profiles, request.model_name)
    reviews = phase3_results
    
    # Ejecutar la fase 4: Compilar reseñas y generar informe final
    phase4_results = run_phase4(request.model_name)
    analysis = phase4_results
    
    # Construir y devolver la respuesta API
    response = APIResponse(
        product=product_info,
        reviewers=user_profiles,
        reviews=reviews,
        analysis=analysis
    )
    
    return response

def main(product_url: str, num_reviewers: int = config.DEFAULT_NUM_REVIEWERS, model_name: str = None) -> Dict[str, Any]:
    """
    Ejecuta el proceso completo y devuelve los resultados.
    
    Args:
        product_url (str): URL del producto a analizar
        num_reviewers (int, optional): Número de reseñadores a crear. Default a config.DEFAULT_NUM_REVIEWERS.
        model_name (str, optional): Nombre del modelo LLM a utilizar. Default a None.
    
    Returns:
        Dict[str, Any]: Diccionario con todos los resultados del proceso
    """
    # Create API request object
    request = APIRequest(
        product_url=product_url,
        num_reviewers=num_reviewers,
        model_name=model_name
    )
    
    # Run the API function
    response = run_api(request)
    
    # Convert to dictionary
    return response.dict()

if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) > 1:
        url = sys.argv[1]
    else:
        url = config.EXAMPLE_URLS["ikea"]
        
    num_reviewers = int(sys.argv[2]) if len(sys.argv) > 2 else config.DEFAULT_NUM_REVIEWERS
    
    #results = main(url, num_reviewers)
    #run_phase2(10)
    main(url, num_reviewers)
    #print(json.dumps(results, ensure_ascii=False, indent=2)) 