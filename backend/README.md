# Backend para Simulador de Reviews de Productos

Este backend proporciona una API para el simulador de reviews de productos desarrollado con Flask. Utiliza el módulo `crew` para generar perfiles de usuarios, reviews de productos y análisis de estas reviews.

## Requisitos

- Python 3.9 o superior
- Las dependencias especificadas en `requirements.txt`

## Instalación

1. Clona este repositorio
2. Instala las dependencias:

```bash
pip install -r requirements.txt
```

## Configuración

El backend no requiere configuración especial para funcionar en modo de desarrollo. Todas las operaciones se realizan en memoria y no se necesita una base de datos externa.

## Iniciar el servidor

Para iniciar el servidor de desarrollo:

```bash
python run.py
```

Por defecto, el servidor se iniciará en http://localhost:5000.

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

## Ejemplo de flujo de uso

1. Crear un producto (POST /api/products)
2. Generar perfiles de bots (POST /api/bots/generate)
3. Generar reviews basadas en los bots (POST /api/reviews/generate)
4. Obtener análisis de las reviews (GET /api/analysis/product/{product_id})

## Modelos de Datos

Los modelos de datos utilizados en la API están definidos en el archivo `app.py` utilizando Pydantic. Estos modelos aseguran que los datos enviados y recibidos por la API tengan el formato correcto.

### Producto

```python
class Product(BaseModel):
    id: Optional[int] = None
    name: str
    description: str
    price: str  # Formato de string (ej. '$149.99')
    image: str  # URL de la imagen
    category: str
```

### Perfiles de Bot

```python
class BotProfile(BaseModel):
    id: int
    name: str
    avatar: str
    bio: str
    age: int
    location: str
    gender: str  # "Male", "Female", "Other"
    education_level: str
    personality: BotPersonality
```

### Reviews

```python
class Review(BaseModel):
    id: int
    bot_id: int
    product_id: int
    rating: int  # 1-5 estrellas
    title: str
    content: str
    date: str  # Formato: "Month DD, YYYY"
    helpful_votes: int
```

### Análisis de Reviews

```python
class AnalysisResult(BaseModel):
    average_rating: float
    rating_distribution: List[int]  # [1★, 2★, 3★, 4★, 5★]
    positive_points: List[str]
    negative_points: List[str]
    keyword_analysis: List[KeywordAnalysis]
    demographic_insights: List[str]
```

Para más detalles sobre los modelos de datos y sus campos, consulte el archivo `app.py` o los archivos de configuración del frontend. 