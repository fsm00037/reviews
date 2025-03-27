from flask import Flask, request, jsonify
from flask_cors import CORS
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Tuple, Dict, Literal, Any
import random
from datetime import datetime
import json
import os
import sys

# Añadir el directorio actual al path para importar los módulos de crew
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from crew.tasks import generate_bot_profiles, generate_product_reviews, analyze_reviews
from crew.config import CrewSettings

app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas las rutas

# Almacenamiento en memoria para la simulación
db = {
    "products": {},
    "bots": {},
    "reviews": {},
    "next_product_id": 1,
    "next_bot_id": 1,
    "next_review_id": 1
}

# Modelos Pydantic
class Product(BaseModel):
    id: Optional[int] = None
    name: str = Field(..., description="Nombre del producto")
    description: str = Field(..., description="Descripción detallada del producto")
    price: str = Field(..., description="Precio del producto en formato string (ej. '$149.99')")
    image: str = Field(..., description="URL de la imagen del producto")
    category: str = Field(..., description="Categoría del producto")

class DemographicConfig(BaseModel):
    age_range: Tuple[int, int] = Field(..., description="Rango de edad de los bots [min, max]")
    education_range: Tuple[int, int] = Field(..., description="Rango de nivel educativo en años [min, max]")
    gender_ratio: int = Field(..., ge=0, le=100, description="Porcentaje de bots masculinos (0-100)")

class PersonalityConfig(BaseModel):
    introvert_extrovert: Tuple[int, int] = Field(..., description="Rango de introversión/extroversión [min, max]")
    analytical_creative: Tuple[int, int] = Field(..., description="Rango de analítico/creativo [min, max]")
    busy_free_time: Tuple[int, int] = Field(..., description="Rango de ocupado/tiempo libre [min, max]")
    disorganized_organized: Tuple[int, int] = Field(..., description="Rango de desorganizado/organizado [min, max]")
    independent_cooperative: Tuple[int, int] = Field(..., description="Rango de independiente/cooperativo [min, max]")
    environmentalist: Tuple[int, int] = Field(..., description="Rango de conciencia ambiental [min, max]")
    safe_risky: Tuple[int, int] = Field(..., description="Rango de seguro/arriesgado [min, max]")

class BotConfigRequest(BaseModel):
    product_id: int = Field(..., description="ID del producto para generar reviews")
    population_range: Tuple[int, int] = Field(..., description="Rango de cantidad de bots a generar [min, max]")
    positivity_bias: Tuple[int, int] = Field(..., description="Rango de tendencia positiva [min, max]")
    verbosity: Tuple[int, int] = Field(..., description="Rango de verbosidad [min, max]")
    detail_level: Tuple[int, int] = Field(..., description="Rango de nivel de detalle [min, max]")
    demographics: DemographicConfig = Field(..., description="Configuración demográfica")
    personality: PersonalityConfig = Field(..., description="Configuración de personalidad")

class BotPersonality(BaseModel):
    introvert_extrovert: int = Field(..., ge=0, le=100)
    analytical_creative: int = Field(..., ge=0, le=100)
    busy_free_time: int = Field(..., ge=0, le=100)
    disorganized_organized: int = Field(..., ge=0, le=100)
    independent_cooperative: int = Field(..., ge=0, le=100)
    environmentalist: int = Field(..., ge=0, le=100)
    safe_risky: int = Field(..., ge=0, le=100)

class BotProfile(BaseModel):
    id: int = Field(..., description="ID único del bot")
    name: str = Field(..., description="Nombre completo del bot")
    avatar: str = Field(..., description="URL del avatar del bot")
    bio: str = Field(..., description="Biografía breve del bot")
    age: int = Field(..., description="Edad del bot")
    location: str = Field(..., description="Ubicación del bot")
    gender: str = Field(..., description="Género del bot (Male/Female/Other)")
    education_level: str = Field(..., description="Nivel educativo del bot")
    personality: BotPersonality = Field(..., description="Rasgos de personalidad del bot")

class Review(BaseModel):
    id: int = Field(..., description="ID único de la review")
    bot_id: int = Field(..., description="ID del bot que generó la review")
    product_id: int = Field(..., description="ID del producto al que pertenece la review")
    rating: int = Field(..., ge=1, le=5, description="Calificación de 1 a 5 estrellas")
    title: str = Field(..., description="Título de la review")
    content: str = Field(..., description="Contenido de la review")
    date: str = Field(..., description="Fecha de la review (formato: 'Month DD, YYYY')")
    helpful_votes: int = Field(..., ge=0, description="Número de votos útiles")

class KeywordAnalysis(BaseModel):
    word: str = Field(..., description="Palabra clave extraída")
    count: int = Field(..., description="Frecuencia de aparición")
    sentiment: Literal["positive", "negative", "neutral"] = Field(..., description="Sentimiento asociado")

class AnalysisResult(BaseModel):
    average_rating: float = Field(..., description="Calificación promedio")
    rating_distribution: List[int] = Field(..., description="Distribución de calificaciones [1★, 2★, 3★, 4★, 5★]")
    positive_points: List[str] = Field(..., description="Puntos positivos destacados")
    negative_points: List[str] = Field(..., description="Puntos negativos destacados")
    keyword_analysis: List[KeywordAnalysis] = Field(..., description="Análisis de palabras clave")
    demographic_insights: List[str] = Field(..., description="Insights demográficos")

# Helper para convertir objetos Pydantic a diccionarios con claves en snake_case
def pydantic_to_dict(model: BaseModel) -> Dict:
    return json.loads(model.json())

# Rutas para Productos
@app.route('/api/products', methods=['GET'])
def get_products():
    products = list(db["products"].values())
    return jsonify(products)

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    if product_id not in db["products"]:
        return jsonify({"error": "Producto no encontrado"}), 404
    return jsonify(db["products"][product_id])

@app.route('/api/products', methods=['POST'])
def create_product():
    data = request.json
    
    try:
        # Validar datos con Pydantic
        product = Product(**data)
        
        # Asignar ID y guardar en el almacenamiento
        product_id = db["next_product_id"]
        db["next_product_id"] += 1
        product.id = product_id
        
        # Convertir a diccionario y guardar
        product_dict = pydantic_to_dict(product)
        db["products"][product_id] = product_dict
        
        return jsonify(product_dict)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Rutas para Bots
@app.route('/api/bots/generate', methods=['POST'])
def generate_bots():
    data = request.json
    
    try:
        # Validar datos con Pydantic
        config = BotConfigRequest(**data)
        
        # Verificar que el producto existe
        if config.product_id not in db["products"]:
            return jsonify({"error": "Producto no encontrado"}), 404
        
        product = db["products"][config.product_id]
        
        # Llamar a la función del crew modificada para generar perfiles
        # Convertir la configuración al formato esperado por el generador de perfiles
        crew_settings = CrewSettings()
        
        # Generar perfiles usando la función de crew
        bot_profiles_data = generate_bot_profiles(
            population_range=config.population_range,
            demographics={
                "age_range": config.demographics.age_range,
                "education_range": config.demographics.education_range,
                "gender_ratio": config.demographics.gender_ratio
            },
            personality_ranges={
                "introvert_extrovert": config.personality.introvert_extrovert,
                "analytical_creative": config.personality.analytical_creative,
                "busy_free_time": config.personality.busy_free_time,
                "disorganized_organized": config.personality.disorganized_organized,
                "independent_cooperative": config.personality.independent_cooperative,
                "environmentalist": config.personality.environmentalist,
                "safe_risky": config.personality.safe_risky
            },
            product_info={
                "name": product["name"],
                "category": product["category"],
                "description": product["description"]
            }
        )
        
        # Procesar los perfiles generados y asignarles IDs
        bots = []
        for profile_data in bot_profiles_data:
            bot_id = db["next_bot_id"]
            db["next_bot_id"] += 1
            
            # Crear perfil con formato adecuado
            profile = {
                "id": bot_id,
                "name": profile_data["name"],
                "avatar": profile_data.get("avatar", f"/placeholder.svg?height=100&width=100&text={profile_data['name'][:2]}"),
                "bio": profile_data["bio"],
                "age": profile_data["age"],
                "location": profile_data["location"],
                "gender": profile_data["gender"],
                "education_level": profile_data["education_level"],
                "personality": {
                    "introvert_extrovert": profile_data["personality"]["introvert_extrovert"],
                    "analytical_creative": profile_data["personality"]["analytical_creative"],
                    "busy_free_time": profile_data["personality"]["busy_free_time"],
                    "disorganized_organized": profile_data["personality"]["disorganized_organized"],
                    "independent_cooperative": profile_data["personality"]["independent_cooperative"],
                    "environmentalist": profile_data["personality"]["environmentalist"],
                    "safe_risky": profile_data["personality"]["safe_risky"]
                }
            }
            
            # Validar con Pydantic
            bot_profile = BotProfile(**profile)
            profile_dict = pydantic_to_dict(bot_profile)
            
            db["bots"][bot_id] = profile_dict
            bots.append(profile_dict)
        
        return jsonify(bots)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/bots/<int:bot_id>', methods=['GET'])
def get_bot(bot_id):
    if bot_id not in db["bots"]:
        return jsonify({"error": "Bot no encontrado"}), 404
    return jsonify(db["bots"][bot_id])

# Rutas para Reviews
@app.route('/api/reviews/generate', methods=['POST'])
def generate_reviews_endpoint():
    data = request.json
    product_id = data.get("product_id")
    bot_ids = data.get("bot_ids", [])
    
    if not product_id or product_id not in db["products"]:
        return jsonify({"error": "Producto no encontrado"}), 404
    
    if not bot_ids:
        return jsonify({"error": "Se necesitan IDs de bots para generar reviews"}), 400
    
    # Verificar que los bots existen
    valid_bots = [bot_id for bot_id in bot_ids if bot_id in db["bots"]]
    if not valid_bots:
        return jsonify({"error": "Ninguno de los bots especificados existe"}), 400
    
    product = db["products"][product_id]
    bots = [db["bots"][bot_id] for bot_id in valid_bots]
    
    try:
        # Generar reviews usando la función del crew
        reviews_data = generate_product_reviews(
            product_info={
                "id": product["id"],
                "name": product["name"],
                "description": product["description"],
                "price": product["price"],
                "category": product["category"]
            },
            bot_profiles=bots
        )
        
        # Procesar las reviews generadas
        reviews = []
        for review_data in reviews_data:
            review_id = db["next_review_id"]
            db["next_review_id"] += 1
            
            # Crear review con formato adecuado
            review = {
                "id": review_id,
                "bot_id": review_data["bot_id"],
                "product_id": product_id,
                "rating": review_data["rating"],
                "title": review_data["title"],
                "content": review_data["content"],
                "date": review_data["date"],
                "helpful_votes": review_data.get("helpful_votes", random.randint(0, 50))
            }
            
            # Validar con Pydantic
            review_model = Review(**review)
            review_dict = pydantic_to_dict(review_model)
            
            db["reviews"][review_id] = review_dict
            reviews.append(review_dict)
        
        return jsonify(reviews)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/reviews/product/<int:product_id>', methods=['GET'])
def get_product_reviews(product_id):
    if product_id not in db["products"]:
        return jsonify({"error": "Producto no encontrado"}), 404
    
    product_reviews = [
        review for review in db["reviews"].values() 
        if review["product_id"] == product_id
    ]
    
    return jsonify(product_reviews)

# Rutas para Análisis
@app.route('/api/analysis/product/<int:product_id>', methods=['GET'])
def get_product_analysis(product_id):
    if product_id not in db["products"]:
        return jsonify({"error": "Producto no encontrado"}), 404
    
    product_reviews = [
        review for review in db["reviews"].values() 
        if review["product_id"] == product_id
    ]
    
    if not product_reviews:
        return jsonify({"error": "No hay reviews para analizar"}), 400
    
    try:
        # Generar análisis usando la función del crew
        product = db["products"][product_id]
        bots = {bot_id: db["bots"][bot_id] for bot_id in set(review["bot_id"] for review in product_reviews)}
        
        analysis_data = analyze_reviews(
            product_info=product,
            reviews=product_reviews,
            bot_profiles=list(bots.values())
        )
        
        # Formatear el resultado según el modelo esperado
        analysis_result = AnalysisResult(
            average_rating=analysis_data["average_rating"],
            rating_distribution=analysis_data["rating_distribution"],
            positive_points=analysis_data["positive_points"],
            negative_points=analysis_data["negative_points"],
            keyword_analysis=analysis_data["keyword_analysis"],
            demographic_insights=analysis_data["demographic_insights"]
        )
        
        return jsonify(pydantic_to_dict(analysis_result))
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    print("Iniciando API del Simulador de Reviews con Flask...")
    print("API disponible en: http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True) 