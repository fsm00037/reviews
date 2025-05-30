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

La API se ejecutará en `http://localhost:5000` por defecto.

## Endpoints

La API ofrece los siguientes endpoints:

### Health Check

```
GET /api/health
```

Verifica que la API está funcionando correctamente.

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": 1234567890.123
}
```

### Limpiar Outputs

```
POST /api/clean-outputs
```

Limpia la carpeta de outputs antes de iniciar un nuevo análisis. Útil para empezar un análisis completamente nuevo.

**Respuesta:**
```json
{
  "message": "Outputs limpiados correctamente"
}
```

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
  "profile_parameters": {
    "age_range": [25, 45],
    "locations": ["Madrid", "Barcelona", "Valencia"],
    "education_levels": ["Universitario", "Secundario", "Postgrado"]
  },
  "model_name": "gemini/gemini-2.0-flash"
}
```

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| num_reviewers | integer | Sí | Número de reseñadores a crear |
| profile_parameters | object | Sí | Parámetros para la generación de perfiles |
| model_name | string | No | Nombre del modelo LLM a utilizar |

### Fase 3: Generar reseñas

```
POST /api/phase3
```

Ejecuta solo la fase 3 del análisis: generar reseñas basadas en la información del producto y los perfiles de usuario.

**Cuerpo de la petición (JSON):**
```json
{
  "product_info": {
    "name": "Producto ejemplo",
    "description": "Descripción del producto",
    "price": "99.99€"
  },
  "user_profiles": [
    {
      "id": 1,
      "name": "Usuario 1",
      "age": 30,
      "personality": {...}
    }
  ],
  "model_name": "gemini/gemini-2.0-flash"
}
```

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| product_info | object | Sí | Información del producto obtenida de la fase 1 |
| user_profiles | array | Sí | Perfiles de usuario obtenidos de la fase 2 |
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

1. **Limpiar outputs** (opcional): `POST /api/clean-outputs`
2. **Fase 1**: Extraer información del producto con `POST /api/phase1`
3. **Fase 2**: Generar perfiles de usuario con `POST /api/phase2`
4. **Fase 3**: Generar las reseñas con `POST /api/phase3`
5. **Fase 4**: Compilar y analizar las reseñas con `POST /api/phase4`

Este enfoque permite un mayor control sobre el proceso y la posibilidad de revisar los resultados de cada fase antes de continuar.

## Configuración del Servidor

La API se ejecuta con las siguientes configuraciones por defecto:

- **Host**: `0.0.0.0` (accesible desde cualquier interfaz de red)
- **Puerto**: `5000`
- **Modo Debug**: Activado en desarrollo
- **CORS**: Habilitado para todas las rutas

## Dependencias

Las principales dependencias del proyecto son:

- **Flask 2.3.3**: Framework web
- **Flask-CORS 4.0.0**: Soporte para CORS
- **CrewAI**: Framework para agentes de IA
- **LangChain 0.1.5**: Framework para aplicaciones con LLM
- **Pydantic 2.6.1**: Validación de datos
- **Requests 2.31.0**: Cliente HTTP
- **Pandas 2.2.0**: Manipulación de datos
- **NumPy 1.26.3**: Computación numérica

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

### Errores de Conexión

1. **Error de conexión al servidor**:
   - Verifica que la API está ejecutándose en `http://localhost:5000`
   - Comprueba que no hay otros procesos usando el puerto 5000

2. **Errores CORS**:
   - La API tiene CORS habilitado por defecto
   - Si persisten los problemas, verifica la configuración del cliente

### Estructura de carpetas esperada

```
backend/
├── __init__.py
├── requirements.txt
├── api/
│   ├── __init__.py
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

## Ejemplos de Uso

### Análisis Completo

```bash
curl -X POST http://localhost:5000/api/analyze-all \
  -H "Content-Type: application/json" \
  -d '{
    "product_url": "https://www.amazon.es/producto-ejemplo",
    "num_reviewers": 5,
    "model_name": "gemini/gemini-2.0-flash"
  }'
```

### Análisis por Fases

```bash
# Fase 1: Extraer información del producto
curl -X POST http://localhost:5000/api/phase1 \
  -H "Content-Type: application/json" \
  -d '{
    "product_url": "https://www.amazon.es/producto-ejemplo"
  }'

# Fase 2: Crear perfiles de usuario
curl -X POST http://localhost:5000/api/phase2 \
  -H "Content-Type: application/json" \
  -d '{
    "num_reviewers": 3,
    "profile_parameters": {
      "age_range": [25, 45],
      "locations": ["Madrid", "Barcelona"]
    }
  }'
```

### Obtener Resultados

```bash
# Obtener todos los resultados
curl http://localhost:5000/api/results

# Obtener solo las reseñas
curl http://localhost:5000/api/reviews

# Obtener solo el análisis
curl http://localhost:5000/api/analysis
``` 