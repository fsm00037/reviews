from pydantic import BaseModel, Field
from typing import Literal, Optional, List, Dict, Any


class Feature(BaseModel):
    feature: str = Field(..., description="Característica del producto")
    value: str = Field(..., description="Valor de la característica")


class TechnicalSpec(BaseModel):
    spec: str = Field(..., description="Especificación técnica del producto")
    value: str = Field(..., description="Valor de la especificación técnica")


class Product(BaseModel):
    name: str = Field(..., description="Nombre del producto")
    description: str = Field(..., description="Descripción detallada del producto")
    price: str = Field(..., description="Precio del producto en formato string (ej. '149.99€')")
    image: str = Field(..., description="URL de la imagen del producto")
    category: str = Field(..., description="Categoría del producto")
    main_features: List[Feature] = Field(..., description="Lista de características principales y sus explicaciones")
    technical_specs: List[TechnicalSpec] = Field(..., description="Lista de especificaciones técnicas y sus explicaciones")


class BotPersonality(BaseModel):
    introvert_extrovert: int = Field(..., ge=0, le=100)
    analytical_creative: int = Field(..., ge=0, le=100)
    busy_free_time: int = Field(..., ge=0, le=100)
    disorganized_organized: int = Field(..., ge=0, le=100)
    independent_cooperative: int = Field(..., ge=0, le=100)
    environmentalist: int = Field(..., ge=0, le=100)
    safe_risky: int = Field(..., ge=0, le=100)
    # Extended psychographic axes (0-100)
    price_sensitive_premium: int = Field(50, ge=0, le=100, description="0=muy sensible al precio, 100=prefiere premium")
    brand_loyal_explorer: int = Field(50, ge=0, le=100, description="0=fiel a marcas, 100=explora novedades")
    tech_novice_expert: int = Field(50, ge=0, le=100, description="0=poco tech, 100=early adopter")
    skeptic_enthusiast: int = Field(50, ge=0, le=100, description="0=escéptico, 100=entusiasta")


class Appearance3D(BaseModel):
    """Parámetros físicos para la simulación 3D de la población."""
    height: float = Field(1.70, ge=1.40, le=2.10, description="Altura en metros")
    body_type: Literal["slim", "average", "athletic", "heavy"] = Field("average")
    skin_tone: Literal["fair", "light", "medium", "olive", "tan", "brown", "dark"] = Field("medium")
    hair_color: Literal["black", "brown", "blonde", "red", "gray", "white", "blue", "pink"] = Field("brown")
    hair_style: Literal["short", "medium", "long", "bald", "curly", "ponytail", "bun"] = Field("medium")
    clothing_style: Literal["casual", "formal", "sporty", "streetwear", "bohemian", "techwear"] = Field("casual")
    primary_color: str = Field("#6366f1", description="Color hex de ropa principal")
    secondary_color: str = Field("#a5b4fc", description="Color hex de acento")
    energy: float = Field(0.5, ge=0.0, le=1.0, description="Nivel de animación/movimiento 0-1")


class ReviewStyle(BaseModel):
    """Cómo escribe y valora este reseñador (parametrizable)."""
    positivity: int = Field(50, ge=0, le=100)
    verbosity: int = Field(
        50,
        ge=0,
        le=100,
        description="Verbosidad del reseñador: 0=pocas palabras, 100=muy hablador",
    )
    detail_level: int = Field(50, ge=0, le=100)
    formality: int = Field(50, ge=0, le=100, description="0=muy coloquial, 100=formal")
    emoji_usage: int = Field(20, ge=0, le=100)
    typo_tendency: int = Field(10, ge=0, le=100, description="Probabilidad de errores tipográficos leves")
    complaint_focus: int = Field(40, ge=0, le=100, description="Tendencia a centrarse en fallos")


class ConsumerProfile(BaseModel):
    """Perfil de consumidor para realismo comercial."""
    occupation: str = Field("Profesional", description="Ocupación actual")
    income_level: Literal["low", "medium", "high", "very_high"] = Field("medium")
    household: Literal["alone", "couple", "family_kids", "shared", "other"] = Field("alone")
    shopping_channel: Literal["online", "physical", "both"] = Field("both")
    interests: List[str] = Field(default_factory=list)
    pain_points: List[str] = Field(default_factory=list)
    brand_preferences: List[str] = Field(default_factory=list)
    recent_purchase_context: str = Field("", description="Contexto de compra reciente o motivo de interés")


class BotProfile(BaseModel):
    id: int = Field(..., description="ID único del bot")
    name: str = Field(..., description="Nombre completo del bot")
    avatar: Optional[str] = Field(default="", description="URL del avatar del bot")
    bio: str = Field(..., description="Biografía breve del bot")
    age: int = Field(..., description="Edad del bot")
    location: str = Field(..., description="Ubicación del bot")
    gender: Literal["Male", "Female", "Other"] = Field(..., description="Género del bot")
    education_level: str = Field(..., description="Nivel educativo del bot")
    personality: BotPersonality = Field(..., description="Rasgos de personalidad del bot")
    backstory: str = Field(..., description="Historia detallada del bot")
    # Extended commercial realism fields
    appearance: Optional[Appearance3D] = Field(default=None, description="Apariencia 3D")
    consumer: Optional[ConsumerProfile] = Field(default=None, description="Perfil de consumidor")
    review_style: Optional[ReviewStyle] = Field(default=None, description="Estilo de reseña")


class PopulationAgeRange(BaseModel):
    """Rango de edades decidido por el agente para toda la población."""
    age_min: int = Field(..., ge=16, le=90, description="Edad mínima de la población")
    age_max: int = Field(..., ge=16, le=90, description="Edad máxima de la población")
    rationale: str = Field("", description="Breve justificación del rango elegido")


class AgentPopulationConfig(BaseModel):
    """
    Configuración completa de población decidida por el agente a partir del prompt.
    Cada par [low, high] es un rango 0-100 (salvo edades).
    """
    age_min: int = Field(..., ge=16, le=90, description="Edad mínima")
    age_max: int = Field(..., ge=16, le=90, description="Edad máxima")
    education_level: Literal["Low", "Medium", "High", "Mixed"] = Field(
        "Mixed", description="Nivel educativo dominante de la población"
    )
    gender_ratio: Literal["Male", "Female", "Male&Female"] = Field(
        "Male&Female", description="Composición de género"
    )
    income_level: Literal["low", "medium", "high", "very_high", "Mixed"] = Field(
        "Mixed", description="Nivel de renta dominante"
    )

    # Personalidad: rangos [min, max] 0-100
    introvert_extrovert: List[int] = Field(..., min_length=2, max_length=2)
    analytical_creative: List[int] = Field(..., min_length=2, max_length=2)
    busy_free_time: List[int] = Field(..., min_length=2, max_length=2)
    disorganized_organized: List[int] = Field(..., min_length=2, max_length=2)
    independent_cooperative: List[int] = Field(..., min_length=2, max_length=2)
    environmentalist: List[int] = Field(..., min_length=2, max_length=2)
    safe_risky: List[int] = Field(..., min_length=2, max_length=2)
    price_sensitive_premium: List[int] = Field(..., min_length=2, max_length=2)
    brand_loyal_explorer: List[int] = Field(..., min_length=2, max_length=2)
    tech_novice_expert: List[int] = Field(..., min_length=2, max_length=2)
    skeptic_enthusiast: List[int] = Field(..., min_length=2, max_length=2)

    # Estilo de reseña de la población [min, max]
    positivity_bias: List[int] = Field(..., min_length=2, max_length=2)
    verbosity: List[int] = Field(..., min_length=2, max_length=2)
    detail_level: List[int] = Field(..., min_length=2, max_length=2)

    config_rationale: str = Field(
        "",
        description="Breve justificación en español de por qué estos rangos encajan con el prompt",
    )


class UserProfilesResponse(BaseModel):
    profiles: List[BotProfile]


class Review(BaseModel):
    id: int = Field(..., description="ID único de la review")
    bot_id: int = Field(..., description="ID del bot que generó la review")
    product_id: int = Field(..., description="ID del producto al que pertenece la review")
    rating: int = Field(..., ge=1, le=5, description="Calificación de 1 a 5 estrellas")
    title: str = Field(..., description="Título de la review")
    content: str = Field(..., description="Contenido de la review")
    # Optional realism metadata
    pros: Optional[List[str]] = Field(default=None, description="Puntos a favor mencionados")
    cons: Optional[List[str]] = Field(default=None, description="Puntos en contra mencionados")
    would_recommend: Optional[bool] = Field(default=None)
    usage_duration: Optional[str] = Field(default=None, description="Tiempo de uso simulado (ej. '2 semanas')")
    verified_purchase: Optional[bool] = Field(default=True)


class KeywordAnalysis(BaseModel):
    word: str = Field(..., description="Palabra clave extraída")
    count: int = Field(..., description="Frecuencia de aparición")
    sentiment: Literal["positive", "negative", "neutral"] = Field(..., description="Sentimiento asociado")


class RatingDistribution(BaseModel):
    one_star: int = Field(..., description="Número de 1 estrella")
    two_stars: int = Field(..., description="Número de 2 estrellas")
    three_stars: int = Field(..., description="Número de 3 estrellas")
    four_stars: int = Field(..., description="Número de 4 estrellas")
    five_stars: int = Field(..., description="Número de 5 estrellas")


class AnalysisResult(BaseModel):
    average_rating: float = Field(..., description="Calificación promedio")
    rating_distribution: RatingDistribution = Field(..., description="Distribución de calificaciones")
    positive_points: List[str] = Field(..., description="Puntos positivos destacados")
    negative_points: List[str] = Field(..., description="Puntos negativos destacados")
    keyword_analysis: List[KeywordAnalysis] = Field(..., description="Análisis de palabras clave")
    demographic_insights: List[str] = Field(..., description="Insights demográficos")
    # Commercial extras
    market_fit_score: Optional[float] = Field(None, ge=0, le=100, description="Encaje de mercado estimado 0-100")
    launch_recommendation: Optional[str] = Field(None, description="Recomendación de lanzamiento")
    segment_breakdown: Optional[List[Dict[str, Any]]] = Field(None, description="Desglose por segmentos")


class APIRequest(BaseModel):
    product_url: str = Field(..., description="URL del producto para generar reviews")
    num_reviewers: int = Field(3, description="Número de reseñadores a crear")
    model_name: Optional[str] = Field(None, description="Nombre del modelo LLM a utilizar")


class APIResponse(BaseModel):
    product: Dict[str, Any] = Field(..., description="Información del producto")
    reviewers: List[Dict[str, Any]] = Field(..., description="Perfiles de los reseñadores")
    reviews: List[Dict[str, Any]] = Field(..., description="Reseñas generadas")
    analysis: Optional[Dict[str, Any]] = Field(None, description="Análisis de las reseñas")
