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
    
    # Tabla para las sesiones de usuario
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    
    conn.commit()
    conn.close()

def init_session(session_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO sessions (session_id) VALUES (?)", (session_id,))
    conn.commit()
    conn.close()

def save_product(session_id: str, product: dict):
    init_session(session_id)
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

def init_session(session_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO sessions (session_id) VALUES (?)", (session_id,))
    conn.commit()
    conn.close()

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

def get_recent_sessions() -> list:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT s.session_id, s.created_at, p.name as product_name, p.image as product_image, a.average_rating
    FROM sessions s
    JOIN products p ON s.session_id = p.session_id
    LEFT JOIN analysis a ON s.session_id = a.session_id
    ORDER BY s.created_at DESC
    LIMIT 10
    """)
    rows = cursor.fetchall()
    conn.close()
    result = []
    for row in rows:
        result.append({
            "session_id": row["session_id"],
            "created_at": row["created_at"],
            "product_name": row["product_name"],
            "product_image": row["product_image"],
            "average_rating": row["average_rating"]
        })
    return result
