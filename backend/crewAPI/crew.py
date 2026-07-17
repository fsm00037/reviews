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
from models import APIRequest, APIResponse, Product, BotProfile, Review, AnalysisResult, PopulationAgeRange
from realism import (
    enrich_profile,
    review_length_guidance,
    rating_bias_guidance,
    verbosity_label,
    sample_age,
    sample_education,
    sample_location,
)

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

def _clamp_age_range(lo: int, hi: int) -> tuple:
    lo = max(16, min(90, int(lo)))
    hi = max(16, min(90, int(hi)))
    if lo > hi:
        lo, hi = hi, lo
    # Evitar rangos degenerados (mismo año o 1 año)
    if hi - lo < 4:
        mid = (lo + hi) // 2
        lo = max(16, mid - 5)
        hi = min(90, mid + 5)
    return lo, hi


def decide_population_age_range(
    profile_parameters: Dict[str, Any],
    product_instructions: str = "",
    model_name: str = None,
) -> Dict[str, Any]:
    """
    El agente demógrafo decide el rango de edades de toda la población
    según prompt de usuario, producto y demografía (pista suave).
    """
    demographics = profile_parameters.get("demographics") or {}
    hint_range = demographics.get("age_range") or [22, 55]
    population_prompt = (profile_parameters.get("population_prompt") or "").strip()

    prompt = f"""
    Eres un demógrafo de market research. Debes decidir el RANGO DE EDADES
    (age_min, age_max) de una población sintética de consumidores para un test pre-lanzamiento.

    Contexto:
    - Prompt / descripción de la población (prioridad alta si existe):
      "{population_prompt or '(no hay prompt específico)'}"
    - Pista de demografía del UI (puedes IGNORARLA o ampliarla si el prompt o el producto lo exigen):
      age_range sugerido por el usuario: {hint_range}
      resto demografía: {json.dumps(demographics, ensure_ascii=False)}
    - Adaptación a producto / target (si hay):
      {product_instructions or '(sin producto concreto)'}

    Reglas:
    1. Tú decides el rango real de la población. No copies ciegamente el slider del usuario.
    2. Si el prompt habla de estudiantes, jubilados, padres, gamers, etc., el rango debe reflejarlo.
    3. Si hay producto, el rango debe ser coherente con compradores típicos de ese producto.
    4. age_min >= 16, age_max <= 85, y (age_max - age_min) >= 5 (población diversa, no un solo año).
    5. Si no hay señales claras, elige un rango realista de compradores adultos (p. ej. 22-55 o 28-65).
    6. rationale: 1 frase en español explicando por qué ese rango.

    Devuelve SOLO JSON del esquema PopulationAgeRange.
    """
    try:
        result = call_llm_json(prompt, PopulationAgeRange, model_name=model_name, temperature=0.7)
        lo, hi = _clamp_age_range(result.get("age_min", 22), result.get("age_max", 55))
        rationale = result.get("rationale") or ""
        print(f"📊 Rango de edades decidido por el agente: {lo}-{hi} ({rationale})")
        return {"age_min": lo, "age_max": hi, "rationale": rationale}
    except Exception as e:
        print(f"⚠️ No se pudo decidir rango de edades con LLM ({e}); usando pista demográfica.")
        lo, hi = _clamp_age_range(
            int(hint_range[0]) if isinstance(hint_range, (list, tuple)) and len(hint_range) >= 2 else 22,
            int(hint_range[1]) if isinstance(hint_range, (list, tuple)) and len(hint_range) >= 2 else 55,
        )
        return {
            "age_min": lo,
            "age_max": hi,
            "rationale": "Rango por defecto a partir de la demografía configurada.",
        }


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

        # El agente decide el rango de edades de TODA la población (una sola vez)
        age_decision = decide_population_age_range(
            profile_parameters, product_instructions, model_name=model_name
        )
        age_min = age_decision["age_min"]
        age_max = age_decision["age_max"]
        age_rationale = age_decision.get("rationale") or ""
        # Guardar decisión en params (útil al guardar población / depurar)
        profile_parameters = {
            **profile_parameters,
            "resolved_age_range": [age_min, age_max],
            "resolved_age_rationale": age_rationale,
        }

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
            seed = f"{generated_name}-{index}"
            # Solo fallback si el LLM no devuelve edad
            fallback_age = sample_age({"age_range": [age_min, age_max]}, seed)
            pre_edu = sample_education(demographics, seed)
            pre_loc = sample_location(demographics, seed)
            
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
            Eres un demógrafo y psicólogo del consumidor. Genera UN único perfil de comprador realista
            en español para un test de mercado pre-lanzamiento (simulación comercial).

            Perfil {index} de {num_reviewers}.

            DATOS FIJOS (no los cambies):
            - id: {index}
            - name: {generated_name}
            - gender: {gender}
            - location: {pre_loc}
            - education_level: {pre_edu}

            EDAD — TÚ LA DECIDES (obligatorio):
            - El rango de edades de ESTA población (decidido para todos) es: {age_min} a {age_max} años.
              Motivo del rango: {age_rationale or 'coherencia con la población objetivo'}
            - Elige la edad concreta de ESTE perfil DENTRO de ese rango (incluido).
            - Diversifica: no pongas a todos la misma edad. Perfil {index}/{num_reviewers}:
              reparte edades a lo largo del rango (unos más jóvenes, otros en el medio, otros mayores).
            - La edad debe cuadrar con ocupación, backstory y etapa vital.

            {product_instructions}
            {population_prompt_instruction}

            Parámetros de población (rangos 0-100 donde aplica):
            {json.dumps({k: v for k, v in profile_parameters.items() if k not in ('resolved_age_range', 'resolved_age_rationale')}, ensure_ascii=False)}

            REQUISITOS DE REALISMO (crítico):
            1. La persona debe parecer un humano real, no un arquetipo genérico de marketing.
            2. Incluye contradicciones leves y matices (ej. le gusta la tecnología pero odia apps complicadas).
            3. bio: 1-2 frases en primera o tercera persona, natural, sin jerga de IA.
            4. backstory: 120-220 palabras. Historia concreta: trabajo, familia/hogar, hábitos de compra,
               frustraciones con productos similares, y qué le haría comprar o devolver este tipo de producto.
            5. personality: valores 0-100 coherentes con la historia (incluye los ejes extendidos):
               introvert_extrovert, analytical_creative, busy_free_time, disorganized_organized,
               independent_cooperative, environmentalist, safe_risky,
               price_sensitive_premium, brand_loyal_explorer, tech_novice_expert, skeptic_enthusiast.
            6. consumer: occupation realista, income_level (low|medium|high|very_high), household
               (alone|couple|family_kids|shared|other), shopping_channel (online|physical|both),
               interests (3-6), pain_points (2-4), brand_preferences (0-4), recent_purchase_context (1 frase).
            7. appearance: puedes omitirla o dar valores básicos; el sistema la completará.
            8. review_style: el sistema rellenará positivity/verbosity/etc. con los sesgos de población.
               Si indiques verbosity (0-100): 0-30 = pocas palabras; 70-100 = hablador.
            9. En bio o backstory, deja entrever si es de pocas palabras o hablador (sin decir el número).
            10. Diversidad: evita clichés ("ama la tecnología y el café"). Sé específico y localizable en España.
            11. Campo age: entero obligatorio entre {age_min} y {age_max}.

            Devuelve SOLO JSON válido del esquema BotProfile.
            """
            try:
                profile_dict = call_llm_json(prompt, BotProfile, model_name=model_name, temperature=1.15)
                # Forzar el nombre y género generados por Faker para evitar desviaciones
                profile_dict["name"] = generated_name
                profile_dict["gender"] = gender
                profile_dict["id"] = index
                # Edad: la del agente, acotada al rango decidido; fallback solo si falta
                try:
                    age_val = int(profile_dict.get("age") or fallback_age)
                except (TypeError, ValueError):
                    age_val = fallback_age
                profile_dict["age"] = max(age_min, min(age_max, age_val))
                if not profile_dict.get("location"):
                    profile_dict["location"] = pre_loc
                if not profile_dict.get("education_level"):
                    profile_dict["education_level"] = pre_edu

                profile_dict = enrich_profile(profile_dict, profile_parameters, index)
                
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
            style = profile.get("review_style") or {}
            positivity = int(style.get("positivity", 50))
            verbosity = int(style.get("verbosity", 50))
            detail = int(style.get("detail_level", 50))
            formality = int(style.get("formality", 50))
            emoji_usage = int(style.get("emoji_usage", 20))
            typo_tendency = int(style.get("typo_tendency", 10))
            complaint = int(style.get("complaint_focus", 40))
            personality = profile.get("personality") or {}
            skeptic = int(personality.get("skeptic_enthusiast", 50))
            price_sensitive = int(personality.get("price_sensitive_premium", 50))

            length_guide = review_length_guidance(verbosity, detail)
            rating_guide = rating_bias_guidance(positivity, skeptic, complaint, price_sensitive)
            v_label = verbosity_label(verbosity)

            # Strip appearance noise from prompt to reduce tokens; keep consumer + personality
            profile_for_prompt = {
                "id": profile.get("id"),
                "name": profile.get("name"),
                "bio": profile.get("bio"),
                "age": profile.get("age"),
                "location": profile.get("location"),
                "gender": profile.get("gender"),
                "education_level": profile.get("education_level"),
                "personality": personality,
                "backstory": profile.get("backstory"),
                "consumer": profile.get("consumer"),
                "review_style": style,
                "verbosidad": {
                    "nivel": verbosity,
                    "etiqueta": v_label,
                    "escala": "0=pocas palabras, 100=muy hablador",
                },
            }

            prompt = f"""
            Eres {profile.get('name')}, una persona real escribiendo una reseña de compra online en español
            (estilo Amazon/PcComponentes/El Corte Inglés), NO un asistente de IA.

            PRODUCTO:
            {json.dumps(product_info, ensure_ascii=False, indent=2)}

            TU PERFIL:
            {json.dumps(profile_for_prompt, ensure_ascii=False, indent=2)}

            CUALIDAD CLAVE — VERBOSIDAD: eres "{v_label}" (verbosity={verbosity}/100).
            - 0-30 = pocas palabras (telegráfico)
            - 70-100 = hablador (te enrollas)
            DEBES respetar esto en la longitud y el tono del content y del title.

            REGLAS DE ESCRITURA (obligatorias para realismo):
            1. Escribe en primera persona, con voz humana coherente con tu edad, educación y personalidad.
            2. {length_guide}
            3. {rating_guide}
            4. Formalidad del texto ~{formality}/100 (0=muy coloquial con muletillas; 100=formal y estructurado).
            5. Emojis: uso ~{emoji_usage}/100 (0=ninguno; alto=1-3 como mucho, no abuses).
            6. Errores tipográficos leves permitidos solo si typo_tendency={typo_tendency} es alto (>50); si es bajo, ortografía correcta.
            7. Si eres de pocas palabras, un solo detalle del producto basta; si eres hablador, menciona varios.
            8. Relaciona la opinión con TU vida (ocupación, hogar, pain_points, presupuesto) — breve o extenso según verbosidad.
            9. NO uses frases de IA: "En resumen", "Cabe destacar", "Sin duda alguna", "Producto innovador",
               "Cumple con las expectativas", listas perfectas, tono de brochure.
            10. Sí puedes usar: anécdotas, dudas, comparaciones vagas ("el que tenía antes..."),
                y un cierre natural — solo si tu verbosidad lo permite.
            11. El título debe sonar a reseña real (corto si pocas palabras; más expresivo si hablador).
            12. usage_duration: inventa un tiempo de uso creíble (ej. "3 días", "2 semanas", "1 mes").
            13. pros/cons: si pocas palabras, 0-2 items cortos; si hablador, 2-4 items.
            14. would_recommend: true/false coherente con rating y texto.
            15. verified_purchase: true.
            16. rating entero 1-5. La nota DEBE cuadrar con el tono del content.
            17. CALIDAD / PRECIO (obligatorio al fijar la valoración):
                - Mira el precio del producto y lo que realmente ofrece (calidad, materiales,
                  funciones, durabilidad, acabados).
                - Tu rating debe reflejar si la relación calidad-precio te compensa según tu
                  sensibilidad al precio (price_sensitive_premium en tu perfil:
                  bajo = buscas chollo; alto = aceptas pagar más por calidad).
                - Producto correcto pero caro para lo que es → no pongas 5; baja 1 estrella o más.
                - Producto decente/barato o premium que justifica el precio → la nota puede subir.
                - En el content (y en pros/cons si aplica) alude al precio o a si "vale lo que cuesta",
                  con la longitud que te permita tu verbosidad.

            JSON de salida (Review):
            - id: {i}
            - bot_id: {profile.get('id', i)}
            - product_id: 1
            - rating, title, content, pros, cons, would_recommend, usage_duration, verified_purchase
            """
            
            review_dict = call_llm_json(prompt, Review, model_name=model_name, temperature=0.95)
            review_dict["id"] = i
            review_dict["bot_id"] = profile.get("id", i)
            review_dict["product_id"] = 1
            if "verified_purchase" not in review_dict or review_dict["verified_purchase"] is None:
                review_dict["verified_purchase"] = True
            
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
    Eres un analista de market research pre-lanzamiento. Analiza reseñas sintéticas de una población de prueba
    y genera un informe accionable para decidir si el producto está listo para salir al mercado.

    Producto:
    {product_text}

    Reseñas:
    {reviews_text}

    Devuelve JSON con:
    - average_rating: float (se recalculará; estima de todos modos)
    - rating_distribution: {{one_star, two_stars, three_stars, four_stars, five_stars}}
    - positive_points: 4-8 hallazgos positivos concretos (no genéricos)
    - negative_points: 4-8 fricciones o riesgos de mercado concretos
    - keyword_analysis: lista de {{word, count, sentiment}} con palabras reales de las reseñas
    - demographic_insights: insights de segmentos (edad, estilo de vida, sensibilidad al precio, tech level...)
    - market_fit_score: 0-100 (encaje de este producto con la población simulada)
    - launch_recommendation: 1-3 frases con recomendación de lanzamiento (go / iterate / pivot) y por qué
    - segment_breakdown: lista opcional de objetos {{segment, avg_rating, n, note}}
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