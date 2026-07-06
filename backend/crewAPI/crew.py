import warnings
import os
import json
import re
from crewai import Crew, Process, LLM
from typing import Dict, Any, List, Union
import config
import solucionadorError
from agents import (
    create_llm,
    create_product_info_agent,
    create_user_creator_agent,
    create_reviewer_agents,
    create_compiler_agent
)
from tasks import (
    create_product_info_task,
    create_user_profile_task,
    create_reviewer_tasks,
    create_compiler_task
)
from models import APIRequest, APIResponse, Product, BotProfile, Review, AnalysisResult

# Warning control
warnings.filterwarnings('ignore')

solucionadorError.deshabilitar_opentelemetry()

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

def run_phase1(product_url: str, model_name: str = None, session_dir: str = None) -> Dict[str, Any]:
    """Run phase 1: Extract product info"""
    # Create LLM instance
    llm = create_llm(model_name)
    
    # Create product info agent
    product_info_agent = create_product_info_agent(llm)
    
    # Use session-specific file if session_dir is provided
    output_file = os.path.join(session_dir, "producto.json") if session_dir else config.PRODUCT_INFO_FILE
    
    # Create product info task
    product_info_task = create_product_info_task(product_url, product_info_agent, output_file=output_file)
    
    # Create and run product info crew
    product_crew = Crew(
        agents=[product_info_agent],
        tasks=[product_info_task],
        verbose=False,
        process=Process.sequential
    )
    
    # Run the crew and get the Product object directly
    product_results = product_crew.kickoff()
    print("Fase 1: ", product_results.token_usage)
    
    return product_results
    

def run_phase2(num_reviewers: int, profile_parameters: Dict[str, Any], model_name: str = None, session_dir: str = None, on_profile_generated = None) -> Dict[str, Any]:
    """Run phase 2: Create user profiles sequentially"""
    # Create LLM instance
    llm = create_llm(model_name)
    
    # Create user creator agent
    user_creator_agent = create_user_creator_agent(llm)
    
    profiles = []
    
    if num_reviewers > 0:
        # Load product info if adapt_to_product is enabled
        adapt_to_product = profile_parameters.get("adapt_to_product", False)
        product_instructions = ""
        if adapt_to_product:
            product_info = {}
            # Primero intentar buscar el producto de sesión
            product_file = os.path.join(session_dir, "producto.json") if session_dir else config.PRODUCT_INFO_FILE
            try:
                if os.path.exists(product_file):
                    with open(product_file, 'r', encoding='utf-8') as f:
                        product_info = json.load(f)
            except Exception as e:
                print(f"Error loading product info for profile generation: {e}")
                
            if product_info:
                product_instructions = f"""
                IMPORTANTE - ADAPTACIÓN AL PRODUCTO (CLIENTES TARGET):
                Crea perfiles que representen a clientes objetivo (target customers) lógicos para el siguiente producto:
                - Nombre: {product_info.get('name', 'N/A')}
                - Categoría: {product_info.get('category', 'N/A')}
                - Descripción: {product_info.get('description', 'N/A')}
                - Precio: {product_info.get('price', 'N/A')}
                
                Analiza el tipo de producto para deducir qué datos demográficos e intereses/rasgos de personalidad serían coherentes para las personas que lo comprarían y usarían.
                """
                
        for i in range(1, num_reviewers + 1):
            print(f"Generando perfil {i} de {num_reviewers}...")
            # Archivo temporal para este perfil individual
            temp_output_file = os.path.join(session_dir, f"reviewer_temp_{i}.json") if session_dir else os.path.join(config.OUTPUT_DIR, f"reviewer_temp_{i}.json")
            
            task = create_user_profile_task(
                profile_parameters=profile_parameters,
                agent=user_creator_agent,
                index=i,
                total=num_reviewers,
                existing_profiles=profiles,
                output_file=temp_output_file,
                product_instructions=product_instructions
            )
            
            crew = Crew(
                agents=[user_creator_agent],
                tasks=[task],
                verbose=False,
                process=Process.sequential
            )
            
            crew_result = crew.kickoff()
            
            profile_dict = {}
            if os.path.exists(temp_output_file):
                try:
                    with open(temp_output_file, 'r', encoding='utf-8') as f:
                        profile_dict = json.load(f)
                except Exception as e:
                    print(f"Error loading temp profile file: {e}")
            
            if not profile_dict:
                try:
                    profile_dict = crew_result.json_dict
                except Exception:
                    pass
                    
            if profile_dict:
                profiles.append(profile_dict)
                # Ejecutar callback si se proporciona (guardar en base de datos en tiempo real)
                if on_profile_generated:
                    try:
                        on_profile_generated(profiles)
                    except Exception as e:
                        print(f"Error in on_profile_generated callback: {e}")
            
            # Limpiar archivo temporal
            if os.path.exists(temp_output_file):
                try:
                    os.remove(temp_output_file)
                except Exception:
                    pass
        
        # Guardar lista final en reviewers.json
        output_file = os.path.join(session_dir, "reviewers.json") if session_dir else config.USER_PROFILES_FILE
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump({"profiles": profiles}, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving final user profiles file: {e}")
            
    # Devolver estructura compatible
    return {"profiles": profiles}

def run_phase3(product_info: Dict[str, Any], user_profiles: List[Dict[str, Any]], model_name: str = None, session_dir: str = None, on_review_generated = None) -> Dict[str, Any]:
    """Run phase 3: Generate reviews sequentially"""
    # Create LLM instance
    llm = create_llm(model_name)
    
    # Use session-specific files if session_dir is provided
    target_reviews_dir = os.path.join(session_dir, "reviews") if session_dir else config.REVIEWS_DIR
    os.makedirs(target_reviews_dir, exist_ok=True)
    
    # Import tasks dynamically
    from tasks import create_reviewer_task
    
    reviews_generated = []
    
    for i, profile in enumerate(user_profiles):
        print(f"Generando reseña {i+1} de {len(user_profiles)}...")
        
        try:
            # Create a single reviewer agent for this profile
            reviewer_agents = create_reviewer_agents([profile], llm)
            agent = reviewer_agents[0]
            
            # Create a single task for this profile
            task = create_reviewer_task(product_info, profile, agent, i, target_reviews_dir)
            
            # Run task
            crew = Crew(
                agents=[agent],
                tasks=[task],
                verbose=False,
                process=Process.sequential
            )
            
            crew.kickoff()
            
            # Load the generated review
            review_file_path = os.path.join(target_reviews_dir, f"review_{i}.json")
            if os.path.exists(review_file_path):
                with open(review_file_path, 'r', encoding='utf-8') as f:
                    review_content = json.load(f)
                    
                    # Convert to Review and to dict for normalization
                    try:
                        review_obj = Review(**review_content)
                        review_data = review_obj.to_dict()
                    except Exception:
                        review_data = review_content
                        
                    reviews_generated.append(review_data)
                    
                    if on_review_generated:
                        try:
                            on_review_generated(reviews_generated)
                        except Exception as e:
                            print(f"Error in on_review_generated callback: {e}")
        except Exception as e:
            print(f"⚠️ Error al generar reseña para bot {profile.get('name')}: {e}")
            # Continuar con el siguiente bot
            continue
            
    try:
        reviews_list = load_reviews(target_reviews_dir)
        reviews_data = [r.to_dict() if hasattr(r, 'to_dict') else r.dict() for r in reviews_list]
        
        # Guardar en reviews.json de compatibilidad
        output_reviews_json = os.path.join(session_dir, 'reviews.json') if session_dir else os.path.join(config.OUTPUT_DIR, 'reviews.json')
        with open(output_reviews_json, 'w', encoding='utf-8') as json_file:
            json.dump({"reviews": reviews_data}, json_file, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"Error loading reviews at end of Phase 3: {e}")
        reviews_data = reviews_generated
        
    return {"reviews": reviews_data}

def run_phase4(model_name: str = None, session_dir: str = None) -> Dict[str, Any]:
    """Run phase 4: Compile reviews and generate final report"""
    # Create LLM instance
    llm = create_llm(model_name)
    
    # Use session-specific file if session_dir is provided
    target_reviews_dir = os.path.join(session_dir, "reviews") if session_dir else config.REVIEWS_DIR
    output_file = os.path.join(session_dir, "informe_final.json") if session_dir else config.FINAL_REPORT_FILE
    
    # Create compiler agent
    compiler_agent = create_compiler_agent(llm, reviews_dir=target_reviews_dir)
    
    # Create compiler task
    compiler_task = create_compiler_task(compiler_agent, final_report_file=output_file, reviews_dir=target_reviews_dir)
    
    # Create and run crew
    compiler_crew = Crew(
        agents=[compiler_agent],
        tasks=[compiler_task],
        verbose=False,
        process=Process.sequential
    )
    
    # Run the crew and get the AnalysisResult object directly
    phase4_results = compiler_crew.kickoff()
    print("Fase 4: ", phase4_results.token_usage)
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