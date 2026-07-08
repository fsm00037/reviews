import warnings
import os
import json
import re
import threading
import concurrent.futures
import litellm
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

class LiteLLMResult:
    def __init__(self, data: dict):
        self.data = data
        
    @property
    def json_dict(self):
        return self.data
        
    @property
    def raw(self):
        return json.dumps(self.data)
        
    def to_dict(self):
        return self.data
        
    def dict(self):
        return self.data
        
    def __getitem__(self, key):
        return self.data[key]
        
    def __setitem__(self, key, value):
        self.data[key] = value
        
    def __delitem__(self, key):
        del self.data[key]
        
    def __contains__(self, key):
        return key in self.data
        
    def __iter__(self):
        return iter(self.data)
        
    def __len__(self):
        return len(self.data)
        
    def get(self, key, default=None):
        return self.data.get(key, default)

def get_litellm_params(model_name: str = None) -> dict:
    """Obtiene los parámetros correctos de modelo, api_key y api_base para litellm"""
    if config.OPENAI_API_BASE and config.OPENAI_API_KEY:
        raw_model = model_name or config.OPENAI_MODEL_NAME
        if not raw_model.startswith("openai/"):
            model = f"openai/{raw_model}"
        else:
            model = raw_model
        return {
            "model": model,
            "api_base": config.OPENAI_API_BASE,
            "api_key": config.OPENAI_API_KEY
        }
    else:
        model = model_name or config.DEFAULT_MODEL
        params = {
            "model": model
        }
        if config.GEMINI_API_KEY:
            params["api_key"] = config.GEMINI_API_KEY
        return params

def call_llm_json(prompt: str, response_model: type, model_name: str = None, temperature: float = 1.0) -> dict:
    """
    Realiza una llamada a litellm solicitando una respuesta JSON y la valida contra el Pydantic model.
    """
    params = get_litellm_params(model_name)
    schema_desc = json.dumps(response_model.model_json_schema(), ensure_ascii=False, indent=2)
    
    system_prompt = (
        "Eres un asistente automatizado. Tu tarea es responder ÚNICAMENTE en formato JSON.\n"
        f"El JSON devuelto debe cumplir estrictamente con el siguiente esquema JSON:\n{schema_desc}\n"
        "No agregues texto explicativo, ni introducciones, ni comentarios adicionales fuera del bloque JSON."
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ]
    
    try:
        completion_response = litellm.completion(
            messages=messages,
            temperature=temperature,
            **params
        )
        content = completion_response.choices[0].message.content
        cleaned_content = content.strip()
        
        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', cleaned_content)
        if match:
            cleaned_content = match.group(1).strip()
        else:
            start_idx = cleaned_content.find('{')
            end_idx = cleaned_content.rfind('}')
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                cleaned_content = cleaned_content[start_idx:end_idx+1]
                
        data = json.loads(cleaned_content)
        validated_obj = response_model(**data)
        return validated_obj.model_dump() if hasattr(validated_obj, "model_dump") else validated_obj.dict()
    except Exception as e:
        print(f"Error parseando o validando JSON: {e}. Contenido crudo intentado: {content if 'content' in locals() else 'N/A'}")
        print("Reintentando llamada al modelo para obtener JSON válido...")
        if 'content' in locals():
            messages.append({"role": "assistant", "content": content})
        messages.append({"role": "user", "content": f"El JSON anterior no es válido o no cumple con el esquema debido a: {str(e)}. Por favor, vuelve a generar el JSON correctamente, asegurando que todos los campos requeridos estén presentes y tengan el tipo adecuado."})
        
        retry_response = litellm.completion(
            messages=messages,
            temperature=temperature,
            **params
        )
        retry_content = retry_response.choices[0].message.content
        cleaned_content = retry_content.strip()
        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', cleaned_content)
        if match:
            cleaned_content = match.group(1).strip()
        else:
            start_idx = cleaned_content.find('{')
            end_idx = cleaned_content.rfind('}')
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                cleaned_content = cleaned_content[start_idx:end_idx+1]
                
        data = json.loads(cleaned_content)
        validated_obj = response_model(**data)
        return validated_obj.model_dump() if hasattr(validated_obj, "model_dump") else validated_obj.dict()

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
    
    # Do NOT write output to file on disk (set output_file to None)
    output_file = None
    
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

def run_phase2(num_reviewers: int, profile_parameters: Union[Dict[str, Any], str] = None, model_name: str = None, session_dir: str = None, on_profile_generated = None) -> Dict[str, Any]:
    """Run phase 2: Create user profiles in parallel using LiteLLM"""
    if isinstance(profile_parameters, str):
        model_name = profile_parameters
        profile_parameters = {}
    elif profile_parameters is None:
        profile_parameters = {}
        
    profiles = []
    db_lock = threading.Lock()
    
    if num_reviewers > 0:
        adapt_to_product = profile_parameters.get("adapt_to_product", False)
        product_instructions = ""
        if adapt_to_product:
            from api.utils import db
            try:
                session_id = os.path.basename(session_dir) if session_dir else "default-session"
                product_info = db.get_product(session_id)
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
            except Exception as e:
                print(f"Error loading product info from DB for profile generation: {e}")

        def generate_single_profile(index: int):
            from faker import Faker
            
            # Determinar género basado en la proporción demográfica
            demographics = profile_parameters.get("demographics", {})
            gender_ratio = demographics.get("gender_ratio", "Male&Female")
            
            if gender_ratio == "Male":
                gender = "Male"
            elif gender_ratio == "Female":
                gender = "Female"
            else:
                # Distribuir equitativamente alternando según el índice
                gender = "Male" if index % 2 == 0 else "Female"
                
            # Generar nombre español realista con Faker
            fake = Faker('es_ES')
            first_name = fake.first_name_male() if gender == "Male" else fake.first_name_female()
            last_name = fake.last_name()
            generated_name = f"{first_name} {last_name}"
            
            population_prompt_instruction = ""
            population_prompt = profile_parameters.get("population_prompt", "")
            if population_prompt:
                population_prompt_instruction = f"""
                IMPORTANTE - DESCRIPCIÓN DE LA POBLACIÓN REQUERIDA POR EL USUARIO:
                El usuario ha descrito el tipo de población con el siguiente prompt:
                "{population_prompt}"
                Diseña este perfil de forma que sea totalmente coherente y cumpla con la descripción anterior.
                """
                
            prompt = f"""
            Genera un (1) único perfil de usuario realista y detallado para evaluar un producto en español.
            Este es el perfil {index} de un total de {num_reviewers} perfiles a generar.
            
            DEBES usar estrictamente el siguiente nombre y género predeterminados para este perfil:
            - Nombre completo: {generated_name}
            - Género: {gender}
            
            {product_instructions}
            {population_prompt_instruction}
            El perfil debe crearse considerando estos rasgos demográficos y de personalidad de la población (de 0 a 100):
            {json.dumps(profile_parameters, ensure_ascii=False)}
            
            Asegúrate de que el perfil generado sea original, diverso y diferente a otros perfiles típicos.
            El perfil de usuario debe incluir:
            - id: un número único (usa {index})
            - name: {generated_name}
            - bio: una biografía breve
            - age: edad (número entero)
            - location: ubicación en España (ej. Madrid, Barcelona, Sevilla, Valencia...)
            - gender: {gender}
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
            """
            try:
                profile_dict = call_llm_json(prompt, BotProfile, model_name=model_name, temperature=1.2)
                # Forzar el nombre y género generados por Faker para evitar desviaciones
                profile_dict["name"] = generated_name
                profile_dict["gender"] = gender
                
                with db_lock:
                    profiles.append(profile_dict)
                    # Ordenar perfiles por id
                    profiles.sort(key=lambda x: x.get('id', 0))
                    if on_profile_generated:
                        try:
                            # Hacemos una copia profunda/lista nueva para evitar race conditions
                            on_profile_generated(list(profiles))
                        except Exception as e:
                            print(f"Error in on_profile_generated callback: {e}")
                return profile_dict
            except Exception as e:
                print(f"Error generador de perfil {index}: {e}")
                return None

        with concurrent.futures.ThreadPoolExecutor(max_workers=min(num_reviewers, 10)) as executor:
            executor.map(generate_single_profile, range(1, num_reviewers + 1))
            
    return LiteLLMResult({"profiles": sorted(profiles, key=lambda x: x.get('id', 0))})

def run_phase3(product_info: Dict[str, Any], user_profiles: List[Dict[str, Any]], model_name: str = None, session_dir: str = None, on_review_generated = None) -> Dict[str, Any]:
    """Run phase 3: Generate reviews in parallel using LiteLLM"""
    reviews_generated = []
    db_lock = threading.Lock()
    
    def generate_single_review(args):
        i, profile = args
        try:
            prompt = f"""
            Evalúa el siguiente producto desde la perspectiva de tu perfil personal de usuario.
            
            Información del producto:
            {json.dumps(product_info, ensure_ascii=False, indent=2)}
            
            Perfil de usuario (Tú):
            {json.dumps(profile, ensure_ascii=False, indent=2)}
            
            Genera una reseña realista que refleje tu personalidad, motivaciones e intereses detallados en tu perfil.
            La reseña debe estar en formato JSON e incluir:
            - id: un número único (usa {i})
            - bot_id: el ID de tu perfil de usuario ({profile.get('id', i)})
            - product_id: 1
            - rating: una calificación de 1 a 5 estrellas (número entero)
            - title: un título breve y descriptivo para la reseña
            - content: el contenido detallado de la reseña
            """
            
            review_dict = call_llm_json(prompt, Review, model_name=model_name)
            
            with db_lock:
                reviews_generated.append(review_dict)
                reviews_generated.sort(key=lambda x: x.get('id', 0))
                if on_review_generated:
                    try:
                        on_review_generated(list(reviews_generated))
                    except Exception as e:
                        print(f"Error in on_review_generated callback: {e}")
            return review_dict
        except Exception as e:
            print(f"⚠️ Error al generar reseña para bot {profile.get('name')}: {e}")
            return None

    with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(user_profiles), 10)) as executor:
        list(executor.map(generate_single_review, enumerate(user_profiles)))
        
    return LiteLLMResult({"reviews": sorted(reviews_generated, key=lambda x: x.get('id', 0))})

def run_phase4(model_name: str = None, session_dir: str = None, reviews: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Run phase 4: Compile reviews and generate final report using LiteLLM"""
    from api.utils import db
    
    session_id = os.path.basename(session_dir) if session_dir else "default-session"
    
    if reviews is None:
        try:
            reviews = db.get_reviews(session_id)
        except Exception as e:
            print(f"Error fetching reviews from DB for Phase 4: {e}")
            reviews = []
            
    try:
        product_info = db.get_product(session_id)
    except Exception as e:
        print(f"Error fetching product info from DB for Phase 4: {e}")
        product_info = {}

    reviews_text = json.dumps(reviews, ensure_ascii=False, indent=2)
    product_text = json.dumps(product_info, ensure_ascii=False, indent=2)
    
    prompt = f"""
    Eres un compilador y analizador de reseñas de productos. Analiza el conjunto de reseñas dadas para el siguiente producto y genera un informe estructurado final.
    
    Información del producto:
    {product_text}
    
    Reseñas de los usuarios:
    {reviews_text}
    
    Tu informe debe ser un objeto JSON que incluya:
    - average_rating: valoración media (número decimal, ej. 4.2)
    - rating_distribution: un objeto con la distribución de estrellas (número de reseñas para 1, 2, 3, 4 y 5 estrellas). Campos obligatorios:
      * one_star: cantidad de reviews de 1 estrella
      * two_stars: cantidad de reviews de 2 estrellas
      * three_stars: cantidad de reviews de 3 estrellas
      * four_stars: cantidad de reviews de 4 estrellas
      * five_stars: cantidad de reviews de 5 estrellas
    - positive_points: una lista de strings con los puntos positivos más mencionados
    - negative_points: una lista de strings con los puntos negativos más mencionados
    - keyword_analysis: una lista de objetos, donde cada uno tiene:
      * word: la palabra clave extraída
      * count: frecuencia de aparición de la palabra clave
      * sentiment: sentimiento asociado ("positive", "negative" o "neutral")
    - demographic_insights: una lista de strings con insights sobre qué segmentos demográficos valoraron mejor o peor el producto.
    """
    
    analysis_dict = call_llm_json(prompt, AnalysisResult, model_name=model_name)
    
    # Calcular promedio y distribución de calificaciones programáticamente para máxima precisión
    if reviews:
        ratings = [r.get('rating', 0) for r in reviews if r.get('rating') is not None]
        avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0
        dist = {
            "one_star": ratings.count(1),
            "two_stars": ratings.count(2),
            "three_stars": ratings.count(3),
            "four_stars": ratings.count(4),
            "five_stars": ratings.count(5)
        }
    else:
        avg_rating = 0.0
        dist = {
            "one_star": 0,
            "two_stars": 0,
            "three_stars": 0,
            "four_stars": 0,
            "five_stars": 0
        }
        
    analysis_dict["average_rating"] = avg_rating
    analysis_dict["rating_distribution"] = dist
    
    return LiteLLMResult(analysis_dict)
    

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