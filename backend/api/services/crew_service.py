import os
import json
import shutil
import threading
import traceback
from typing import Dict, Any, List

# Importación directa simple del módulo crewAPI
from crewAPI import run_phase1, run_phase2, run_phase3, run_phase4
from api.utils import db

# Definir la ruta de la carpeta outputs
outputs_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "crewAPI", "outputs")

def get_session_dir(session_id: str) -> str:
    """Obtiene la ruta al directorio temporal de una sesión"""
    path = os.path.join(outputs_dir, session_id)
    os.makedirs(path, exist_ok=True)
    return path

def clean_outputs(session_id: str = "default-session"):
    """
    Limpia el directorio temporal y los registros de SQLite para la sesión actual.
    """
    try:
        print(f"Limpiando datos para sesión: {session_id}...")
        
        # 1. Limpiar directorio temporal
        session_dir = os.path.join(outputs_dir, session_id)
        if os.path.exists(session_dir):
            shutil.rmtree(session_dir)
            print(f"Carpeta de sesión {session_id} eliminada")
            
        # 2. Borrar datos de la base de datos
        db.delete_session(session_id)
        
        # Resetear estados de tareas
        for phase in ['phase1', 'phase2', 'phase3', 'phase4']:
            db.set_task_status(session_id, phase, 'idle')
            
        return {"status": "success", "message": f"Datos de la sesión {session_id} limpiados correctamente"}
    except Exception as e:
        error_msg = f"Error al limpiar datos de la sesión: {str(e)}"
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

# --- Fase 1 ---
def _bg_phase1(product_url: str, model_name: str, session_id: str, session_dir: str, user_id: int = None):
    try:
        db.set_task_status(session_id, 'phase1', 'running')
        
        phase1_results = run_phase1(product_url, model_name, session_dir)
        product_data = phase1_results.json_dict
        
        # Guardar en SQLite
        db.save_product(session_id, product_data, user_id=user_id)
        db.set_task_status(session_id, 'phase1', 'completed')
        print(f"✅ Fase 1 completada para sesión {session_id}")
    except Exception as e:
        error_trace = traceback.format_exc()
        db.set_task_status(session_id, 'phase1', 'failed', error=f"{str(e)}\n{error_trace}")
        print(f"❌ Error en Fase 1 para sesión {session_id}: {e}")

def execute_phase1(product_url: str, model_name: str = None, session_id: str = "default-session", user_id: int = None):
    """Inicia la Fase 1 de manera asíncrona"""
    session_dir = get_session_dir(session_id)
    # Primero limpiar datos previos de la sesión para evitar estados incoherentes
    clean_outputs(session_id)
    
    thread = threading.Thread(target=_bg_phase1, args=(product_url, model_name, session_id, session_dir, user_id))
    thread.daemon = True
    thread.start()
    return {"status": "processing", "message": "Fase 1 iniciada en segundo plano"}

# --- Fase 2 ---
def _bg_phase2(num_reviewers: int, profile_parameters: Dict[str, Any], model_name: str, session_id: str, session_dir: str):
    from api.utils.pubsub import pubsub
    try:
        db.set_task_status(session_id, 'phase2', 'running')
        
        # Primero limpiar los perfiles anteriores de la sesión
        db.save_reviewers(session_id, [])
        
        # Definir callback para guardar perfiles en la base de datos en tiempo real
        def on_profile_gen(current_profiles):
            db.save_reviewers(session_id, current_profiles)
            if current_profiles:
                pubsub.publish(session_id, 'profile_generated', current_profiles[-1])
            
        phase2_results = run_phase2(
            num_reviewers, 
            profile_parameters, 
            model_name, 
            session_dir, 
            on_profile_generated=on_profile_gen
        )
        
        # Asegurar que se guarda el listado definitivo
        profiles = []
        if phase2_results and "profiles" in phase2_results:
            profiles = phase2_results["profiles"]
            db.save_reviewers(session_id, profiles)
            
        db.set_task_status(session_id, 'phase2', 'completed')
        pubsub.publish(session_id, 'phase2_completed', {'total': len(profiles)})
        print(f"✅ Fase 2 completada para sesión {session_id}")
    except Exception as e:
        error_trace = traceback.format_exc()
        db.set_task_status(session_id, 'phase2', 'failed', error=f"{str(e)}\n{error_trace}")
        pubsub.publish(session_id, 'phase2_failed', {'error': str(e)})
        print(f"❌ Error en Fase 2 para sesión {session_id}: {e}")

def execute_phase2(num_reviewers: int, profile_parameters: Dict[str, Any], model_name: str = None, session_id: str = "default-session"):
    """Inicia la Fase 2 de manera asíncrona"""
    session_dir = get_session_dir(session_id)
    # Limpiar YA los reseñadores: si no, un poll puede devolver perfiles
    # de una generación anterior (otra población / el simulador).
    db.set_task_status(session_id, 'phase2', 'pending')
    try:
        db.save_reviewers(session_id, [])
    except Exception as e:
        print(f"⚠️ No se pudieron limpiar reseñadores al iniciar phase2: {e}")
    
    thread = threading.Thread(target=_bg_phase2, args=(num_reviewers, profile_parameters, model_name, session_id, session_dir))
    thread.daemon = True
    thread.start()
    return {"status": "processing", "message": "Fase 2 iniciada en segundo plano"}

# --- Fase 3 ---
def _bg_phase3(product_info: Dict[str, Any], user_profiles: List[Dict[str, Any]], model_name: str, session_id: str, session_dir: str):
    from api.utils.pubsub import pubsub
    try:
        db.set_task_status(session_id, 'phase3', 'running')
        
        # Primero limpiar reseñas anteriores de la sesión
        db.save_reviews(session_id, [])
        
        # Definir callback para guardar en SQLite en tiempo real
        def on_review_gen(current_reviews):
            db.save_reviews(session_id, current_reviews)
            if current_reviews:
                pubsub.publish(session_id, 'review_generated', current_reviews[-1])
            
        reviews_result = run_phase3(
            product_info, 
            user_profiles, 
            model_name, 
            session_dir, 
            on_review_generated=on_review_gen
        )
        
        # Guardar lista final en SQLite
        total_reviews = 0
        if reviews_result and "reviews" in reviews_result:
            db.save_reviews(session_id, reviews_result["reviews"])
            total_reviews = len(reviews_result["reviews"])
            
        db.set_task_status(session_id, 'phase3', 'completed')
        pubsub.publish(session_id, 'phase3_completed', {'total': total_reviews})
        print(f"✅ Fase 3 completada para sesión {session_id}")
    except Exception as e:
        error_trace = traceback.format_exc()
        db.set_task_status(session_id, 'phase3', 'failed', error=f"{str(e)}\n{error_trace}")
        pubsub.publish(session_id, 'phase3_failed', {'error': str(e)})
        print(f"❌ Error en Fase 3 para sesión {session_id}: {e}")

def execute_phase3(product_info: Dict[str, Any], user_profiles: List[Dict[str, Any]], model_name: str = None, session_id: str = "default-session"):
    """Inicia la Fase 3 de manera asíncrona"""
    session_dir = get_session_dir(session_id)
    db.set_task_status(session_id, 'phase3', 'pending')
    
    thread = threading.Thread(target=_bg_phase3, args=(product_info, user_profiles, model_name, session_id, session_dir))
    thread.daemon = True
    thread.start()
    return {"status": "processing", "message": "Fase 3 iniciada en segundo plano"}

# --- Fase 4 ---
def _bg_phase4(model_name: str, session_id: str, session_dir: str):
    try:
        db.set_task_status(session_id, 'phase4', 'running')
        
        reviews = db.get_reviews(session_id)
        phase4_results = run_phase4(model_name, session_dir, reviews)
        analysis_data = phase4_results.json_dict
        
        # Guardar en SQLite
        db.save_analysis(session_id, analysis_data)
        db.set_task_status(session_id, 'phase4', 'completed')
        print(f"✅ Fase 4 completada para sesión {session_id}")
    except Exception as e:
        error_trace = traceback.format_exc()
        db.set_task_status(session_id, 'phase4', 'failed', error=f"{str(e)}\n{error_trace}")
        print(f"❌ Error en Fase 4 para sesión {session_id}: {e}")

def execute_phase4(model_name: str = None, session_id: str = "default-session"):
    """Inicia la Fase 4 de manera asíncrona"""
    session_dir = get_session_dir(session_id)
    db.set_task_status(session_id, 'phase4', 'pending')
    
    thread = threading.Thread(target=_bg_phase4, args=(model_name, session_id, session_dir))
    thread.daemon = True
    thread.start()
    return {"status": "processing", "message": "Fase 4 iniciada en segundo plano"} 