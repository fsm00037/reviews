from pydantic import BaseModel, Field
from typing import Literal, Optional, List, Tuple, Dict, Any

class Product(BaseModel):
    name: str = Field(..., description="Nombre del producto")
    description: str = Field(..., description="Descripción detallada del producto")
    price: str = Field(..., description="Precio del producto en formato string (ej. '149.99€')")
    image: str = Field(..., description="URL de la imagen del producto")
    category: str = Field(..., description="Categoría del producto")
    main_features: List[Dict[str, str]] = Field(..., description="Lista de características principales y sus explicaciones")
    technical_specs: List[Dict[str, str]] = Field(..., description="Lista de especificaciones técnicas y sus explicaciones")

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
    backstory: str = Field(..., description="Historia detallada del bot")

class UserProfilesResponse(BaseModel):
    profiles: List[BotProfile]

class Review(BaseModel):
    id: int = Field(..., description="ID único de la review")
    bot_id: int = Field(..., description="ID del bot que generó la review")
    product_id: int = Field(..., description="ID del producto al que pertenece la review")
    rating: int = Field(..., ge=1, le=5, description="Calificación de 1 a 5 estrellas")
    title: str = Field(..., description="Título de la review")
    content: str = Field(..., description="Contenido de la review")

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

class APIRequest(BaseModel):
    product_url: str = Field(..., description="URL del producto para generar reviews")
    num_reviewers: int = Field(3, description="Número de reseñadores a crear")
    model_name: Optional[str] = Field(None, description="Nombre del modelo LLM a utilizar")

class APIResponse(BaseModel):
    product: Dict[str, Any] = Field(..., description="Información del producto")
    reviewers: List[Dict[str, Any]] = Field(..., description="Perfiles de los reseñadores")
    reviews: List[Dict[str, Any]] = Field(..., description="Reseñas generadas")
    analysis: Optional[Dict[str, Any]] = Field(None, description="Análisis de las reseñas") 