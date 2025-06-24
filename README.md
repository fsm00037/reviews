# Sistema de Análisis de Productos

Sistema completo para la simulación y análisis de reseñas de productos utilizando CrewAI y Next.js.

## Estructura del Proyecto

```
reviews/
├── backend/          # API Flask con CrewAI
└── frontend/         # Aplicación Next.js con TypeScript
```

## Despliegue del Backend

### Requisitos Previos
- Python 3.8+
- pip (gestor de paquetes de Python)
- Claves API necesarias (OpenAI, etc.)

### Instalación

1. **Navegar al directorio del backend:**
   ```bash
   cd backend
   ```

2. **Crear un entorno virtual (recomendado):**
   ```bash
   python -m venv venv
   
   # En Windows
   venv\Scripts\activate
   
   # En macOS/Linux
   source venv/bin/activate
   ```

3. **Instalar dependencias:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar variables de entorno:**
   Crear un archivo `.env` en el directorio `backend/` con:
   ```env
   GEMINI_API_KEY=tu_clave_gemini
   # Agregar otras claves API según sea necesario
   ```

### Ejecución

**Ejecutar el servidor de desarrollo:**
```bash
cd backend/api
python run.py
```

El servidor se ejecutará en `http://localhost:5000`


## Despliegue del Frontend

### Requisitos Previos
- Node.js 18+
- npm o yarn

### Instalación

1. **Navegar al directorio del frontend:**
   ```bash
   cd frontend/product-review-simulator
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   # o
   yarn install
   ```
### Ejecución

**Modo desarrollo:**
```bash
npm run dev
# o
yarn dev
```



La aplicación se ejecutará en `http://localhost:3000`

---

