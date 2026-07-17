# PreMarket Lab

**Testea productos con poblaciones sintéticas realistas antes de salir al mercado.**

Simula un panel de consumidores parametrizable, visualízalo en **3D**, genera **reseñas hiperrealistas** con IA y obtén un informe de market fit / recomendación de lanzamiento.

[![Ver video](https://img.youtube.com/vi/rJehk2688yA/0.jpg)](https://www.youtube.com/watch?v=rJehk2688yA)

## Qué resuelve

| Problema | Cómo lo aborda PreMarket Lab |
|----------|------------------------------|
| No sabes cómo reaccionará el mercado | Poblaciones sintéticas demográficas y psicográficas |
| Focus groups caros y lentos | Generación paralela de N reseñadores + reseñas |
| Perfiles genéricos de IA | Historia, ocupación, renta, estilo de escritura, pros/cons |
| Difícil “ver” a tu target | Simulación 3D de la población (layout por personalidad) |
| ¿Lanzar o iterar? | Market fit score + recomendación de lanzamiento |

## Flujo del producto

1. **Producto** — URL o ficha manual  
2. **Población** — presets, prompt natural o sliders (demografía, personalidad, renta, estilo de reseña)  
3. **Perfiles 3D** — personas físicas en escena interactiva  
4. **Reseñas** — tono humano, pros/cons, tiempo de uso, recomendación  
5. **Dashboard** — métricas, insights, market fit, mejoras  

## Estructura

```
reviews/
├── backend/          # API Flask + CrewAI / LiteLLM
│   ├── api/          # Rutas, DB SQLite, SSE
│   └── crewAPI/      # Agentes, realismo, fases
└── frontend/
    └── product-review-simulator/   # Next.js + R3F (3D)
```

## Backend

### Requisitos
- Python 3.10+
- Clave LLM (`GEMINI_API_KEY` o compatible OpenAI)

### Instalación

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### Variables de entorno (`backend/.env`)

```env
GEMINI_API_KEY=tu_clave_gemini
# Opcional: endpoint OpenAI-compatible
# OPENAI_API_BASE=...
# OPENAI_API_KEY=...
# OPENAI_MODEL_NAME=...
```

### Ejecución

```bash
cd backend/api
python run.py
```

API en `http://localhost:5000`

## Frontend

### Requisitos
- Node.js 18+

```bash
cd frontend/product-review-simulator
npm install --legacy-peer-deps
npm run dev
```

App en `http://localhost:3000`

> Las dependencias 3D (`three`, `@react-three/fiber`, `@react-three/drei`) requieren `--legacy-peer-deps` con React 19.

## Parámetros de población

- Tamaño (1–100)
- Edad, género, educación, **renta**, regiones
- 11 ejes de personalidad / consumo (incl. precio, marcas, tech, escepticismo)
- Estilo de reseña: positividad, verbosidad, detalle
- Prompt en lenguaje natural
- Adaptación al producto (target customers)

## API (resumen)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/phase1` | Extraer producto |
| POST | `/api/phase2` | Generar población |
| POST | `/api/phase3` | Generar reseñas |
| POST | `/api/phase4` | Análisis + market fit |
| GET/POST | `/api/populations` | Poblaciones guardadas |
| GET | `/api/events/:session_id` | SSE tiempo real |

## Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind, Framer Motion, React Three Fiber  
- **Backend:** Flask, SQLite, CrewAI, LiteLLM, Faker  
- **Realtime:** Server-Sent Events  

## Licencia / uso comercial

Diseñado como base de producto SaaS de pre-lanzamiento. Adapta branding, auth y billing según tu despliegue.
