from pydantic import BaseModel, Field
from typing import Literal, Optional, List, Dict, Any

class ProductRequest(BaseModel):
    product_url: str = Field(..., description="URL del producto para generar reviews")
    num_reviewers: int = Field(3, description="Número de reseñadores a crear")
    model_name: Optional[str] = Field(None, description="Nombre del modelo LLM a utilizar")

class ProductResponse(BaseModel):
    name: str
    description: str
    price: str
    image: str
    category: str
    main_features: List[Dict[str, str]]
    technical_specs: List[Dict[str, str]]

class ReviewerProfile(BaseModel):
    id: int
    name: str
    avatar: str
    bio: str
    age: int
    location: str
    gender: str
    education_level: str
    personality: Dict[str, int]
    backstory: str

class Review(BaseModel):
    id: int
    bot_id: int
    product_id: int
    rating: int
    title: str
    content: str

class KeywordAnalysis(BaseModel):
    word: str
    count: int
    sentiment: Literal["positive", "negative", "neutral"]

class AnalysisResult(BaseModel):
    average_rating: float
    rating_distribution: List[int]
    positive_points: List[str]
    negative_points: List[str]
    keyword_analysis: List[KeywordAnalysis]
    demographic_insights: List[str]

class APIResponse(BaseModel):
    product: Dict[str, Any]
    reviewers: List[Dict[str, Any]]
    reviews: List[Dict[str, Any]]
    analysis: Optional[Dict[str, Any]] = None 