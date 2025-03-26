# Main module for product review system

import warnings
import os
import json
import solucionadorError
from crewai import Crew, Process, LLM
from typing import Dict, Any, List
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
    create_compiler_task,
    ensure_output_dir
)

# Warning control
warnings.filterwarnings('ignore')

# Disable OpenTelemetry
solucionadorError.deshabilitar_opentelemetry()

# Añade esta función corregida a tu archivo crew.py

def load_json_file(file_path):
    """
    Carga y devuelve el contenido de un archivo JSON de manera segura,
    eliminando la primera y última línea que podrían causar problemas.
    
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
            content = f.read()
        
        # Eliminar primera y última línea si hay múltiples líneas
        lines = content.strip().split('\n')
        if len(lines) > 2:
            content = '\n'.join(lines[1:-1])
        
        try:
            data = json.loads(content)
            return data
        except json.JSONDecodeError as e:
            # Intentar limpiar y reparar el JSON
            content = content.strip()
            # Si el JSON no es válido, crear un nuevo archivo con JSON válido
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump({}, f)
            
            raise json.JSONDecodeError(
                f"Invalid JSON in {file_path}: {str(e)}", content, e.pos
            )
    except Exception as e:
        # Si hay algún otro error, también crear un archivo con JSON válido
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump({}, f)
        except:
            pass
            
        raise Exception(f"Error reading {file_path}: {str(e)}")

def load_reviews(reviews_dir: str = config.REVIEWS_DIR) -> List[Dict[str, Any]]:
    """Load all review files from the reviews directory"""
    reviews = []
    if os.path.exists(reviews_dir):
        for filename in os.listdir(reviews_dir):
            if filename.endswith('.md'):
                file_path = os.path.join(reviews_dir, filename)
                with open(file_path, 'r', encoding='utf-8') as file:
                    content = file.read()
                    reviews.append({'contenido': content})
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
    
    # Run the crew
    product_results = product_crew.kickoff()
    
    # Ensure we have output directory
    ensure_output_dir()
    
    # Write product info to file if it doesn't exist
    if not os.path.exists(config.PRODUCT_INFO_FILE) or os.path.getsize(config.PRODUCT_INFO_FILE) == 0:
        # Extract product info from agent's response
        try:
            # Try to find JSON in the product results
            import re
            json_match = re.search(r'```json\n(.*?)\n```', product_results, re.DOTALL)
            if json_match:
                product_info_json = json_match.group(1)
                product_info = json.loads(product_info_json)
            else:
                # If no JSON found, create a minimal structure
                product_info = {"nombre": "Producto", "descripción": "Descripción no disponible"}
                
            # Write to file
            with open(config.PRODUCT_INFO_FILE, 'w', encoding='utf-8') as f:
                json.dump(product_info, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error extracting product info: {e}")
            # Create a minimal structure as fallback
            product_info = {"nombre": "Producto", "descripción": "Error al extraer información"}
            with open(config.PRODUCT_INFO_FILE, 'w', encoding='utf-8') as f:
                json.dump(product_info, f, ensure_ascii=False, indent=2)
    
    # Load product info to verify it was created successfully
    product_info = load_json_file(config.PRODUCT_INFO_FILE)
    
    return {
        "product_info": product_info,
        "phase1_results": product_results
    }

def run_phase2(num_reviewers: int, model_name: str = None) -> Dict[str, Any]:
    """Run phase 2: Create user profiles"""
    # Ensure output directories exist
    ensure_output_dir()
    
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
        
        # Run the crew
        user_results = user_crew.kickoff()
        
        # Handle case where user profiles file might not exist
        if not os.path.exists(config.USER_PROFILES_FILE) or os.path.getsize(config.USER_PROFILES_FILE) == 0:
            # Create empty user profiles file
            with open(config.USER_PROFILES_FILE, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False, indent=2)
    else:
        # Create empty user profiles if num_reviewers is 0
        with open(config.USER_PROFILES_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f, ensure_ascii=False, indent=2)
        user_results = "No user profiles created (num_reviewers = 0)"
    
    # Load user profiles
    user_profiles = load_json_file(config.USER_PROFILES_FILE)
    
    return {
        "user_profiles": user_profiles,
        "phase2_results": user_results
    }

def run_phase3(product_info: Dict[str, Any], user_profiles: List[Dict[str, Any]], model_name: str = None) -> Dict[str, Any]:
    """Run phase 3: Generate reviews"""
    # Ensure output directories exist
    ensure_output_dir()
    
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
    
    phase3_results = phase3_crew.kickoff()
    
    # Create reviews directory if it doesn't exist
    if not os.path.exists(config.REVIEWS_DIR):
        os.makedirs(config.REVIEWS_DIR)
    
    # Load reviews
    try:
        reviews = load_reviews(config.REVIEWS_DIR)
    except Exception as e:
        print(f"Error loading reviews: {e}")
        reviews = []
    
    return {
        "reviews": reviews,
        "phase3_results": phase3_results
    }

def run_phase4(model_name: str = None) -> Dict[str, Any]:
    """Run phase 4: Compile reviews and generate final report"""
    # Ensure output directories exist
    ensure_output_dir()
    
    # Create LLM instance
    llm = create_llm(model_name)
    
    # Create compiler agent
    compiler_agent = create_compiler_agent(llm)
    
    # Create compiler task
    compiler_task = create_compiler_task(compiler_agent)
    
    # Create and run crew
    phase4_crew = Crew(
        agents=[compiler_agent],
        tasks=[compiler_task],
        verbose=True,
        process=Process.sequential
    )
    
    phase4_results = phase4_crew.kickoff()
    
    
    return {
        "final_report": phase4_results.raw
    }

def main(product_url: str, num_reviewers: int = config.DEFAULT_NUM_REVIEWERS, model_name: str = None) -> Dict[str, Any]:
    """Run the complete product review process with 4 separate phases"""
    # Ensure output directories exist
    ensure_output_dir()
    
    # Run phase 1: Extract product info
    print("\n=== Ejecutando Fase 1: Extracción de información del producto ===")
    phase1_results = run_phase1(product_url, model_name)
    product_info = phase1_results["product_info"]
    print(f"Fase 1 completada: Información extraída para '{product_info.get('nombre', 'Producto')}'")    
    
    # Run phase 2: Create user profiles
    print("\n=== Ejecutando Fase 2: Generación de perfiles de usuario ===")
    phase2_results = run_phase2(num_reviewers, model_name)
    user_profiles = phase2_results["user_profiles"]
    print(f"Fase 2 completada: {len(user_profiles)} perfiles de usuario generados")
    
    # Run phase 3: Generate reviews
    print("\n=== Ejecutando Fase 3: Generación de reseñas ===")
    phase3_results = run_phase3(product_info, user_profiles, model_name)
    reviews = phase3_results["reviews"]
    print(f"Fase 3 completada: {len(reviews)} reseñas generadas")
    
    # Run phase 4: Compile reviews and generate final report
    print("\n=== Ejecutando Fase 4: Compilación de reseñas y generación de informe ===")
    phase4_results = run_phase4(model_name)
    final_report = phase4_results["final_report"]
    print("Fase 4 completada: Informe final generado")
    
    # Combine results
    return {
        "product_info": product_info,
        "user_profiles": user_profiles,
        "reviews": reviews,
        "final_report": final_report,
        "phase_results": {
            "phase1": phase1_results["phase1_results"],
            "phase2": phase2_results["phase2_results"],
            "phase3": phase3_results["phase3_results"],
            "phase4": phase4_results["phase4_results"]
        }
    }

# Example usage
if __name__ == "__main__":
    product_url = config.EXAMPLE_URLS["ikea"]
    result = main(product_url, num_reviewers=3)
    print(json.dumps(result["final_report"], indent=2, ensure_ascii=False))