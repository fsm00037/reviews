import os
import json
import shutil
from typing import Dict, Any, List
import importlib.util
import sys

# Definir la ruta base para los módulos crewAPI
crewapi_base_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "crewAPI")

# Importar config.py
config_spec = importlib.util.spec_from_file_location("config", os.path.join(crewapi_base_path, "config.py"))
config_module = importlib.util.module_from_spec(config_spec)
sys.modules["config"] = config_module
config_spec.loader.exec_module(config_module)

# Importar models.py
models_spec = importlib.util.spec_from_file_location("models", os.path.join(crewapi_base_path, "models.py"))
models_module = importlib.util.module_from_spec(models_spec)
sys.modules["models"] = models_module
models_spec.loader.exec_module(models_module)

# Importar agents.py
agents_spec = importlib.util.spec_from_file_location("agents", os.path.join(crewapi_base_path, "agents.py"))
agents_module = importlib.util.module_from_spec(agents_spec)
sys.modules["agents"] = agents_module
agents_spec.loader.exec_module(agents_module)

# Importar tasks.py
tasks_spec = importlib.util.spec_from_file_location("tasks", os.path.join(crewapi_base_path, "tasks.py"))
tasks_module = importlib.util.module_from_spec(tasks_spec)
sys.modules["tasks"] = tasks_module
tasks_spec.loader.exec_module(tasks_module)

# Finalmente, importar crew.py
crew_spec = importlib.util.spec_from_file_location("crewAPI.crew", os.path.join(crewapi_base_path, "crew.py"))
crew_module = importlib.util.module_from_spec(crew_spec)
sys.modules["crewAPI.crew"] = crew_module
crew_spec.loader.exec_module(crew_module)

# Importar las funciones que necesitamos
run_phase1 = crew_module.run_phase1
run_phase2 = crew_module.run_phase2
run_phase3 = crew_module.run_phase3
run_phase4 = crew_module.run_phase4

# Definir la ruta de la carpeta outputs
outputs_dir = os.path.join(crewapi_base_path, "outputs")

def clean_outputs():
    """
    Limpia la carpeta de outputs de crewAPI eliminando todos sus contenidos.
    
    Returns:
        Un diccionario indicando el resultado de la operación
    """
    try:
        print("Limpiando carpeta de outputs...")
        
        # Verificar si la carpeta existe
        if os.path.exists(outputs_dir):
            # Eliminar todos los archivos y subdirectorios
            for item in os.listdir(outputs_dir):
                item_path = os.path.join(outputs_dir, item)
                
                if os.path.isfile(item_path):
                    os.remove(item_path)
                elif os.path.isdir(item_path):
                    shutil.rmtree(item_path)
            
            print("Carpeta de outputs limpiada correctamente")
            return {"status": "success", "message": "Carpeta de outputs limpiada correctamente"}
        else:
            # Crear la carpeta si no existe
            os.makedirs(outputs_dir, exist_ok=True)
            print("Carpeta de outputs creada")
            return {"status": "success", "message": "Carpeta de outputs creada"}
    except Exception as e:
        error_msg = f"Error al limpiar la carpeta de outputs: {str(e)}"
        print(error_msg)
        return {"status": "error", "message": error_msg}

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
        return {}

def load_reviews(reviews_dir):
    """Carga todas las reseñas del directorio de reseñas"""
    reviews = []
    if os.path.exists(reviews_dir):
        for filename in os.listdir(reviews_dir):
            if filename.endswith('.json'):
                file_path = os.path.join(reviews_dir, filename)
                try:
                    data = load_json_file(file_path)
                    reviews.append(data)
                except Exception as e:
                    print(f"Error al cargar el archivo de reseña {filename}: {e}")
    return reviews

def execute_phase1(product_url: str, model_name: str = None) -> Dict[str, Any]:
    """
    Fase 1: Extrae información del producto.
    
    Args:
        product_url: URL del producto a analizar
        model_name: Nombre del modelo LLM a utilizar (opcional)
        
    Returns:
        Diccionario con la información del producto
    """
    try:
        print("Ejecutando fase 1: Extracción de información del producto...")
        phase1_results = run_phase1(product_url, model_name)
        return phase1_results.raw
    except Exception as e:
        print(f"Error durante la fase 1: {str(e)}")
        raise

def execute_phase2(num_reviewers: int, profile_parameters: Dict[str, Any], model_name: str = None) -> Dict[str, Any]:
    """
    Fase 2: Crea perfiles de usuario.
    
    Args:
        num_reviewers: Número de perfiles de reseñadores a generar
        profile_parameters: Parámetros de los perfiles de usuario
        model_name: Nombre del modelo LLM a utilizar (opcional)
        
    Returns:
        Diccionario con los perfiles de usuario
    """
    try:
        print("Ejecutando fase 2: Creación de perfiles de usuario...")
        phase2_results = run_phase2(num_reviewers, profile_parameters, model_name)
        return phase2_results.to_dict()
    except Exception as e:
        print(f"Error durante la fase 2: {str(e)}")
        raise

def execute_phase3(product_info: Dict[str, Any], user_profiles: List[Dict[str, Any]], model_name: str = None) -> List[Dict[str, Any]]:
    """
    Fase 3: Genera reseñas basadas en la información del producto y los perfiles de usuario.
    
    Args:
        product_info: Información del producto (resultado de fase 1)
        user_profiles: Perfiles de usuario (resultado de fase 2)
        model_name: Nombre del modelo LLM a utilizar (opcional)
        
    Returns:
        Lista de reseñas generadas
    """
    try:
        print("Ejecutando fase 3: Generación de reseñas...")
        phase3_results = run_phase3(product_info, user_profiles, model_name)
        return phase3_results
    except Exception as e:
        print(f"Error durante la fase 3: {str(e)}")
        raise

def execute_phase4(model_name: str = None) -> Dict[str, Any]:
    """
    Fase 4: Compila reseñas y genera informe final.
    
    Args:
        model_name: Nombre del modelo LLM a utilizar (opcional)
        
    Returns:
        Diccionario con el análisis de las reseñas
    """
    try:
        print("Ejecutando fase 4: Compilación de reseñas y generación de informe...")
        phase4_results = run_phase4(model_name)
        return phase4_results.json_dict
    except Exception as e:
        print(f"Error durante la fase 4: {str(e)}")
        raise

def execute_product_analysis(product_url: str, num_reviewers: int = 3, model_name: str = None) -> Dict[str, Any]:
    """
    Ejecuta el análisis completo del producto utilizando el sistema CrewAI.
    
    Args:
        product_url: URL del producto a analizar
        num_reviewers: Número de perfiles de reseñadores a generar
        model_name: Nombre del modelo LLM a utilizar (opcional)
        
    Returns:
        Diccionario con los resultados del análisis
    """
    try:
        # Fase 1: Extraer información del producto
        product_info = execute_phase1(product_url, model_name)
        
        # Fase 2: Crear perfiles de usuario
        phase2_results = execute_phase2(num_reviewers, model_name)
        user_profiles = phase2_results['profiles']
        
        # Fase 3: Generar reseñas
        reviews = execute_phase3(product_info, user_profiles, model_name).to_dict()
        
        # Fase 4: Compilar reseñas y generar informe final
        analysis = execute_phase4(model_name)
        
        # Construir y devolver respuesta
        response = {
            "product": product_info,
            "reviewers": user_profiles,
            "reviews": reviews,
            "analysis": analysis
        }
        
        return response
    except Exception as e:
        print(f"Error durante la ejecución del análisis: {str(e)}")
        raise 