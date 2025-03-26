from fastapi import FastAPI, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Tuple, Dict, Literal
import random
from datetime import datetime
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="API para Simulador de Reviews de Productos")

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, reemplazar con el dominio específico
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos de datos
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

# Almacenamiento en memoria para la simulación
db = {
    "products": {},
    "bots": {},
    "reviews": {},
    "next_product_id": 1,
    "next_bot_id": 1,
    "next_review_id": 1
}

# Rutas para Productos
@app.get("/api/products", response_model=List[Product])
def get_products():
    return list(db["products"].values())

@app.get("/api/products/{product_id}", response_model=Product)
def get_product(product_id: int):
    if product_id not in db["products"]:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return db["products"][product_id]

@app.post("/api/products", response_model=Product)
def create_product(product: Product):
    product_id = db["next_product_id"]
    db["next_product_id"] += 1
    
    product_dict = product.dict()
    product_dict["id"] = product_id
    
    db["products"][product_id] = product_dict
    return product_dict

# Rutas para Bots
@app.post("/api/bots/generate", response_model=List[BotProfile])
def generate_bots(config: BotConfigRequest):
    if config.product_id not in db["products"]:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Simulación de generación de bots (implementar lógica similar al frontend)
    bots = []
    
    # Nombres de prueba
    male_first_names = ["James", "John", "Robert", "Michael", "David"]
    female_first_names = ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth"]
    last_names = ["Smith", "Johnson", "Williams", "Jones", "Brown"]
    
    # Ubicaciones de prueba
    cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"]
    states = ["NY", "CA", "IL", "TX", "AZ"]
    
    # Niveles educativos
    education_levels = [
        "High School",
        "Some College",
        "Associate's Degree",
        "Bachelor's Degree",
        "Master's Degree",
        "Doctorate",
    ]
    
    # Biografías de prueba
    bio_templates = [
        "Avid online shopper with a keen eye for quality products.",
        "Tech enthusiast who loves trying out the latest gadgets.",
        "Practical consumer focused on value and durability.",
        "Detail-oriented reviewer who tests products thoroughly.",
        "Casual shopper who appreciates good customer service."
    ]
    
    # Generar un número aleatorio de bots dentro del rango especificado
    num_bots = random.randint(config.population_range[0], config.population_range[1])
    
    for i in range(num_bots):
        # Determinar género basado en la proporción
        is_male = random.random() * 100 < config.demographics.gender_ratio
        
        # Seleccionar nombre basado en género
        first_name = random.choice(male_first_names if is_male else female_first_names)
        last_name = random.choice(last_names)
        name = f"{first_name} {last_name}"
        initials = f"{first_name[0]}{last_name[0]}"
        
        # Generar edad dentro del rango especificado
        age = random.randint(config.demographics.age_range[0], config.demographics.age_range[1])
        
        # Generar ubicación
        location_index = random.randint(0, len(cities) - 1)
        location = f"{cities[location_index]}, {states[location_index]}"
        
        # Determinar nivel educativo basado en el rango educativo
        years_of_education = random.randint(
            config.demographics.education_range[0], 
            config.demographics.education_range[1]
        )
        
        if years_of_education <= 12:
            education_level = education_levels[0]  # High School
        elif years_of_education <= 14:
            education_level = education_levels[1]  # Some College
        elif years_of_education <= 15:
            education_level = education_levels[2]  # Associate's
        elif years_of_education <= 16:
            education_level = education_levels[3]  # Bachelor's
        elif years_of_education <= 18:
            education_level = education_levels[4]  # Master's
        else:
            education_level = education_levels[5]  # Doctorate
        
        # Generar rasgos de personalidad dentro de los rangos especificados
        def generate_trait_value(range_values):
            return random.randint(range_values[0], range_values[1])
        
        bio = random.choice(bio_templates)
        
        bot_id = db["next_bot_id"]
        db["next_bot_id"] += 1
        
        bot = {
            "id": bot_id,
            "name": name,
            "avatar": f"/placeholder.svg?height=100&width=100&text={initials}",
            "bio": bio,
            "age": age,
            "location": location,
            "gender": "Male" if is_male else "Female",
            "education_level": education_level,
            "personality": {
                "introvert_extrovert": generate_trait_value(config.personality.introvert_extrovert),
                "analytical_creative": generate_trait_value(config.personality.analytical_creative),
                "busy_free_time": generate_trait_value(config.personality.busy_free_time),
                "disorganized_organized": generate_trait_value(config.personality.disorganized_organized),
                "independent_cooperative": generate_trait_value(config.personality.independent_cooperative),
                "environmentalist": generate_trait_value(config.personality.environmentalist),
                "safe_risky": generate_trait_value(config.personality.safe_risky),
            }
        }
        
        db["bots"][bot_id] = bot
        bots.append(bot)
    
    return bots

@app.get("/api/bots/{bot_id}", response_model=BotProfile)
def get_bot(bot_id: int):
    if bot_id not in db["bots"]:
        raise HTTPException(status_code=404, detail="Bot no encontrado")
    return db["bots"][bot_id]

# Rutas para Reviews
@app.post("/api/reviews/generate", response_model=List[Review])
def generate_reviews(data: Dict):
    product_id = data.get("product_id")
    bot_ids = data.get("bot_ids", [])
    
    if not product_id or product_id not in db["products"]:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    if not bot_ids:
        raise HTTPException(status_code=400, detail="Se necesitan IDs de bots para generar reviews")
    
    reviews = []
    
    # Títulos y contenidos de prueba para reviews
    review_title_positive = [
        "Excellent product, highly recommend!",
        "Exceeded my expectations!",
        "Best purchase I've made this year",
        "Absolutely love this product",
        "Great value for money",
    ]

    review_title_neutral = [
        "Decent product with some flaws",
        "Good but not great",
        "Meets basic expectations",
        "Average quality for the price",
        "Has pros and cons",
    ]

    review_title_negative = [
        "Disappointed with this purchase",
        "Not worth the money",
        "Had to return it",
        "Wouldn't recommend",
        "Several issues with this product",
    ]

    review_content_positive = [
        "I've been using this product for a few weeks now and I'm extremely satisfied. The quality is outstanding and it performs exactly as described.",
        "This product has completely changed my daily routine for the better. The features are intuitive and well-designed.",
        "After researching several options, I'm glad I chose this one. The attention to detail is evident in every aspect of the product.",
    ]

    review_content_neutral = [
        "This product is adequate for basic needs but doesn't offer anything special. The quality is acceptable but not outstanding.",
        "Mixed feelings about this purchase. On one hand, it works as described and the design is nice. On the other hand, there are some minor quality issues.",
        "An average product that meets basic expectations. Setup was straightforward and it functions properly, but there are competitors offering more features at similar prices.",
    ]

    review_content_negative = [
        "Unfortunately, this product didn't meet my expectations. The quality feels cheap compared to the price, and there were several functional issues right out of the box.",
        "I regret this purchase and have already started the return process. The product arrived damaged and even after replacement, it didn't work as advertised.",
        "This has been a disappointing experience from start to finish. The product is nothing like the description, with poor build quality and missing features.",
    ]
    
    # Nombres de meses para fechas formateadas
    months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    
    product = db["products"][product_id]
    
    for bot_id in bot_ids:
        if bot_id not in db["bots"]:
            continue  # Saltar bots que no existen
        
        bot = db["bots"][bot_id]
        
        # Determinar calificación basada en características del bot
        # Esto es una simplificación, se puede elaborar más
        if bot["personality"]["introvert_extrovert"] > 70:
            # Personas más extrovertidas tienden a ser más positivas
            rating = random.choice([4, 5, 5])
        elif bot["personality"]["analytical_creative"] < 30:
            # Personas más analíticas pueden ser más críticas
            rating = random.choice([2, 3, 4])
        elif bot["personality"]["safe_risky"] > 70:
            # Personas que toman riesgos pueden ser más indulgentes
            rating = random.choice([3, 4, 5])
        else:
            # Distribución más general
            rating = random.choice([1, 2, 3, 3, 4, 4, 5])
        
        # Seleccionar título basado en calificación
        if rating >= 4:
            title = random.choice(review_title_positive)
        elif rating == 3:
            title = random.choice(review_title_neutral)
        else:
            title = random.choice(review_title_negative)
        
        # Seleccionar contenido basado en calificación
        if rating >= 4:
            content = random.choice(review_content_positive)
        elif rating == 3:
            content = random.choice(review_content_neutral)
        else:
            content = random.choice(review_content_negative)
        
        # Personalizar el contenido según el producto
        content += f" The {product['name']} is a {product['category']} product that costs {product['price']}."
        
        # Generar fecha aleatoria en los últimos 90 días
        days_ago = random.randint(0, 90)
        review_date = datetime.now()
        review_date = review_date.replace(day=review_date.day - days_ago)
        formatted_date = f"{months[review_date.month-1]} {review_date.day}, {review_date.year}"
        
        # Votos útiles aleatorios
        helpful_votes = random.randint(0, 50)
        
        review_id = db["next_review_id"]
        db["next_review_id"] += 1
        
        review = {
            "id": review_id,
            "bot_id": bot_id,
            "product_id": product_id,
            "rating": rating,
            "title": title,
            "content": content,
            "date": formatted_date,
            "helpful_votes": helpful_votes
        }
        
        db["reviews"][review_id] = review
        reviews.append(review)
    
    return reviews

@app.get("/api/reviews/product/{product_id}", response_model=List[Review])
def get_product_reviews(product_id: int):
    if product_id not in db["products"]:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return [
        review for review in db["reviews"].values() 
        if review["product_id"] == product_id
    ]

# Rutas para Análisis
@app.get("/api/analysis/product/{product_id}", response_model=AnalysisResult)
def get_product_analysis(product_id: int):
    if product_id not in db["products"]:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    product_reviews = [
        review for review in db["reviews"].values() 
        if review["product_id"] == product_id
    ]
    
    if not product_reviews:
        raise HTTPException(status_code=400, detail="No hay reviews para analizar")
    
    # Calcular calificación promedio
    average_rating = sum(review["rating"] for review in product_reviews) / len(product_reviews)
    
    # Calcular distribución de calificaciones
    rating_distribution = [0, 0, 0, 0, 0]  # Índice 0 = 1 estrella, índice 4 = 5 estrellas
    for review in product_reviews:
        rating_distribution[review["rating"] - 1] += 1
    
    # Puntos positivos y negativos simulados
    positive_points = [
        "Good sound quality mentioned in several reviews",
        "Many users praise the comfortable design",
        "Battery life exceeds customer expectations",
        "Easy to set up according to multiple users",
        "Good value for money compared to competitors"
    ]
    
    negative_points = [
        "Some users report connectivity issues",
        "A few customers mentioned build quality concerns",
        "Price point considered high by budget-conscious users",
        "Limited color options mentioned by fashion-conscious users",
        "App could be improved according to tech-savvy users"
    ]
    
    # Análisis de palabras clave simulado
    keyword_analysis = [
        {"word": "quality", "count": 12, "sentiment": "positive"},
        {"word": "sound", "count": 10, "sentiment": "positive"},
        {"word": "comfortable", "count": 8, "sentiment": "positive"},
        {"word": "battery", "count": 7, "sentiment": "positive"},
        {"word": "price", "count": 6, "sentiment": "neutral"},
        {"word": "app", "count": 5, "sentiment": "negative"},
        {"word": "connectivity", "count": 4, "sentiment": "negative"},
        {"word": "design", "count": 3, "sentiment": "positive"},
        {"word": "easy", "count": 3, "sentiment": "positive"},
        {"word": "durability", "count": 2, "sentiment": "neutral"}
    ]
    
    # Insights demográficos simulados
    demographic_insights = [
        "Younger users (18-30) tend to focus more on app features and style",
        "Older users (45+) emphasize ease of use and comfort",
        "Higher educated users provide more technical feedback",
        "Male users mention battery life more frequently",
        "Female users comment more on design and ergonomics"
    ]
    
    return {
        "average_rating": average_rating,
        "rating_distribution": rating_distribution,
        "positive_points": positive_points,
        "negative_points": negative_points,
        "keyword_analysis": keyword_analysis,
        "demographic_insights": demographic_insights
    }

# Punto de entrada principal
if __name__ == "__main__":
    print("Iniciando API del Simulador de Reviews...")
    print("Documentación API: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000) 