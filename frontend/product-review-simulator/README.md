# API para Simulador de Reviews de Productos

Este documento describe los modelos de datos y endpoints necesarios para la API que servirá al frontend del simulador de reviews de productos.

## Modelos de Datos (Pydantic BaseModel)

### Producto

```python
from pydantic import BaseModel, Field
from typing import Optional, List

class Product(BaseModel):
    id: Optional[int] = None
    name: str = Field(..., description="Nombre del producto")
    description: str = Field(..., description="Descripción detallada del producto")
    price: str = Field(..., description="Precio del producto en formato string (ej. '$149.99')")
    image: str = Field(..., description="URL de la imagen del producto")
    category: str = Field(..., description="Categoría del producto")
```

### Configuración de Perfiles de Bot

```python
from pydantic import BaseModel, Field
from typing import List, Tuple, Optional

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
```

### Perfil de Bot

```python
from pydantic import BaseModel, Field
from typing import Dict, Optional

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
```

### Review

```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Review(BaseModel):
    id: int = Field(..., description="ID único de la review")
    bot_id: int = Field(..., description="ID del bot que generó la review")
    product_id: int = Field(..., description="ID del producto al que pertenece la review")
    rating: int = Field(..., ge=1, le=5, description="Calificación de 1 a 5 estrellas")
    title: str = Field(..., description="Título de la review")
    content: str = Field(..., description="Contenido de la review")
    date: str = Field(..., description="Fecha de la review (formato: 'Month DD, YYYY')")
    helpful_votes: int = Field(..., ge=0, description="Número de votos útiles")
```

### Análisis de Reviews

```python
from pydantic import BaseModel, Field
from typing import List, Literal

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
```

## Endpoints de la API

### Productos

- `GET /api/products` - Obtener lista de productos
- `GET /api/products/{product_id}` - Obtener detalles de un producto específico
- `POST /api/products` - Crear un nuevo producto

### Generación de Bots

- `POST /api/bots/generate` - Generar perfiles de bots según la configuración
- `GET /api/bots/{bot_id}` - Obtener perfil de un bot específico

### Reviews

- `POST /api/reviews/generate` - Generar reviews basadas en perfiles de bots
- `GET /api/reviews/product/{product_id}` - Obtener reviews de un producto

### Análisis

- `GET /api/analysis/product/{product_id}` - Obtener análisis de reviews para un producto

## Ejemplo de Flujo de la API

1. Obtener o crear un producto (`GET /api/products/{id}` o `POST /api/products`)
2. Configurar y generar bots (`POST /api/bots/generate`)
3. Generar reviews basadas en los bots (`POST /api/reviews/generate`)
4. Obtener análisis de las reviews (`GET /api/analysis/product/{product_id}`) 