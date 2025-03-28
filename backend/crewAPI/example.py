#!/usr/bin/env python
"""
Ejemplo de uso de crewAPI para generar reseñas de productos

Este script muestra cómo usar crewAPI desde el frontend para generar reseñas de productos
y obtener resultados en formato JSON.
"""

import json
import os
from models import APIRequest
from crew import run_api, main
import config

def ejemplo_simple():
    """
    Ejemplo básico de uso de crewAPI
    """
    print("=== Ejemplo Básico de Uso de crewAPI ===")
    # Crear un objeto de solicitud
    request = APIRequest(
        product_url=config.EXAMPLE_URLS["ikea"],
        num_reviewers=2,
        model_name=None  # Usa el modelo predeterminado
    )
    
    # Ejecutar la API
    print("\nGenerando reseñas para:", request.product_url)
    print("Número de reseñadores:", request.num_reviewers)
    print("\nEsto puede tomar unos minutos...")
    
    # Obtener los resultados
    response = run_api(request)
    
    # Acceder a los datos como propiedades del objeto
    print("\n=== Resultado de la API ===")
    print(f"Producto: {response.product['name']}")
    print(f"Precio: {response.product['price']}")
    print(f"Número de reseñadores: {len(response.reviewers)}")
    print(f"Número de reseñas: {len(response.reviews)}")
    if response.analysis:
        print(f"Valoración media: {response.analysis['average_rating']}")
    
    # Convertir a JSON para el frontend
    json_response = response.json(ensure_ascii=False, indent=2)
    
    # Guardar el resultado en un archivo para su uso posterior
    output_file = os.path.join(config.OUTPUT_DIR, "respuesta_api.json")
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(json_response)
    
    print(f"\nRespuesta completa guardada en: {output_file}")

def ejemplo_funcion_main():
    """
    Ejemplo de uso de la función main
    """
    print("\n=== Ejemplo Usando la Función Main ===")
    # Usar la función principal
    results = main(
        product_url=config.EXAMPLE_URLS["electronica"],
        num_reviewers=1,
        model_name=None
    )
    
    # Los resultados ya son un diccionario
    print(f"Producto: {results['product']['name']}")
    print(f"Reseña: {results['reviews'][0]['title'] if results['reviews'] else 'No hay reseñas'}")
    
    # Guardar el resultado en un archivo
    output_file = os.path.join(config.OUTPUT_DIR, "respuesta_main.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"Resultado guardado en: {output_file}")

if __name__ == "__main__":
    # Asegurarse de que el directorio de salida existe
    os.makedirs(config.OUTPUT_DIR, exist_ok=True)
    
    # Ejecutar los ejemplos
    try:
        ejemplo_simple()
        ejemplo_funcion_main()
    except Exception as e:
        print(f"Error al ejecutar el ejemplo: {e}") 