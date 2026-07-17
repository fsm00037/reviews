import warnings
import os
import json
import re
import threading
import concurrent.futures
import litellm
from crewai import Crew, Process, LLM
from typing import Dict, Any, List, Union, Optional
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
from models import (
    APIRequest,
    APIResponse,
    Product,
    BotProfile,
    Review,
    AnalysisResult,
    PopulationAgeRange,
    AgentPopulationConfig,
)
from realism import (
    enrich_profile,
    review_length_guidance,
    rating_bias_guidance,
    verbosity_label,
    sample_age,
    sample_education,
    sample_location,
    sample_personality,
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

def _extract_json_object(text: str) -> str:
    """Extrae el primer objeto/array JSON de un texto (quita fences markdown)."""
    cleaned = (text or "").strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if match:
        cleaned = match.group(1).strip()
    start_obj = cleaned.find("{")
    start_arr = cleaned.find("[")
    if start_obj == -1 and start_arr == -1:
        return cleaned
    if start_obj == -1 or (start_arr != -1 and start_arr < start_obj):
        start, open_c, close_c = start_arr, "[", "]"
    else:
        start, open_c, close_c = start_obj, "{", "}"
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(cleaned)):
        ch = cleaned[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == open_c:
            depth += 1
        elif ch == close_c:
            depth -= 1
            if depth == 0:
                return cleaned[start : i + 1]
    end = cleaned.rfind(close_c)
    if start != -1 and end > start:
        return cleaned[start : end + 1]
    return cleaned


def _model_field_names(response_model: type) -> set:
    if hasattr(response_model, "model_fields"):
        return set(response_model.model_fields.keys())
    if hasattr(response_model, "__fields__"):
        return set(response_model.__fields__.keys())
    return set()


def _coerce_llm_json_to_instance(data: Any, response_model: type) -> dict:
    """
    Algunos modelos devuelven un JSON Schema (title/properties/required)
    en lugar de la instancia. Aplana properties cuando hace falta.
    """
    if not isinstance(data, dict):
        return data

    fields = _model_field_names(response_model)
    if fields and fields.issubset(data.keys()):
        return {k: data[k] for k in fields if k in data}

    props = data.get("properties")
    if isinstance(props, dict) and (
        "title" in data or "required" in data or data.get("type") == "object" or "description" in data
    ):
        flat: Dict[str, Any] = {}
        for k, v in props.items():
            if fields and k not in fields:
                continue
            # Valor directo (caso habitual del bug: properties.age_min = 16)
            if not isinstance(v, dict):
                flat[k] = v
                continue
            # Definición de campo del schema
            if "const" in v:
                flat[k] = v["const"]
            elif "default" in v:
                flat[k] = v["default"]
            elif "type" in v and not any(x in v for x in fields):
                # schema sin valor → saltar
                continue
            else:
                flat[k] = v
        # Campos sueltos en la raíz (p. ej. rationale fuera de properties)
        for k in fields:
            if k not in flat and k in data and k not in (
                "properties", "required", "title", "description", "type", "$defs", "definitions"
            ):
                flat[k] = data[k]
        if flat:
            return flat

    return data


def _validate_llm_json(data: Any, response_model: type) -> dict:
    coerced = _coerce_llm_json_to_instance(data, response_model)
    validated_obj = response_model(**coerced)
    return validated_obj.model_dump() if hasattr(validated_obj, "model_dump") else validated_obj.dict()


def call_llm_json(
    prompt: str,
    response_model: type,
    model_name: str = None,
    temperature: float = 1.0,
    preprocess=None,
) -> dict:
    """
    Realiza una llamada a litellm solicitando una respuesta JSON y la valida contra el Pydantic model.
    preprocess: callable opcional (dict) -> dict para normalizar/clamp antes de validar.
    """
    params = get_litellm_params(model_name)
    schema_desc = json.dumps(response_model.model_json_schema(), ensure_ascii=False, indent=2)
    field_names = sorted(_model_field_names(response_model))
    example_hint = ", ".join(f'"{f}": <valor>' for f in field_names) if field_names else '"campo": <valor>'

    system_prompt = (
        "Eres un asistente automatizado. Responde ÚNICAMENTE con un objeto JSON de INSTANCIA "
        "(valores reales), NUNCA con un JSON Schema.\n"
        f"Campos requeridos: {field_names}\n"
        f"Forma correcta: {{ {example_hint} }}\n"
        "INCORRECTO (no hagas esto): {\"title\": \"...\", \"properties\": {...}, \"required\": [...]}\n"
        "Restricciones numéricas del schema son OBLIGATORIAS (p. ej. age_min >= 16, age_max <= 90, "
        "rangos 0-100 con min <= max).\n"
        f"Referencia de tipos/campos:\n{schema_desc}\n"
        "Sin markdown, sin texto fuera del JSON."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt},
    ]

    def _parse_and_validate(raw_text: str) -> dict:
        data = json.loads(_extract_json_object(raw_text))
        data = _coerce_llm_json_to_instance(data, response_model)
        if preprocess:
            data = preprocess(data)
        return _validate_llm_json(data, response_model)

    try:
        completion_response = litellm.completion(
            messages=messages,
            temperature=temperature,
            **params,
        )
        content = completion_response.choices[0].message.content
        return _parse_and_validate(content)
    except Exception as e:
        print(
            f"Error parseando o validando JSON: {e}. "
            f"Contenido crudo intentado: {content if 'content' in locals() else 'N/A'}"
        )
        # Si el preprocess no se aplicó (error antes) o el modelo falló, reintentar
        print("Reintentando llamada al modelo para obtener JSON válido...")
        if "content" in locals():
            # Último intento local: reparsear el mismo contenido con preprocess (si falló por orden)
            try:
                return _parse_and_validate(content)
            except Exception:
                pass
            messages.append({"role": "assistant", "content": content})
        messages.append(
            {
                "role": "user",
                "content": (
                    f"El JSON no es válido ({e}). "
                    f"Devuelve SOLO la instancia plana con claves {field_names}. "
                    "Reglas críticas: age_min debe ser un entero ENTRE 16 y 90 (nunca 15 ni menos); "
                    "age_max entre 16 y 90 y >= age_min + 5; "
                    "cada rango de personalidad/estilo es un array de 2 enteros [min, max] con 0<=min<=max<=100. "
                    "No devuelvas title/properties/required."
                ),
            }
        )

        retry_response = litellm.completion(
            messages=messages,
            temperature=temperature,
            **params,
        )
        retry_content = retry_response.choices[0].message.content
        return _parse_and_validate(retry_content)

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


def _norm_range_pair(pair: Any, default: tuple = (0, 100), absolute: tuple = (0, 100)) -> list:
    """Normaliza un par [low, high] dentro de absolute."""
    a_lo, a_hi = absolute
    try:
        if isinstance(pair, (list, tuple)) and len(pair) >= 2:
            lo, hi = int(pair[0]), int(pair[1])
        elif isinstance(pair, dict):
            lo = int(pair.get("min", pair.get("low", default[0])))
            hi = int(pair.get("max", pair.get("high", default[1])))
        else:
            lo, hi = default
    except (TypeError, ValueError):
        lo, hi = default
    lo = max(a_lo, min(a_hi, lo))
    hi = max(a_lo, min(a_hi, hi))
    if lo > hi:
        lo, hi = hi, lo
    if hi - lo < 5:
        mid = (lo + hi) // 2
        lo = max(a_lo, mid - 8)
        hi = min(a_hi, mid + 8)
    return [lo, hi]


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
    Eres un demógrafo de market research. Decide el RANGO DE EDADES de una población
    sintética de consumidores para un test pre-lanzamiento.

    Contexto:
    - Prompt / descripción de la población (prioridad alta si existe):
      "{population_prompt or '(no hay prompt específico)'}"
    - Pista de demografía del UI (puedes IGNORARLA o ampliarla si el prompt o el producto lo exigen):
      age_range sugerido por el usuario: {hint_range}
      resto demografía: {json.dumps(demographics, ensure_ascii=False)}
    - Adaptación a producto / target (si hay):
      {product_instructions or '(sin producto concreto)'}

    Reglas:
    1. Tú decides el rango real. No copies ciegamente el slider del usuario.
    2. Si el prompt habla de estudiantes, instituto, jubilados, padres, etc., el rango debe reflejarlo.
    3. Si hay producto, el rango debe ser coherente con compradores típicos.
    4. age_min >= 16, age_max <= 85, y (age_max - age_min) >= 5.
    5. Si no hay señales claras, usa un rango adulto realista (p. ej. 22-55).
    6. rationale: 1 frase en español.

    Responde SOLO con este JSON de instancia (valores, no un schema):
    {{"age_min": 18, "age_max": 24, "rationale": "Breve motivo"}}
    """
    try:
        result = call_llm_json(prompt, PopulationAgeRange, model_name=model_name, temperature=0.4)
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


PERSONALITY_RANGE_KEYS = [
    "introvert_extrovert",
    "analytical_creative",
    "busy_free_time",
    "disorganized_organized",
    "independent_cooperative",
    "environmentalist",
    "safe_risky",
    "price_sensitive_premium",
    "brand_loyal_explorer",
    "tech_novice_expert",
    "skeptic_enthusiast",
]

REVIEW_STYLE_RANGE_KEYS = ["positivity_bias", "verbosity", "detail_level"]


def _sanitize_agent_population_config(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Corrige valores fuera de rango del LLM ANTES de validar con Pydantic
    (p. ej. age_min=15 → 16; arrays invertidos; enums inválidos).
    """
    if not isinstance(data, dict):
        return data
    out = dict(data)

    try:
        amin = int(out.get("age_min", 22))
    except (TypeError, ValueError):
        amin = 22
    try:
        amax = int(out.get("age_max", 55))
    except (TypeError, ValueError):
        amax = 55
    # Forzar dominio válido del schema (ge=16, le=90)
    amin = max(16, min(90, amin))
    amax = max(16, min(90, amax))
    amin, amax = _clamp_age_range(amin, amax)
    out["age_min"] = amin
    out["age_max"] = amax

    for k in PERSONALITY_RANGE_KEYS:
        out[k] = _norm_range_pair(out.get(k), (20, 80), (0, 100))
    for k in REVIEW_STYLE_RANGE_KEYS:
        defaults = {
            "positivity_bias": (40, 75),
            "verbosity": (35, 70),
            "detail_level": (40, 80),
        }
        out[k] = _norm_range_pair(out.get(k), defaults.get(k, (30, 70)), (0, 100))

    edu = out.get("education_level") or "Mixed"
    out["education_level"] = edu if edu in ("Low", "Medium", "High", "Mixed") else "Mixed"
    gender = out.get("gender_ratio") or "Male&Female"
    out["gender_ratio"] = gender if gender in ("Male", "Female", "Male&Female") else "Male&Female"
    income = out.get("income_level") or "Mixed"
    out["income_level"] = (
        income if income in ("low", "medium", "high", "very_high", "Mixed") else "Mixed"
    )

    rationale = out.get("config_rationale") or out.get("rationale") or ""
    out["config_rationale"] = str(rationale) if rationale is not None else ""
    return out


def decide_population_config_from_prompt(
    profile_parameters: Dict[str, Any],
    product_instructions: str = "",
    model_name: str = None,
) -> Dict[str, Any]:
    """
    Modo prompt: el agente configura demografía + rangos de personalidad y estilo de reseña
    a partir de la descripción en lenguaje natural.
    """
    population_prompt = (profile_parameters.get("population_prompt") or "").strip()
    demographics = profile_parameters.get("demographics") or {}

    prompt = f"""
    Eres un demógrafo y estratega de market research. A partir del PROMPT del usuario,
    configura TODOS los rangos de una población sintética de consumidores para un test pre-lanzamiento.

    PROMPT DE POBLACIÓN (prioridad absoluta):
    "{population_prompt}"

    Contexto de producto (si hay):
    {product_instructions or '(sin producto concreto)'}

    Pistas opcionales del UI (puedes ignorarlas si chocan con el prompt):
    {json.dumps(demographics, ensure_ascii=False)}

    === REGLAS OBLIGATORIAS DE JSON (si fallas, la respuesta se rechaza) ===
    - Devuelve SOLO un objeto JSON plano de instancia (NO un schema con title/properties/required).
    - age_min: entero, MÍNIMO 16, MÁXIMO 90. Nunca uses 14 ni 15. Para adolescentes de instituto usa 16.
    - age_max: entero, 16-90, y age_max >= age_min + 5.
    - education_level: exactamente uno de "Low" | "Medium" | "High" | "Mixed"
    - gender_ratio: exactamente uno de "Male" | "Female" | "Male&Female"
    - income_level: exactamente uno de "low" | "medium" | "high" | "very_high" | "Mixed"
    - Cada eje de personalidad y estilo: array de EXACTAMENTE 2 enteros [min, max] con 0 <= min <= max <= 100.
    - config_rationale: string en español (1-3 frases).

    Ejes de personalidad (todos obligatorios como [min, max]):
    introvert_extrovert, analytical_creative, busy_free_time, disorganized_organized,
    independent_cooperative, environmentalist, safe_risky, price_sensitive_premium,
    brand_loyal_explorer, tech_novice_expert, skeptic_enthusiast.
    (0 = polo izquierdo del nombre, 100 = polo derecho).

    Estilo de reseña (obligatorios [min, max]): positivity_bias, verbosity, detail_level.

    Orientación:
    - Instituto / chicos de 15-16 años → age_min=16, age_max=18 o 19 (NO 15).
    - Universitarios → ~18-24. Ejecutivos → ~30-55. Jubilados → ~60-80.
    - Rangos de personalidad con span ~15-40 (no [0,100] genérico si el prompt es específico).

    Ejemplo VÁLIDO (cópialo como plantilla de forma):
    {{
      "age_min": 16,
      "age_max": 19,
      "education_level": "Medium",
      "gender_ratio": "Male&Female",
      "income_level": "low",
      "introvert_extrovert": [40, 75],
      "analytical_creative": [30, 70],
      "busy_free_time": [55, 90],
      "disorganized_organized": [25, 60],
      "independent_cooperative": [40, 75],
      "environmentalist": [20, 55],
      "safe_risky": [35, 70],
      "price_sensitive_premium": [15, 50],
      "brand_loyal_explorer": [45, 85],
      "tech_novice_expert": [55, 90],
      "skeptic_enthusiast": [35, 70],
      "positivity_bias": [50, 80],
      "verbosity": [45, 80],
      "detail_level": [40, 75],
      "config_rationale": "Adolescentes aficionados al deporte; edades 16-19 y alto tiempo libre."
    }}
    """
    try:
        raw = call_llm_json(
            prompt,
            AgentPopulationConfig,
            model_name=model_name,
            temperature=0.35,
            preprocess=_sanitize_agent_population_config,
        )
        age_min, age_max = _clamp_age_range(raw.get("age_min", 22), raw.get("age_max", 55))
        personality = {
            k: _norm_range_pair(raw.get(k), (20, 80)) for k in PERSONALITY_RANGE_KEYS
        }
        edu = raw.get("education_level") or "Mixed"
        if edu not in ("Low", "Medium", "High", "Mixed"):
            edu = "Mixed"
        gender = raw.get("gender_ratio") or "Male&Female"
        if gender not in ("Male", "Female", "Male&Female"):
            gender = "Male&Female"
        income = raw.get("income_level") or "Mixed"
        if income not in ("low", "medium", "high", "very_high", "Mixed"):
            income = "Mixed"

        cfg = {
            "age_min": age_min,
            "age_max": age_max,
            "demographics": {
                "age_range": [age_min, age_max],
                "education_level": edu,
                "gender_ratio": gender,
                "income_level": income,
            },
            "personality": personality,
            "positivity_bias": _norm_range_pair(raw.get("positivity_bias"), (40, 75)),
            "verbosity": _norm_range_pair(raw.get("verbosity"), (35, 70)),
            "detail_level": _norm_range_pair(raw.get("detail_level"), (40, 80)),
            "config_rationale": raw.get("config_rationale") or raw.get("rationale") or "",
        }
        print(
            f"🎛️ Agente configuró población desde prompt: "
            f"edad {age_min}-{age_max}, edu={edu}, género={gender}, renta={income}"
        )
        print(f"   Rationale: {cfg['config_rationale'][:200]}")
        return cfg
    except Exception as e:
        print(f"⚠️ Falló configuración completa por prompt ({e}); fallback a solo edad.")
        age = decide_population_age_range(profile_parameters, product_instructions, model_name)
        return {
            "age_min": age["age_min"],
            "age_max": age["age_max"],
            "demographics": {
                **(profile_parameters.get("demographics") or {}),
                "age_range": [age["age_min"], age["age_max"]],
            },
            "personality": profile_parameters.get("personality") or {},
            "positivity_bias": profile_parameters.get("positivity_bias") or [40, 75],
            "verbosity": profile_parameters.get("verbosity") or [35, 70],
            "detail_level": profile_parameters.get("detail_level") or [40, 80],
            "config_rationale": age.get("rationale") or "",
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

        population_prompt = (profile_parameters.get("population_prompt") or "").strip()
        # Modo prompt (sin sliders manuales): el agente configura demografía + todos los rangos
        use_manual = bool(
            profile_parameters.get("use_custom_config")
            or profile_parameters.get("manual_ranges")
        )
        agent_configured = False

        if population_prompt and not use_manual:
            agent_cfg = decide_population_config_from_prompt(
                profile_parameters, product_instructions, model_name=model_name
            )
            age_min, age_max = agent_cfg["age_min"], agent_cfg["age_max"]
            age_rationale = agent_cfg.get("config_rationale") or ""
            profile_parameters = {
                **profile_parameters,
                "demographics": {
                    **(profile_parameters.get("demographics") or {}),
                    **(agent_cfg.get("demographics") or {}),
                },
                "personality": agent_cfg.get("personality") or profile_parameters.get("personality") or {},
                "positivity_bias": agent_cfg.get("positivity_bias")
                or profile_parameters.get("positivity_bias"),
                "verbosity": agent_cfg.get("verbosity") or profile_parameters.get("verbosity"),
                "detail_level": agent_cfg.get("detail_level")
                or profile_parameters.get("detail_level"),
                "resolved_age_range": [age_min, age_max],
                "resolved_age_rationale": age_rationale,
                "agent_config_rationale": age_rationale,
                "agent_configured_from_prompt": True,
            }
            agent_configured = True
        else:
            # Solo edad (sliders manuales o sin prompt)
            age_decision = decide_population_age_range(
                profile_parameters, product_instructions, model_name=model_name
            )
            age_min = age_decision["age_min"]
            age_max = age_decision["age_max"]
            age_rationale = age_decision.get("rationale") or ""
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
            # Personalidad muestreada DENTRO de los rangos del agente / sliders (fuente de verdad)
            forced_personality = sample_personality(profile_parameters, seed)
            
            population_prompt_instruction = ""
            population_prompt = profile_parameters.get("population_prompt", "")
            if population_prompt:
                population_prompt_instruction = f"""
                IMPORTANTE - DESCRIPCIÓN DE LA POBLACIÓN REQUERIDA POR EL USUARIO:
                El usuario ha descrito el tipo de población con el siguiente prompt:
                "{population_prompt}"
                Diseña este perfil de forma que sea totalmente coherente y cumpla con la descripción anterior.
                """

            agent_note = ""
            if profile_parameters.get("agent_configured_from_prompt"):
                agent_note = f"""
                CONFIGURACIÓN YA DECIDIDA POR EL AGENTE DE POBLACIÓN (respétala):
                - rationale: {profile_parameters.get('agent_config_rationale') or age_rationale or ''}
                - demografía efectiva: {json.dumps(demographics, ensure_ascii=False)}
                - rangos de personalidad de la población: {json.dumps(profile_parameters.get('personality') or {}, ensure_ascii=False)}
                - estilo reseña población: positivity={profile_parameters.get('positivity_bias')},
                  verbosity={profile_parameters.get('verbosity')}, detail={profile_parameters.get('detail_level')}
                """
                
            prompt = f"""
            Eres un demógrafo y psicólogo del consumidor. Genera UN único perfil de comprador realista
            en español para un test de mercado pre-lanzamiento (simulación comercial).

            Perfil {index} de {num_reviewers}.

            DATOS FIJOS (no los cambies; el sistema los forzará si los alteras):
            - id: {index}
            - name: {generated_name}
            - gender: {gender}
            - location: {pre_loc}
            - education_level: {pre_edu}
            - personality: {json.dumps(forced_personality, ensure_ascii=False)}
              (valores ya muestreados dentro de los rangos de la población; NO inventes otros)

            EDAD — TÚ LA DECIDES (obligatorio):
            - El rango de edades de ESTA población es: {age_min} a {age_max} años.
              Motivo: {age_rationale or 'coherencia con la población objetivo'}
            - Elige la edad de ESTE perfil DENTRO de ese rango. Diversifica según índice {index}/{num_reviewers}.
            - La edad debe cuadrar con ocupación, backstory y etapa vital.

            {agent_note}
            {product_instructions}
            {population_prompt_instruction}

            REQUISITOS DE REALISMO (crítico):
            1. La persona debe parecer un humano real, no un arquetipo genérico de marketing.
            2. Incluye contradicciones leves y matices.
            3. bio: 1-2 frases naturales, coherentes con personality y edad.
            4. backstory: 120-220 palabras; trabajo, hogar, hábitos de compra, coherente con los rasgos fijos.
            5. personality: usa EXACTAMENTE los valores fijos de arriba (no los cambies).
            6. consumer: occupation realista; income_level coherente con la demografía de población
               ({demographics.get('income_level', 'Mixed')}); household; shopping_channel;
               interests (3-6); pain_points (2-4); brand_preferences; recent_purchase_context.
            7. appearance: puedes omitirla; el sistema la completará.
            8. review_style: el sistema lo rellenará; no hace falta inventarlo.
            9. Campo age: entero entre {age_min} y {age_max}.

            Devuelve SOLO JSON válido del esquema BotProfile.
            """
            try:
                profile_dict = call_llm_json(prompt, BotProfile, model_name=model_name, temperature=1.15)
                # Forzar el nombre y género generados por Faker para evitar desviaciones
                profile_dict["name"] = generated_name
                profile_dict["gender"] = gender
                profile_dict["id"] = index
                profile_dict["location"] = pre_loc
                profile_dict["education_level"] = pre_edu
                # Personalidad del agente/sliders (no la inventada por el LLM)
                profile_dict["personality"] = forced_personality
                # Edad: la del agente, acotada al rango decidido; fallback solo si falta
                try:
                    age_val = int(profile_dict.get("age") or fallback_age)
                except (TypeError, ValueError):
                    age_val = fallback_age
                profile_dict["age"] = max(age_min, min(age_max, age_val))

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
            
    return LiteLLMResult({
        "profiles": sorted(profiles, key=lambda x: x.get('id', 0)),
        # Config efectiva (tras agente) para que el frontend pueda guardar la población bien
        "profile_parameters": profile_parameters if num_reviewers > 0 else (profile_parameters or {}),
    })

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