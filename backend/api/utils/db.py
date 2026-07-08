import sqlite3
import json
import os
from urllib.parse import quote

_MOUTH_VARIANTS = "variant01,variant02,variant03,variant04,variant05,variant06,variant07,variant09,variant10,variant11,variant12,variant13,variant14,variant15,variant16,variant17,variant18"

def _dicebear_url(name: str) -> str:
    """Build a deterministic DiceBear croodles-neutral avatar URL from the bot name."""
    seed = quote(name.lower().replace(" ", ""), safe="")
    return f"https://api.dicebear.com/10.x/croodles-neutral/svg?mouthVariant={_MOUTH_VARIANTS}&seed={seed}"

# Determinar la ruta de la base de datos en la raíz del backend
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_PATH = os.path.join(BACKEND_DIR, "reviews.db")

def get_connection():
    # Usar un timeout de 30.0 segundos para evitar colisiones en escrituras concurrentes
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Habilitar claves foráneas
    cursor.execute("PRAGMA foreign_keys = ON")
    
    # Tabla para los usuarios
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Tabla para las sesiones de usuario
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Migración: Intentar añadir la columna user_id a la tabla sessions
    try:
        cursor.execute("ALTER TABLE sessions ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL")
    except sqlite3.OperationalError:
        # La columna ya existe
        pass
        
    # Migración: Intentar añadir la columna parent_session_id a la tabla sessions
    try:
        cursor.execute("ALTER TABLE sessions ADD COLUMN parent_session_id TEXT REFERENCES sessions(session_id) ON DELETE SET NULL")
    except sqlite3.OperationalError:
        # La columna ya existe
        pass
        
    # Tabla para poblaciones personalizadas guardadas
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saved_populations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        num_reviewers INTEGER NOT NULL,
        profile_parameters TEXT NOT NULL, -- Serializado como JSON
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)
    
    # Tabla para las propuestas de mejora del producto
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS product_improvements (
        session_id TEXT PRIMARY KEY,
        improvements_report TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    )
    """)
    
    # Tabla para la información del producto
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        session_id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        price TEXT,
        image TEXT,
        category TEXT,
        main_features TEXT, -- Serializado como JSON
        technical_specs TEXT, -- Serializado como JSON
        FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    )
    """)
    
    # Tabla para los perfiles de los bots (reseñadores)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reviewers (
        session_id TEXT,
        id INTEGER,
        name TEXT,
        avatar TEXT,
        bio TEXT,
        age INTEGER,
        location TEXT,
        gender TEXT,
        education_level TEXT,
        personality TEXT, -- Serializado como JSON
        backstory TEXT,
        PRIMARY KEY (session_id, id),
        FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    )
    """)
    
    # Tabla para las reseñas generadas
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reviews (
        session_id TEXT,
        id INTEGER,
        bot_id INTEGER,
        product_id INTEGER,
        rating INTEGER,
        title TEXT,
        content TEXT,
        PRIMARY KEY (session_id, id),
        FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    )
    """)
    
    # Tabla para los informes de análisis finales
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analysis (
        session_id TEXT PRIMARY KEY,
        average_rating REAL,
        rating_distribution TEXT, -- Serializado como JSON
        positive_points TEXT, -- Serializado como JSON
        negative_points TEXT, -- Serializado como JSON
        keyword_analysis TEXT, -- Serializado como JSON
        demographic_insights TEXT, -- Serializado como JSON
        FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    )
    """)
    
    # Tabla para el estado de ejecución de las fases
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS task_status (
        session_id TEXT,
        phase TEXT, -- 'phase1', 'phase2', 'phase3', 'phase4'
        status TEXT, -- 'pending', 'running', 'completed', 'failed'
        error TEXT, -- Mensaje de error si falla
        PRIMARY KEY (session_id, phase),
        FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    )
    """)

    # Tabla para poblaciones predeterminadas
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS preset_populations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT DEFAULT '👥',
        tag TEXT
    )
    """)

    # Tabla para los reseñadores de cada población predeterminada
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS preset_reviewers (
        population_id INTEGER,
        id INTEGER,
        name TEXT,
        avatar TEXT,
        bio TEXT,
        age INTEGER,
        location TEXT,
        gender TEXT,
        education_level TEXT,
        personality TEXT,
        backstory TEXT,
        PRIMARY KEY (population_id, id),
        FOREIGN KEY (population_id) REFERENCES preset_populations(id) ON DELETE CASCADE
    )
    """)
    
    conn.commit()
    conn.close()


def init_session(session_id: str, user_id: int = None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO sessions (session_id, user_id) VALUES (?, ?)
    ON CONFLICT(session_id) DO UPDATE SET user_id = COALESCE(sessions.user_id, excluded.user_id)
    """, (session_id, user_id))
    conn.commit()
    conn.close()

def init_child_session(session_id: str, parent_session_id: str, user_id: int = None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO sessions (session_id, user_id, parent_session_id) VALUES (?, ?, ?)
    ON CONFLICT(session_id) DO UPDATE SET 
        user_id = COALESCE(sessions.user_id, excluded.user_id),
        parent_session_id = COALESCE(sessions.parent_session_id, excluded.parent_session_id)
    """, (session_id, user_id, parent_session_id))
    conn.commit()
    conn.close()

def save_product(session_id: str, product: dict, user_id: int = None):
    init_session(session_id, user_id)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO products (session_id, name, description, price, image, category, main_features, technical_specs)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        session_id,
        product.get("name"),
        product.get("description"),
        product.get("price"),
        product.get("image"),
        product.get("category"),
        json.dumps(product.get("main_features", [])),
        json.dumps(product.get("technical_specs", []))
    ))
    conn.commit()
    conn.close()

def get_product(session_id: str) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE session_id = ?", (session_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {}
    return {
        "name": row["name"],
        "description": row["description"],
        "price": row["price"],
        "image": row["image"],
        "category": row["category"],
        "main_features": json.loads(row["main_features"] or "[]"),
        "technical_specs": json.loads(row["technical_specs"] or "[]")
    }

def save_reviewers(session_id: str, reviewers: list):
    init_session(session_id)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM reviewers WHERE session_id = ?", (session_id,))
    for r in reviewers:
        # Generate avatar URL deterministically — never trust the LLM for this
        avatar_url = _dicebear_url(r.get("name") or "")
        cursor.execute("""
        INSERT INTO reviewers (session_id, id, name, avatar, bio, age, location, gender, education_level, personality, backstory)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            session_id,
            r.get("id"),
            r.get("name"),
            avatar_url,
            r.get("bio"),
            r.get("age"),
            r.get("location"),
            r.get("gender"),
            r.get("education_level"),
            json.dumps(r.get("personality", {})),
            r.get("backstory")
        ))
    conn.commit()
    conn.close()

def get_reviewers(session_id: str) -> list:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reviewers WHERE session_id = ? ORDER BY id", (session_id,))
    rows = cursor.fetchall()
    conn.close()
    result = []
    for row in rows:
        name = row["name"]
        # Always regenerate the URL from the name to ensure it's correct
        avatar_url = _dicebear_url(name) if name else (row["avatar"] or "")
        result.append({
            "id": row["id"],
            "name": name,
            "avatar": avatar_url,
            "bio": row["bio"],
            "age": row["age"],
            "location": row["location"],
            "gender": row["gender"],
            "education_level": row["education_level"],
            "personality": json.loads(row["personality"] or "{}"),
            "backstory": row["backstory"]
        })
    return result

def save_reviews(session_id: str, reviews: list):
    init_session(session_id)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM reviews WHERE session_id = ?", (session_id,))
    for r in reviews:
        cursor.execute("""
        INSERT INTO reviews (session_id, id, bot_id, product_id, rating, title, content)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            session_id,
            r.get("id"),
            r.get("bot_id"),
            r.get("product_id"),
            r.get("rating"),
            r.get("title"),
            r.get("content")
        ))
    conn.commit()
    conn.close()

def get_reviews(session_id: str) -> list:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reviews WHERE session_id = ? ORDER BY id", (session_id,))
    rows = cursor.fetchall()
    conn.close()
    result = []
    for row in rows:
        result.append({
            "id": row["id"],
            "bot_id": row["bot_id"],
            "product_id": row["product_id"],
            "rating": row["rating"],
            "title": row["title"],
            "content": row["content"]
        })
    return result

def save_analysis(session_id: str, analysis: dict):
    init_session(session_id)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO analysis (session_id, average_rating, rating_distribution, positive_points, negative_points, keyword_analysis, demographic_insights)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        session_id,
        analysis.get("average_rating"),
        json.dumps(analysis.get("rating_distribution", {})),
        json.dumps(analysis.get("positive_points", [])),
        json.dumps(analysis.get("negative_points", [])),
        json.dumps(analysis.get("keyword_analysis", [])),
        json.dumps(analysis.get("demographic_insights", []))
    ))
    conn.commit()
    conn.close()

def get_analysis(session_id: str) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analysis WHERE session_id = ?", (session_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {}
    return {
        "average_rating": row["average_rating"],
        "rating_distribution": json.loads(row["rating_distribution"] or "{}"),
        "positive_points": json.loads(row["positive_points"] or "[]"),
        "negative_points": json.loads(row["negative_points"] or "[]"),
        "keyword_analysis": json.loads(row["keyword_analysis"] or "[]"),
        "demographic_insights": json.loads(row["demographic_insights"] or "[]")
    }

def set_task_status(session_id: str, phase: str, status: str, error: str = None):
    init_session(session_id)
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO task_status (session_id, phase, status, error)
    VALUES (?, ?, ?, ?)
    """, (session_id, phase, status, error))
    conn.commit()
    conn.close()

def get_task_status(session_id: str, phase: str) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM task_status WHERE session_id = ? AND phase = ?", (session_id, phase))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"status": "idle", "error": None}
    return {"status": row["status"], "error": row["error"]}


def delete_session(session_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    # Borrar explícitamente en orden de dependencia para máxima robustez
    cursor.execute("DELETE FROM products WHERE session_id = ?", (session_id,))
    cursor.execute("DELETE FROM reviewers WHERE session_id = ?", (session_id,))
    cursor.execute("DELETE FROM reviews WHERE session_id = ?", (session_id,))
    cursor.execute("DELETE FROM analysis WHERE session_id = ?", (session_id,))
    cursor.execute("DELETE FROM task_status WHERE session_id = ?", (session_id,))
    cursor.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
    conn.commit()
    conn.close()

def get_recent_sessions(user_id=None) -> list:
    conn = get_connection()
    cursor = conn.cursor()
    if user_id is not None:
        cursor.execute("""
        SELECT s.session_id, s.created_at, s.parent_session_id, p.name as product_name, p.image as product_image, a.average_rating,
               (SELECT name FROM products WHERE session_id = s.parent_session_id) as parent_product_name
        FROM sessions s
        JOIN products p ON s.session_id = p.session_id
        LEFT JOIN analysis a ON s.session_id = a.session_id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
        """, (user_id,))
    else:
        cursor.execute("""
        SELECT s.session_id, s.created_at, s.parent_session_id, p.name as product_name, p.image as product_image, a.average_rating,
               (SELECT name FROM products WHERE session_id = s.parent_session_id) as parent_product_name
        FROM sessions s
        JOIN products p ON s.session_id = p.session_id
        LEFT JOIN analysis a ON s.session_id = a.session_id
        ORDER BY s.created_at DESC
        """)
    rows = cursor.fetchall()
    conn.close()
    result = []
    for row in rows:
        result.append({
            "session_id": row["session_id"],
            "created_at": row["created_at"],
            "parent_session_id": row["parent_session_id"],
            "parent_product_name": row["parent_product_name"],
            "product_name": row["product_name"],
            "product_image": row["product_image"],
            "average_rating": row["average_rating"]
        })
    return result

# ─── Preset Populations ────────────────────────────────────────────────────────

def get_preset_populations() -> list:
    """Return all preset population metadata (without reviewers)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, description, icon, tag FROM preset_populations ORDER BY id")
    rows = cursor.fetchall()
    conn.close()
    return [
        {"id": row["id"], "name": row["name"], "description": row["description"],
         "icon": row["icon"], "tag": row["tag"]}
        for row in rows
    ]

def get_preset_reviewers(population_id: int) -> list:
    """Return all reviewers for a given preset population."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM preset_reviewers WHERE population_id = ? ORDER BY id",
        (population_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    result = []
    for row in rows:
        name = row["name"]
        result.append({
            "id": row["id"],
            "name": name,
            "avatar": _dicebear_url(name) if name else "",
            "bio": row["bio"],
            "age": row["age"],
            "location": row["location"],
            "gender": row["gender"],
            "education_level": row["education_level"],
            "personality": json.loads(row["personality"] or "{}"),
            "backstory": row["backstory"],
        })
    return result

def load_preset_into_session(population_id: int, session_id: str):
    """Copy a preset population's reviewers into a session's reviewers table."""
    reviewers = get_preset_reviewers(population_id)
    save_reviewers(session_id, reviewers)
    return reviewers

def presets_exist() -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as c FROM preset_populations")
    row = cursor.fetchone()
    conn.close()
    return row["c"] > 0

def seed_preset_populations():
    """Insert the 3 built-in preset populations if they don't exist yet."""
    if presets_exist():
        return

    populations = [
        {
            "name": "Millennials Digitales",
            "description": "Jóvenes de 25-38 años, nativos digitales, activos en redes, ecológicamente conscientes y exigentes con la relación calidad-precio.",
            "icon": "📱",
            "tag": "Tecnología · Sostenibilidad",
            "reviewers": [
                {"id": 1, "name": "Lucía Fernández Ruiz", "bio": "Diseñadora UX en una startup de Madrid. Compra online casi todo y comparte sus opiniones en Instagram.", "age": 28, "location": "Madrid", "gender": "Female", "education_level": "University", "personality": {"introvert_extrovert": 70, "analytical_creative": 75, "busy_free_time": 60, "disorganized_organized": 65, "independent_cooperative": 55, "environmentalist": 80, "safe_risky": 55}, "backstory": "Creció con internet, estudió diseño en Barcelona y se mudó a Madrid para trabajar en una startup de movilidad sostenible. Muy crítica con productos que no cumplen sus expectativas estéticas."},
                {"id": 2, "name": "Alejandro Martínez García", "bio": "Programador freelance, amante del gaming y los gadgets. Siempre busca las mejores ofertas en Amazon.", "age": 31, "location": "Valencia", "gender": "Male", "education_level": "University", "personality": {"introvert_extrovert": 35, "analytical_creative": 55, "busy_free_time": 45, "disorganized_organized": 72, "independent_cooperative": 40, "environmentalist": 45, "safe_risky": 60}, "backstory": "Trabaja en remoto desde Valencia, lo que le da flexibilidad para comprar y comparar productos exhaustivamente antes de adquirirlos. Tiene un canal de YouTube de reviews de tecnología."},
                {"id": 3, "name": "Sara Gómez López", "bio": "Enfermera a tiempo parcial y mamá reciente. Busca eficiencia y practicidad en todo lo que compra.", "age": 33, "location": "Sevilla", "gender": "Female", "education_level": "University", "personality": {"introvert_extrovert": 50, "analytical_creative": 40, "busy_free_time": 75, "disorganized_organized": 60, "independent_cooperative": 65, "environmentalist": 60, "safe_risky": 30}, "backstory": "Tras ser madre, su tiempo libre es muy limitado. Prefiere marcas de confianza y lee reseñas durante las pocas horas que tiene libres. Valora mucho la durabilidad y el servicio posventa."},
                {"id": 4, "name": "Carlos Jiménez Moreno", "bio": "Influencer de lifestyle en Instagram con 45k seguidores. Recibe productos de marcas pero también compra por su cuenta.", "age": 26, "location": "Barcelona", "gender": "Male", "education_level": "Vocational", "personality": {"introvert_extrovert": 90, "analytical_creative": 80, "busy_free_time": 55, "disorganized_organized": 40, "independent_cooperative": 70, "environmentalist": 55, "safe_risky": 75}, "backstory": "Dejó sus estudios de comunicación para dedicarse a las redes sociales. Tiene buen ojo para la estética y conecta fácilmente con tendencias. Sus seguidores confían en sus recomendaciones."},
                {"id": 5, "name": "Paula Sánchez Torres", "bio": "Economista en un banco. Analiza todo con números antes de tomar una decisión de compra.", "age": 29, "location": "Bilbao", "gender": "Female", "education_level": "Postgraduate", "personality": {"introvert_extrovert": 45, "analytical_creative": 30, "busy_free_time": 50, "disorganized_organized": 90, "independent_cooperative": 50, "environmentalist": 50, "safe_risky": 25}, "backstory": "Formada en economía en Deusto, trabaja en el área de riesgos de un banco. Aplica el mismo análisis que usa en su trabajo a sus compras: compara precios, lee especificaciones técnicas y busca el mejor ROI."},
                {"id": 6, "name": "Iván Rodríguez Castro", "bio": "Chef en un restaurante de fusión. Apasionado de la cocina y los productos de calidad.", "age": 35, "location": "San Sebastián", "gender": "Male", "education_level": "Vocational", "personality": {"introvert_extrovert": 60, "analytical_creative": 85, "busy_free_time": 30, "disorganized_organized": 55, "independent_cooperative": 60, "environmentalist": 70, "safe_risky": 65}, "backstory": "Formado en la escuela de cocina de San Sebastián y con experiencia en restaurantes de varios países. Exige excelencia en los productos que usa en su cocina y no escatima en calidad."},
                {"id": 7, "name": "María Pérez Blanco", "bio": "Estudiante de doctorado en física. Muy racional y metódica a la hora de evaluar productos.", "age": 27, "location": "Granada", "gender": "Female", "education_level": "Postgraduate", "personality": {"introvert_extrovert": 25, "analytical_creative": 45, "busy_free_time": 40, "disorganized_organized": 85, "independent_cooperative": 35, "environmentalist": 65, "safe_risky": 20}, "backstory": "Investigadora en la Universidad de Granada, su mentalidad científica se traslada a sus hábitos de consumo. Desconfía del marketing y busca siempre evidencias empíricas de la calidad de un producto."},
                {"id": 8, "name": "Diego López Herrera", "bio": "Emprendedor que lanzó su propia marca de ropa sostenible. Muy concienciado con el impacto ambiental.", "age": 32, "location": "Málaga", "gender": "Male", "education_level": "University", "personality": {"introvert_extrovert": 65, "analytical_creative": 70, "busy_free_time": 35, "disorganized_organized": 60, "independent_cooperative": 75, "environmentalist": 95, "safe_risky": 70}, "backstory": "Tras varios años en consultoría, decidió fundar su propia empresa de moda sostenible en Málaga. Es un defensor del comercio justo y critica duramente a las marcas que no tienen prácticas éticas."},
                {"id": 9, "name": "Ana Ruiz Navarro", "bio": "Profesora de inglés y viajera empedernida. Compra con criterio y valora mucho la durabilidad.", "age": 30, "location": "Zaragoza", "gender": "Female", "education_level": "University", "personality": {"introvert_extrovert": 55, "analytical_creative": 60, "busy_free_time": 60, "disorganized_organized": 50, "independent_cooperative": 55, "environmentalist": 55, "safe_risky": 50}, "backstory": "Da clases de inglés en un instituto y aprovecha los veranos para viajar. Antes de cada viaje, investiga exhaustivamente los productos que lleva, priorizando ligereza y durabilidad."},
                {"id": 10, "name": "Jorge Vargas Molina", "bio": "Youtuber de tecnología con canal de comparativas. Muy crítico con los productos sobrevalorados.", "age": 34, "location": "Murcia", "gender": "Male", "education_level": "University", "personality": {"introvert_extrovert": 55, "analytical_creative": 65, "busy_free_time": 50, "disorganized_organized": 60, "independent_cooperative": 45, "environmentalist": 40, "safe_risky": 55}, "backstory": "Lleva 6 años haciendo reviews en YouTube, acumulando más de 200k suscriptores. Tiene fama de ser objetivo y no dejarse comprar por marcas. Sus seguidores valoran su honestidad."},
            ]
        },
        {
            "name": "Familias Activas",
            "description": "Padres y madres de 32-50 años, compradores prácticos y orientados al valor. Priorizan la funcionalidad, la seguridad y el precio razonable.",
            "icon": "👨‍👩‍👧‍👦",
            "tag": "Familia · Practicidad",
            "reviewers": [
                {"id": 1, "name": "Rosa María Campos Verde", "bio": "Ama de casa y madre de tres hijos. Gestiona el presupuesto familiar con mano firme.", "age": 44, "location": "Toledo", "gender": "Female", "education_level": "High School", "personality": {"introvert_extrovert": 60, "analytical_creative": 35, "busy_free_time": 80, "disorganized_organized": 70, "independent_cooperative": 75, "environmentalist": 50, "safe_risky": 20}, "backstory": "Dejó su trabajo en administración al nacer su segundo hijo. Ahora gestiona el hogar y la economía familiar con eficiencia. Investiga bien antes de comprar y prioriza marcas de confianza."},
                {"id": 2, "name": "Manuel Ortega Serrano", "bio": "Mecánico y padre de dos. Práctico, directo y fiel a las marcas que no le han fallado.", "age": 42, "location": "Córdoba", "gender": "Male", "education_level": "Vocational", "personality": {"introvert_extrovert": 50, "analytical_creative": 30, "busy_free_time": 55, "disorganized_organized": 65, "independent_cooperative": 60, "environmentalist": 35, "safe_risky": 40}, "backstory": "Lleva 20 años trabajando en su propio taller. Valora la fiabilidad por encima de todo. Desconfía de los productos con demasiado marketing y poca sustancia."},
                {"id": 3, "name": "Elena Ramos Castillo", "bio": "Administrativa en un hospital y madre primeriza. Busca productos seguros y de calidad para su familia.", "age": 36, "location": "Valladolid", "gender": "Female", "education_level": "University", "personality": {"introvert_extrovert": 45, "analytical_creative": 45, "busy_free_time": 70, "disorganized_organized": 75, "independent_cooperative": 65, "environmentalist": 60, "safe_risky": 25}, "backstory": "Su experiencia laboral en el entorno sanitario la ha hecho muy consciente de la importancia de la calidad y la seguridad. Investiga marcas, lee estudios y consulta a otros padres antes de comprar."},
                {"id": 4, "name": "Tomás Guerrero Álvarez", "bio": "Conductor de autobús y aficionado al bricolaje. Muy práctico, busca relación calidad-precio.", "age": 48, "location": "Cáceres", "gender": "Male", "education_level": "Vocational", "personality": {"introvert_extrovert": 55, "analytical_creative": 40, "busy_free_time": 60, "disorganized_organized": 55, "independent_cooperative": 65, "environmentalist": 40, "safe_risky": 45}, "backstory": "Trabaja en transporte público y dedica sus fines de semana al bricolaje. Busca herramientas y productos duraderos, preferentemente de fabricación española o europea."},
                {"id": 5, "name": "Pilar Morales Fuentes", "bio": "Trabajadora social y voluntaria. Consciente del gasto y del impacto de sus decisiones de compra.", "age": 39, "location": "Pamplona", "gender": "Female", "education_level": "University", "personality": {"introvert_extrovert": 65, "analytical_creative": 55, "busy_free_time": 65, "disorganized_organized": 60, "independent_cooperative": 85, "environmentalist": 75, "safe_risky": 30}, "backstory": "Su trabajo le ha dado perspectiva sobre el consumo responsable. Prefiere comprar menos pero mejor, y está dispuesta a gastar más si el producto tiene un impacto social positivo."},
                {"id": 6, "name": "Óscar Jiménez Prado", "bio": "Profesor de secundaria y padre de dos adolescentes. Meticuloso y buen negociador.", "age": 47, "location": "Logroño", "gender": "Male", "education_level": "Postgraduate", "personality": {"introvert_extrovert": 40, "analytical_creative": 50, "busy_free_time": 50, "disorganized_organized": 80, "independent_cooperative": 55, "environmentalist": 55, "safe_risky": 30}, "backstory": "Lleva 20 años en la docencia. Aplica su capacidad analítica a sus compras: compara precios, lee múltiples reseñas y espera a las rebajas. Sus hijos le llaman exagerado, pero nunca se arrepiente."},
                {"id": 7, "name": "Carmen González Vidal", "bio": "Fisioterapeuta y madre de una niña de 5 años. Exige calidad y seguridad ante todo.", "age": 38, "location": "Salamanca", "gender": "Female", "education_level": "University", "personality": {"introvert_extrovert": 50, "analytical_creative": 45, "busy_free_time": 65, "disorganized_organized": 70, "independent_cooperative": 60, "environmentalist": 65, "safe_risky": 20}, "backstory": "Su formación sanitaria la hace especialmente sensible a la calidad y seguridad de los productos. Investiga los materiales, busca certificaciones y lee detenidamente las opiniones de otros padres."},
                {"id": 8, "name": "Fernando Blanco Iglesias", "bio": "Arquitecto técnico. Analiza cada compra con el mismo rigor que un proyecto de obra.", "age": 45, "location": "Santander", "gender": "Male", "education_level": "University", "personality": {"introvert_extrovert": 35, "analytical_creative": 60, "busy_free_time": 45, "disorganized_organized": 85, "independent_cooperative": 50, "environmentalist": 50, "safe_risky": 35}, "backstory": "Trabaja en una empresa constructora y gestiona proyectos complejos. Esa misma exigencia la aplica en su vida personal: evalúa pros y contras, pide presupuestos alternativos y no se deja llevar por impulsos."},
                {"id": 9, "name": "Natalia Cruz Herrero", "bio": "Auxiliar de farmacia y madre de mellizos. Organizada y muy informada sobre lo que compra.", "age": 40, "location": "Badajoz", "gender": "Female", "education_level": "Vocational", "personality": {"introvert_extrovert": 55, "analytical_creative": 40, "busy_free_time": 75, "disorganized_organized": 75, "independent_cooperative": 70, "environmentalist": 55, "safe_risky": 25}, "backstory": "La crianza de mellizos la obligó a ser ultraorganizada. Compra con lista, compara precios semana a semana y es fiel a aquellas marcas que le han dado buenos resultados con sus hijos."},
                {"id": 10, "name": "Sergio Cano Lozano", "bio": "Comercial y padre activo. Sociable y con criterio cuando se trata de gastar el dinero familiar.", "age": 43, "location": "Alicante", "gender": "Male", "education_level": "University", "personality": {"introvert_extrovert": 80, "analytical_creative": 45, "busy_free_time": 55, "disorganized_organized": 55, "independent_cooperative": 70, "environmentalist": 45, "safe_risky": 50}, "backstory": "Viaja constantemente por trabajo y aprovecha esos momentos para comparar productos en diferentes mercados. Su red de contactos le ayuda a obtener recomendaciones de primera mano."},
            ]
        },
        {
            "name": "Séniors Activos",
            "description": "Personas de 58-75 años con poder adquisitivo medio-alto. Valoran la calidad, la marca de confianza y el servicio posventa por encima del precio.",
            "icon": "🧓",
            "tag": "Experiencia · Calidad",
            "reviewers": [
                {"id": 1, "name": "Amparo Delgado Nieto", "bio": "Jubilada funcionaria. Leal a las marcas que conoce y muy exigente con el servicio al cliente.", "age": 65, "location": "Zaragoza", "gender": "Female", "education_level": "High School", "personality": {"introvert_extrovert": 50, "analytical_creative": 30, "busy_free_time": 35, "disorganized_organized": 80, "independent_cooperative": 50, "environmentalist": 45, "safe_risky": 15}, "backstory": "Trabajó 35 años en la administración pública. Ahora disfruta del tiempo con sus nietos y mantiene rutinas estrictas. Desconfía de productos nuevos sin trayectoria probada y valora mucho la atención personalizada."},
                {"id": 2, "name": "Rafael Herrero Domínguez", "bio": "Exingeniero industrial. Analiza los productos con criterio técnico y no le importa pagar más por calidad.", "age": 68, "location": "Bilbao", "gender": "Male", "education_level": "University", "personality": {"introvert_extrovert": 40, "analytical_creative": 55, "busy_free_time": 40, "disorganized_organized": 85, "independent_cooperative": 45, "environmentalist": 50, "safe_risky": 30}, "backstory": "Tras 30 años en la industria, se jubiló con una pensión desahogada. Lee las especificaciones técnicas antes que las reseñas. Cree firmemente que lo barato sale caro y prefiere invertir bien."},
                {"id": 3, "name": "Consuelo Vega Alonso", "bio": "Ama de casa con mucha experiencia comprando para una familia numerosa. Pragmática y directa.", "age": 62, "location": "Ciudad Real", "gender": "Female", "education_level": "Primary", "personality": {"introvert_extrovert": 65, "analytical_creative": 25, "busy_free_time": 50, "disorganized_organized": 65, "independent_cooperative": 60, "environmentalist": 40, "safe_risky": 20}, "backstory": "Madre de cinco hijos, lleva décadas gestionando una casa grande con presupuesto ajustado. Ahora que los hijos se han independizado, se permite pequeños caprichos, pero sigue siendo muy práctica."},
                {"id": 4, "name": "Emilio Roca Peña", "bio": "Médico jubilado. Rigoroso, paciente y muy bien informado sobre lo que adquiere.", "age": 70, "location": "Murcia", "gender": "Male", "education_level": "Postgraduate", "personality": {"introvert_extrovert": 35, "analytical_creative": 40, "busy_free_time": 35, "disorganized_organized": 90, "independent_cooperative": 45, "environmentalist": 55, "safe_risky": 15}, "backstory": "Ejerció como médico de familia durante 38 años. Su hábito de documentarse le sigue acompañando en la jubilación. Lee prospectos completos, busca estudios comparativos y pide opinión a especialistas."},
                {"id": 5, "name": "Josefa Mora Cantero", "bio": "Comerciante retirada. Muy activa socialmente y con criterio propio formado a lo largo de años.", "age": 67, "location": "Almería", "gender": "Female", "education_level": "High School", "personality": {"introvert_extrovert": 80, "analytical_creative": 40, "busy_free_time": 40, "disorganized_organized": 60, "independent_cooperative": 70, "environmentalist": 45, "safe_risky": 35}, "backstory": "Regentó durante 25 años una ferretería familiar. Conoce bien los márgenes comerciales y detecta rápidamente cuando un producto está sobrevalorado. Tiene una red amplia de contactos y comparte sus opiniones libremente."},
                {"id": 6, "name": "Gregorio Santos Mazo", "bio": "Militar retirado. Muy ordenado, disciplinado y con claros criterios de selección para cualquier compra.", "age": 72, "location": "León", "gender": "Male", "education_level": "Military/University", "personality": {"introvert_extrovert": 45, "analytical_creative": 30, "busy_free_time": 45, "disorganized_organized": 95, "independent_cooperative": 50, "environmentalist": 40, "safe_risky": 20}, "backstory": "Sirvió en el ejército durante 30 años y trasladó su disciplina a la vida civil. Hace listas exhaustivas antes de comprar, compara sistemáticamente y raramente se sale del presupuesto previsto."},
                {"id": 7, "name": "Encarna Molina Rubio", "bio": "Profesora retirada de matemáticas. Metódica, paciente y con alto nivel de exigencia.", "age": 64, "location": "Cádiz", "gender": "Female", "education_level": "University", "personality": {"introvert_extrovert": 40, "analytical_creative": 50, "busy_free_time": 40, "disorganized_organized": 88, "independent_cooperative": 48, "environmentalist": 58, "safe_risky": 18}, "backstory": "Enseñó matemáticas en un instituto durante 32 años. La lógica y el rigor son parte de su ADN. Cuando analiza un producto, lo hace con la misma meticulosidad que corregía exámenes."},
                {"id": 8, "name": "Bernardino Crespo Gil", "bio": "Agricultor retirado. Conoce el valor del esfuerzo y no tolera productos de baja calidad.", "age": 74, "location": "Extremadura", "gender": "Male", "education_level": "Primary", "personality": {"introvert_extrovert": 45, "analytical_creative": 25, "busy_free_time": 50, "disorganized_organized": 60, "independent_cooperative": 55, "environmentalist": 65, "safe_risky": 25}, "backstory": "Trabajó toda su vida en el campo. Aprecia los productos hechos para durar y se irrita con la obsolescencia programada. Desconfía de las marcas grandes y prefiere lo artesanal o local siempre que puede."},
                {"id": 9, "name": "Remedios Aguilar Ríos", "bio": "Enfermera jubilada. Muy consciente de la salud y de los materiales con los que están hechos los productos.", "age": 63, "location": "Málaga", "gender": "Female", "education_level": "University", "personality": {"introvert_extrovert": 60, "analytical_creative": 38, "busy_free_time": 42, "disorganized_organized": 75, "independent_cooperative": 65, "environmentalist": 70, "safe_risky": 22}, "backstory": "Pasó su vida laboral cuidando a otros. Ahora cuida de sí misma con el mismo esmero: lee etiquetas, busca materiales sin tóxicos y prefiere lo natural a lo artificial. Puede llegar a ser muy crítica con el marketing engañoso."},
                {"id": 10, "name": "Valentín Prieto Sáez", "bio": "Notario retirado. Preciso, detallista y con alta exigencia en la claridad de la información del producto.", "age": 69, "location": "Burgos", "gender": "Male", "education_level": "Postgraduate", "personality": {"introvert_extrovert": 38, "analytical_creative": 42, "busy_free_time": 45, "disorganized_organized": 92, "independent_cooperative": 48, "environmentalist": 48, "safe_risky": 12}, "backstory": "Ejerció como notario durante 35 años. Sus reseñas son detalladas, precisas y sin ambigüedades. Considera que la publicidad exagerada es una forma de engaño y lo dice sin rodeos en sus valoraciones."},
            ]
        }
    ]

    conn = get_connection()
    cursor = conn.cursor()
    try:
        for pop in populations:
            cursor.execute(
                "INSERT INTO preset_populations (name, description, icon, tag) VALUES (?, ?, ?, ?)",
                (pop["name"], pop["description"], pop["icon"], pop["tag"])
            )
            pop_id = cursor.lastrowid
            for r in pop["reviewers"]:
                cursor.execute("""
                INSERT INTO preset_reviewers
                    (population_id, id, name, avatar, bio, age, location, gender, education_level, personality, backstory)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    pop_id,
                    r["id"],
                    r["name"],
                    "",  # avatar built on read
                    r["bio"],
                    r["age"],
                    r["location"],
                    r["gender"],
                    r["education_level"],
                    json.dumps(r["personality"]),
                    r["backstory"],
                ))
        conn.commit()
        print("✅ Poblaciones predeterminadas creadas correctamente.")
    except Exception as e:
        conn.rollback()
        print(f"❌ Error al crear poblaciones predeterminadas: {e}")
    finally:
        conn.close()

# ─── User Authentication Helpers ───────────────────────────────────────────────

def create_user(username, password_hash) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, password_hash))
        user_id = cursor.lastrowid
        conn.commit()
        return user_id
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def get_user_by_username(username) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row["id"],
        "username": row["username"],
        "password_hash": row["password_hash"]
    }

def get_user_by_id(user_id) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row["id"],
        "username": row["username"]
    }

# ─── Saved Populations Helpers ─────────────────────────────────────────────────

def save_population(user_id: int, name: str, description: str, num_reviewers: int, profile_parameters: dict) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO saved_populations (user_id, name, description, num_reviewers, profile_parameters)
    VALUES (?, ?, ?, ?, ?)
    """, (user_id, name, description, num_reviewers, json.dumps(profile_parameters)))
    pop_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return pop_id

def get_saved_populations(user_id: int) -> list:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM saved_populations WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    result = []
    for row in rows:
        result.append({
            "id": row["id"],
            "user_id": row["user_id"],
            "name": row["name"],
            "description": row["description"],
            "num_reviewers": row["num_reviewers"],
            "profile_parameters": json.loads(row["profile_parameters"] or "{}"),
            "created_at": row["created_at"]
        })
    return result

def delete_saved_population(pop_id: int, user_id: int) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM saved_populations WHERE id = ? AND user_id = ?", (pop_id, user_id))
    changes = conn.total_changes
    conn.commit()
    conn.close()
    return changes > 0

# ─── Product Improvements Helpers ──────────────────────────────────────────────

def save_improvements(session_id: str, improvements_report: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO product_improvements (session_id, improvements_report)
    VALUES (?, ?)
    """, (session_id, improvements_report))
    conn.commit()
    conn.close()

def get_improvements(session_id: str) -> str:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT improvements_report FROM product_improvements WHERE session_id = ?", (session_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return row["improvements_report"]
