# API de Análisis de Productos

API RESTful para analizar productos y generar reseñas utilizando CrewAI.

## Instalación

1. Asegúrate de tener todas las dependencias instaladas:

```bash
pip install -r ../requirements.txt
```

## Ejecución

Para iniciar la API en modo desarrollo:

```bash
# Desde el directorio backend/api
python run.py
```

> **Nota importante**: Es necesario ejecutar el script desde la carpeta `backend/api` para que las importaciones funcionen correctamente.

## Endpoints

La API ofrece los siguientes endpoints:

### Health Check

```
GET /api/health
```

Verifica que la API está funcionando correctamente.

### Fase 1: Extraer información del producto

```
POST /api/phase1
```

Ejecuta solo la fase 1 del análisis: extraer información detallada del producto.

**Cuerpo de la petición (JSON):**
```json
{
  "product_url": "https://www.example.com/product",
  "model_name": "gemini/gemini-2.0-flash"
}
```

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| product_url | string | Sí | URL del producto a analizar |
| model_name | string | No | Nombre del modelo LLM a utilizar |

### Fase 2: Crear perfiles de usuario

```
POST /api/phase2
```

Ejecuta solo la fase 2 del análisis: crear perfiles de usuario para generar reseñas.

**Cuerpo de la petición (JSON):**
```json
{
  "num_reviewers": 3,
  "model_name": "gemini/gemini-2.0-flash"
}
```

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| num_reviewers | integer | Sí | Número de reseñadores a crear |
| model_name | string | No | Nombre del modelo LLM a utilizar |

### Fase 3: Generar reseñas

```
POST /api/phase3
```

Ejecuta solo la fase 3 del análisis: generar reseñas basadas en la información del producto y los perfiles de usuario.
Requiere que las fases 1 y 2 ya se hayan ejecutado.

**Cuerpo de la petición (JSON):**
```json
{
  "model_name": "gemini/gemini-2.0-flash"
}
```

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| model_name | string | No | Nombre del modelo LLM a utilizar |

### Fase 4: Compilar reseñas y generar informe

```
POST /api/phase4
```

Ejecuta solo la fase 4 del análisis: compilar todas las reseñas y generar un informe final.
Requiere que la fase 3 ya se haya ejecutado.

**Cuerpo de la petición (JSON):**
```json
{
  "model_name": "gemini/gemini-2.0-flash"
}
```

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| model_name | string | No | Nombre del modelo LLM a utilizar |

### Ejecutar todas las fases

```
POST /api/analyze-all
```

Ejecuta todas las fases en secuencia: extracción de información del producto, creación de perfiles, generación de reseñas y análisis final.

**Cuerpo de la petición (JSON):**
```json
{
  "product_url": "https://www.example.com/product",
  "num_reviewers": 3,
  "model_name": "gemini/gemini-2.0-flash"
}
```

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| product_url | string | Sí | URL del producto a analizar |
| num_reviewers | integer | No | Número de reseñadores a crear (por defecto: 3) |
| model_name | string | No | Nombre del modelo LLM a utilizar |

### Obtener Todos los Resultados

```
GET /api/results
```

Devuelve todos los resultados generados, incluyendo información del producto, perfiles de los reseñadores, reseñas y análisis.

### Obtener Información del Producto

```
GET /api/product
```

Devuelve la información del producto analizado.

### Obtener Perfiles de Reseñadores

```
GET /api/reviewers
```

Devuelve los perfiles de los reseñadores generados.

### Obtener Reseñas

```
GET /api/reviews
```

Devuelve todas las reseñas generadas.

### Obtener Análisis

```
GET /api/analysis
```

Devuelve el análisis final de las reseñas.

## Flujo de Trabajo por Fases

Para ejecutar el proceso completo paso a paso:

1. Primero ejecutar la fase 1 para extraer información del producto
2. Luego ejecutar la fase 2 para generar perfiles de usuario
3. Después ejecutar la fase 3 para generar las reseñas
4. Finalmente ejecutar la fase 4 para compilar y analizar las reseñas

Este enfoque permite un mayor control sobre el proceso y la posibilidad de revisar los resultados de cada fase antes de continuar.

## Solución de Problemas

### Errores de Importación de Módulos

Si encuentras errores relacionados con las importaciones de módulos:

1. **Error "No module named 'api'"**:
   - Asegúrate de ejecutar el script desde la carpeta `backend/api`: `python run.py`
   - No lo ejecutes como `python backend/api/run.py` desde otra ubicación

2. **Error "No module named 'config'"** u otros módulos de crewAPI:
   - La API utiliza importaciones dinámicas para cargar los módulos del paquete crewAPI
   - Verifica que todos los archivos necesarios existen: `config.py`, `models.py`, `agents.py`, `tasks.py` y `crew.py` en la carpeta `backend/crewAPI`
   - El módulo `run.py` configura el Python Path añadiendo las rutas necesarias

3. **Error "ModuleNotFoundError" para otros módulos**:
   - Asegúrate de que has instalado todas las dependencias con `pip install -r ../requirements.txt`
   - Verifica que existen archivos `__init__.py` en todas las carpetas del paquete

### Estructura de carpetas esperada

```
backend/
├── __init__.py
├── api/
│   ├── __init__.py
│   ├── app.py
│   ├── run.py (ejecutar este archivo)
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py
│   ├── routes/
│   │   ├── __init__.py
│   │   └── reviews.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── crew_service.py
│   │   └── results_service.py
│   └── utils/
│       ├── __init__.py
│       └── error_handlers.py
└── crewAPI/
    ├── __init__.py
    ├── agents.py
    ├── config.py
    ├── crew.py
    ├── models.py
    ├── tasks.py
    └── outputs/
        ├── producto.json
        ├── reviewers.json
        ├── informe_final.json
        └── reviews/
```

## Estructura de los Datos

### Producto

```json
{
  "name": "Nombre del Producto",
  "description": "Descripción detallada del producto",
  "price": "99,99 €",
  "image": "https://ejemplo.com/imagen.jpg",
  "category": "Categoría del Producto",
  "main_features": [
    {
      "feature": "Característica principal",
      "description": "Descripción de la característica"
    }
  ],
  "technical_specs": [
    {
      "spec": "Especificación técnica",
      "value": "Valor de la especificación"
    }
  ]
}
```

### Revisor

```json
{
  "id": 1,
  "name": "Nombre del Revisor",
  "avatar": "https://ejemplo.com/avatar.jpg",
  "bio": "Biografía corta",
  "age": 30,
  "location": "Ciudad, País",
  "gender": "Male/Female/Other",
  "education_level": "Nivel de Educación",
  "personality": {
    "introvert_extrovert": 60,
    "analytical_creative": 75,
    "busy_free_time": 80,
    "disorganized_organized": 70,
    "independent_cooperative": 50,
    "environmentalist": 95,
    "safe_risky": 40
  },
  "backstory": "Historia detallada del revisor"
}
```

### Reseña

```json
{
  "id": 1,
  "bot_id": 1,
  "product_id": 1,
  "rating": 4,
  "title": "Título de la reseña",
  "content": "Contenido detallado de la reseña"
}
```

### Análisis

```json
{
  "average_rating": 4.3,
  "rating_distribution": [0, 0, 1, 2, 1],
  "positive_points": [
    "Punto positivo 1",
    "Punto positivo 2"
  ],
  "negative_points": [
    "Punto negativo 1"
  ],
  "keyword_analysis": [
    {
      "word": "palabra clave",
      "count": 3,
      "sentiment": "positive"
    }
  ],
  "demographic_insights": [
    "Insight demográfico 1",
    "Insight demográfico 2"
  ]
}
``` 