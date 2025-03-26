import streamlit as st
import os
import json
import time
import pandas as pd
import matplotlib.pyplot as plt
import sys
from typing import Dict, Any, List

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import config
import solucionadorError
from crew import run_phase1, run_phase2, run_phase3, run_phase4, load_reviews, load_json_file

# Disable OpenTelemetry
solucionadorError.deshabilitar_opentelemetry()

# Set page configuration
st.set_page_config(
    page_title="CrewAI Product Review System",
    page_icon="🛍️",
    layout="wide"
)

# Ensure outputs directory exists
os.makedirs(config.OUTPUT_DIR, exist_ok=True)

# Initialize session state variables if they don't exist
if 'phase1_complete' not in st.session_state:
    st.session_state.phase1_complete = False
if 'phase2_complete' not in st.session_state:
    st.session_state.phase2_complete = False
if 'phase3_complete' not in st.session_state:
    st.session_state.phase3_complete = False
if 'phase4_complete' not in st.session_state:
    st.session_state.phase4_complete = False
if 'product_info' not in st.session_state:
    st.session_state.product_info = None
if 'user_profiles' not in st.session_state:
    st.session_state.user_profiles = None
if 'reviews' not in st.session_state:
    st.session_state.reviews = None
if 'final_report' not in st.session_state:
    st.session_state.final_report = None
if 'current_phase' not in st.session_state:
    st.session_state.current_phase = 0

# Title and description
st.title("🛍️ CrewAI Product Review System")
st.markdown("""
Este sistema utiliza agentes de CrewAI para analizar productos, crear perfiles de usuario, generar reseñas detalladas y compilar un informe final.

Sigue los pasos a continuación para generar un análisis completo de un producto.
""")

# Sidebar for configuration
with st.sidebar:
    st.header("Configuración")
    
    # API key input
    api_key = st.text_input("API Key de Gemini (opcional)", type="password")
    if api_key:
        os.environ["GEMINI_API_KEY"] = api_key
    
    # Model selection
    model_name = st.selectbox(
        "Modelo LLM",
        ["gemini/gemini-2.0-flash", "gemini/gemini-2.0-pro", "gemini/gemini-1.5-flash", "gemini/gemini-1.5-pro"]
    )
    
    # Example URLs
    st.subheader("URLs de ejemplo")
    for name, url in config.EXAMPLE_URLS.items():
        if st.button(f"Usar ejemplo: {name.capitalize()}"):
            st.session_state.product_url = url
    
    # Progress indicator
    st.subheader("Progreso")
    phases = ["Fase 1", "Fase 2", "Fase 3", "Fase 4"]
    phase_complete = [st.session_state.phase1_complete, st.session_state.phase2_complete, 
                      st.session_state.phase3_complete, st.session_state.phase4_complete]
    
    for i, (phase, complete) in enumerate(zip(phases, phase_complete)):
        if complete:
            st.success(f"✅ {phase} completada")
        else:
            st.info(f"⏳ {phase} pendiente")

# Main content area with tabs
tabs = st.tabs(["Fase 1: Información del Producto", "Fase 2: Generación de Usuarios", "Fase 3: Generación de Reseñas", "Fase 4: Análisis"])

# Phase 1 tab: Product Information
with tabs[0]:
    st.header("Fase 1: Extracción de Información del Producto")
    
    # Product URL input
    product_url = st.text_input(
        "URL del producto a analizar", 
        value=st.session_state.get('product_url', config.EXAMPLE_URLS["ikea"])
    )
    
    # Run Phase 1 button
    if st.button("Ejecutar Fase 1", key="run_phase1"):
        with st.spinner("Analizando producto..."):
            # Run Phase 1
            try:
                # Create a placeholder for progress updates
                progress_placeholder = st.empty()
                progress_placeholder.text("Iniciando análisis del producto...")
                
                # Run Phase 1
                phase1_results = run_phase1(product_url, model_name)
                
                # Validate results
                if not phase1_results or not isinstance(phase1_results.get('product_info', None), dict):
                    raise ValueError("No se pudo extraer la información del producto correctamente")
                
                # Update session state
                st.session_state.phase1_complete = True
                st.session_state.product_info = phase1_results["product_info"]
                st.session_state.current_phase = 1
                
                # Show success message
                st.success("¡Fase 1 completada con éxito! Información del producto extraída correctamente.")
                
                # Automatically switch to the next tab
                st.rerun()
            except Exception as e:
                st.error(f"Error al ejecutar la Fase 1: {str(e)}")
                import traceback
                st.error(traceback.format_exc())  # This will show the full stack trace
    
    # Display Phase 1 results if available
    if st.session_state.phase1_complete:
        # Función recursiva para mostrar cualquier estructura JSON
        def display_json_value(value, level=0):
            if isinstance(value, dict):
                for k, v in value.items():
                    key_display = k.replace('_', ' ').capitalize()
                    if isinstance(v, (dict, list)):
                        if level == 0:
                            with st.expander(key_display):
                                display_json_value(v, level + 1)
                        else:
                            st.markdown(f"**{key_display}:**")
                            display_json_value(v, level + 1)
                    else:
                        if v is not None:
                            st.markdown(f"**{key_display}:** {v}")
            elif isinstance(value, list):
                for i, item in enumerate(value):
                    if isinstance(item, (dict, list)):
                        if level == 0:
                            with st.expander(f"Item {i+1}"):
                                display_json_value(item, level + 1)
                        else:
                            st.markdown(f"**Item {i+1}:**")
                            display_json_value(item, level + 1)
                    else:
                        st.markdown(f"- {item}")
            elif value is not None:
                st.markdown(str(value))
        
        # Display product info
        st.subheader("Información del Producto")
        product_info = st.session_state.product_info
        
        # Option to see raw JSON
        if st.checkbox("Ver JSON completo", key="view_json_product"):
            st.json(product_info)
        else:
            # Display all product information
            display_json_value(product_info)

# Phase 2 tab: User Profile Generation
with tabs[1]:
    st.header("Fase 2: Generación de Perfiles de Usuario")
    
    if not st.session_state.phase1_complete:
        st.warning("Primero debes completar la Fase 1 para generar los perfiles de usuario.")
    else:
        # Number of reviewers with increased limit
        num_reviewers = st.slider(
            "Número de perfiles de usuario a generar", 
            min_value=1, 
            max_value=10,  # Reasonable maximum limit
            value=config.DEFAULT_NUM_REVIEWERS
        )
        
        # Run Phase 2 button
        if st.button("Ejecutar Fase 2", key="run_phase2"):
            with st.spinner("Generando perfiles de usuario..."):
                try:
                    # Create a placeholder for progress updates
                    progress_placeholder = st.empty()
                    progress_placeholder.text("Iniciando generación de perfiles...")
                    
                    # Validate product info exists
                    if not st.session_state.product_info:
                        raise ValueError("La información del producto no está disponible. Ejecuta la Fase 1 primero.")
                    
                    # Run Phase 2
                    phase2_results = run_phase2(num_reviewers, model_name)
                    
                    # Validate results
                    if not phase2_results or not isinstance(phase2_results.get('user_profiles', None), list):
                        raise ValueError("No se pudieron generar los perfiles de usuario correctamente")
                    
                    # Update session state
                    st.session_state.phase2_complete = True
                    st.session_state.user_profiles = phase2_results["user_profiles"]
                    st.session_state.current_phase = 2
                    
                    # Show success message
                    st.success(f"¡Fase 2 completada con éxito! {len(st.session_state.user_profiles)} perfiles de usuario generados.")
                    
                    # Automatically switch to the next tab
                    st.rerun()
                except Exception as e:
                    st.error(f"Error al ejecutar la Fase 2: {str(e)}")
                    import traceback
                    st.error(traceback.format_exc())  # This will show the full stack trace

        # Display user profiles if available
        if st.session_state.user_profiles:
            st.subheader("Perfiles de Usuario Generados")
            
            # Option to see raw JSON
            if st.checkbox("Ver JSON de perfiles completo", key="view_json_profiles"):
                st.json(st.session_state.user_profiles)
            else:
                user_profiles = st.session_state.user_profiles
                
                for i, profile in enumerate(user_profiles):
                    with st.expander(f"Usuario {i+1}: {profile.get('name', 'Sin nombre')}"):
                        # Display all profile data
                        for key, value in profile.items():
                            if key != 'nombre':  # Already shown in the expander title
                                key_display = key.replace('_', ' ').capitalize()
                                st.markdown(f"**{key_display}:** {value}")

# Phase 3 tab: Review Generation
with tabs[2]:
    st.header("Fase 3: Generación de Reseñas")
    
    if not st.session_state.phase2_complete:
        st.warning("Completa las Fases 1 y 2 antes de generar reseñas.")
    else:
        # Run Phase 3 button
        if st.button("Ejecutar Fase 3", key="run_phase3"):
            with st.spinner("Generando reseñas..."):
                try:
                    # Create a placeholder for progress updates
                    progress_placeholder = st.empty()
                    progress_placeholder.text("Iniciando generación de reseñas...")
                    
                    # Validate prerequisites
                    if not st.session_state.product_info:
                        raise ValueError("La información del producto no está disponible. Ejecuta la Fase 1 primero.")
                    
                    if not st.session_state.user_profiles:
                        raise ValueError("Los perfiles de usuario no están disponibles. Ejecuta la Fase 2 primero.")
                    
                    # Run Phase 3
                    phase3_results = run_phase3(
                        st.session_state.product_info,
                        st.session_state.user_profiles,
                        model_name
                    )
                    
                    # Validate results
                    if not phase3_results or not isinstance(phase3_results.get('reviews', None), list):
                        raise ValueError("No se pudieron generar las reseñas correctamente")
                    
                    # Update session state
                    st.session_state.phase3_complete = True
                    st.session_state.reviews = phase3_results["reviews"]
                    st.session_state.current_phase = 3
                    
                    # Show success message
                    st.success(f"¡Fase 3 completada con éxito! {len(st.session_state.reviews)} reseñas generadas.")
                    
                    # Automatically switch to the next tab
                    st.rerun()
                except Exception as e:
                    st.error(f"Error al ejecutar la Fase 3: {str(e)}")
                    import traceback
                    st.error(traceback.format_exc())
        
        # Display reviews if available
        if st.session_state.reviews:
            st.subheader("Reseñas Generadas")
            
            # Option to see raw JSON
            if st.checkbox("Ver JSON de reseñas completo", key="view_json_reviews"):
                st.json(st.session_state.reviews)
            else:
                try:
                    # Load reviews from files
                    reviews = load_reviews()
                    
                    for i, review in enumerate(reviews):
                        with st.expander(f"Reseña {i+1}"):
                            # Display review content in markdown format
                            review_content = review.get('contenido', '')
                            st.markdown(review_content)
                except Exception as e:
                    st.error(f"Error al cargar las reseñas: {str(e)}")

# Phase 4 tab: Final Report
with tabs[3]:
    st.header("Fase 4: Compilación y Análisis Final")
    
    if not st.session_state.phase3_complete:
        st.warning("Completa las Fases 1, 2 y 3 antes de generar el informe final.")
    else:
        # Run Phase 4 button
        if st.button("Ejecutar Fase 4", key="run_phase4"):
            with st.spinner("Generando informe final..."):
                try:
                    # Create a placeholder for progress updates
                    progress_placeholder = st.empty()
                    progress_placeholder.text("Iniciando compilación de reseñas...")
                    
                    # Validate prerequisites
                    if not os.path.exists(config.REVIEWS_DIR):
                        raise ValueError("No hay reseñas disponibles. Ejecuta la Fase 3 primero.")
                    
                    # Run Phase 4
                    phase4_results = run_phase4(model_name)
                    
                
                    
                    # Update session state
                    st.session_state.phase4_complete = True
                    st.session_state.final_report = phase4_results["final_report"]
                    st.session_state.current_phase = 4
                    
                    # Show success message
                    st.success("¡Fase 4 completada con éxito! Informe final generado.")
                    
                    # Refresh the page to show results
                    st.rerun()
                except Exception as e:
                    st.error(f"Error al ejecutar la Fase 4: {str(e)}")
                    import traceback
                    st.error(traceback.format_exc())  # This will show the full stack trace
        
        # Display final report if available
        if st.session_state.final_report:

            st.subheader("Informe Final")
            
            
            st.markdown(st.session_state.final_report, unsafe_allow_html=True)
            
           
                
        

# Add a button to run all phases sequentially
st.markdown("---")
st.header("Ejecutar Proceso Completo")

if st.button("Ejecutar Todas las Fases", key="run_all_phases"):
    # Get URL and number of reviewers
    product_url = st.session_state.get('product_url', config.EXAMPLE_URLS["ikea"])
    num_reviewers = config.DEFAULT_NUM_REVIEWERS
    
    with st.spinner("Ejecutando proceso completo..."):
        try:
            # Create a placeholder for progress updates
            progress_placeholder = st.empty()
            
            # Phase 1
            progress_placeholder.text("Fase 1: Analizando producto...")
            phase1_results = run_phase1(product_url, model_name)
            st.session_state.phase1_complete = True
            st.session_state.product_info = phase1_results["product_info"]
            
            # Phase 2
            progress_placeholder.text("Fase 2: Generando perfiles de usuario...")
            phase2_results = run_phase2(num_reviewers, model_name)
            st.session_state.phase2_complete = True
            st.session_state.user_profiles = phase2_results["user_profiles"]
            
            # Phase 3
            progress_placeholder.text("Fase 3: Generando reseñas...")
            phase3_results = run_phase3(
                st.session_state.product_info,
                st.session_state.user_profiles,
                model_name
            )
            st.session_state.phase3_complete = True
            st.session_state.reviews = phase3_results["reviews"]
            
            # Phase 4
            progress_placeholder.text("Fase 4: Generando informe final...")
            phase4_results = run_phase4(model_name)
            st.session_state.phase4_complete = True
            st.session_state.final_report = phase4_results["final_report"]
            
            # Show success message
            st.success("¡Proceso completo ejecutado con éxito!")
            
            # Refresh the page to show all results
            st.rerun()
        except Exception as e:
            st.error(f"Error al ejecutar el proceso completo: {str(e)}")
            import traceback
            st.error(traceback.format_exc())  # This will show the full stack trace

