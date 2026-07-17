"""
Utilidades de realismo comercial para perfiles, apariencia 3D y estilo de reseña.
Genera atributos deterministas/paramétricos sin depender del LLM.
"""
from __future__ import annotations

import hashlib
import random
from typing import Any, Dict, List, Optional, Tuple


SKIN_TONES = ["fair", "light", "medium", "olive", "tan", "brown", "dark"]
HAIR_COLORS = [
    "black", "dark_brown", "brown", "light_brown", "auburn", "red", "ginger",
    "blonde", "platinum", "gray", "white", "blue", "teal", "pink", "purple",
    "green", "orange", "silver",
]
HAIR_STYLES = [
    "short", "medium", "long", "bald", "curly", "ponytail", "bun",
    "bob", "spiky", "fringe", "side_part", "mohawk", "afro", "twin_tails",
]
BODY_TYPES = ["slim", "average", "athletic", "heavy"]
CLOTHING = ["casual", "formal", "sporty", "streetwear", "bohemian", "techwear"]

SKIN_HEX = {
    "fair": "#f5d0b0",
    "light": "#e8b98a",
    "medium": "#c68642",
    "olive": "#a67c52",
    "tan": "#8d5524",
    "brown": "#6b3f24",
    "dark": "#3b2213",
}

HAIR_HEX = {
    "black": "#1a1a1a",
    "dark_brown": "#2c1810",
    "brown": "#5c3a21",
    "light_brown": "#8b5a2b",
    "auburn": "#922b21",
    "red": "#c0392b",
    "ginger": "#e07a3d",
    "blonde": "#e0c068",
    "platinum": "#f0e6c8",
    "gray": "#9aa0a8",
    "white": "#f0eeea",
    "blue": "#3b82f6",
    "teal": "#14b8a6",
    "pink": "#ec4899",
    "purple": "#a855f7",
    "green": "#22c55e",
    "orange": "#f97316",
    "silver": "#c0c7d1",
}

CLOTHING_PALETTES = {
    "casual": [
        ("#3b82f6", "#93c5fd"), ("#10b981", "#6ee7b7"), ("#f59e0b", "#fcd34d"),
        ("#ef4444", "#fecaca"), ("#8b5cf6", "#ddd6fe"), ("#ec4899", "#fbcfe8"),
        ("#0ea5e9", "#bae6fd"), ("#84cc16", "#d9f99d"), ("#f97316", "#fed7aa"),
        ("#14b8a6", "#99f6e4"), ("#6366f1", "#c7d2fe"), ("#f43f5e", "#fecdd3"),
    ],
    "formal": [
        ("#1e293b", "#64748b"), ("#0f172a", "#334155"), ("#374151", "#9ca3af"),
        ("#1e3a8a", "#93c5fd"), ("#4c1d95", "#c4b5fd"), ("#14532d", "#86efac"),
    ],
    "sporty": [
        ("#ef4444", "#fca5a5"), ("#22c55e", "#86efac"), ("#0ea5e9", "#7dd3fc"),
        ("#eab308", "#fde047"), ("#a855f7", "#d8b4fe"), ("#f97316", "#fdba74"),
    ],
    "streetwear": [
        ("#a855f7", "#d8b4fe"), ("#111827", "#6b7280"), ("#f97316", "#fdba74"),
        ("#ec4899", "#f9a8d4"), ("#06b6d4", "#67e8f9"), ("#e11d48", "#fb7185"),
    ],
    "bohemian": [
        ("#d97706", "#fbbf24"), ("#b45309", "#fde68a"), ("#7c3aed", "#c4b5fd"),
        ("#be185d", "#fbcfe8"), ("#a16207", "#fef08a"), ("#9f1239", "#fda4af"),
    ],
    "techwear": [
        ("#111827", "#4b5563"), ("#0f172a", "#38bdf8"), ("#1f2937", "#22d3ee"),
        ("#020617", "#818cf8"), ("#18181b", "#2dd4bf"),
    ],
}


def _rng(seed: str) -> random.Random:
    h = hashlib.md5(seed.encode("utf-8")).hexdigest()
    return random.Random(int(h[:16], 16))


def _sample_range(rng: random.Random, pair: Any, default: Tuple[int, int] = (0, 100)) -> int:
    if isinstance(pair, (list, tuple)) and len(pair) >= 2:
        lo, hi = int(pair[0]), int(pair[1])
        if lo > hi:
            lo, hi = hi, lo
        return rng.randint(lo, hi)
    if isinstance(pair, (int, float)):
        return int(pair)
    return rng.randint(default[0], default[1])


def sample_personality(profile_parameters: Dict[str, Any], seed: str) -> Dict[str, int]:
    rng = _rng(seed + "-personality")
    personality_cfg = profile_parameters.get("personality") or {}
    keys = [
        "introvert_extrovert",
        "analytical_creative",
        "busy_free_time",
        "disorganized_organized",
        "independent_cooperative",
        "environmentalist",
        "safe_risky",
        "price_sensitive_premium",
        "brand_loyal_explorer",
        "tech_novice_expert",
        "skeptic_enthusiast",
    ]
    result = {}
    for key in keys:
        result[key] = _sample_range(rng, personality_cfg.get(key), (20, 80) if key not in personality_cfg else (0, 100))
    return result


def sample_review_style(profile_parameters: Dict[str, Any], seed: str, personality: Dict[str, int]) -> Dict[str, int]:
    rng = _rng(seed + "-review-style")
    positivity = _sample_range(rng, profile_parameters.get("positivity_bias"), (40, 75))
    verbosity = _sample_range(rng, profile_parameters.get("verbosity"), (35, 70))
    detail = _sample_range(rng, profile_parameters.get("detail_level"), (40, 80))

    # Correlate with personality slightly
    formality = max(0, min(100, personality.get("analytical_creative", 50) // 2 + personality.get("disorganized_organized", 50) // 2 + rng.randint(-15, 15)))
    emoji = max(0, min(100, (100 - formality) // 2 + personality.get("introvert_extrovert", 50) // 4 + rng.randint(-10, 20)))
    typo = max(0, min(100, (100 - formality) // 3 + rng.randint(0, 25)))
    complaint = max(0, min(100, 100 - positivity // 2 + (100 - personality.get("skeptic_enthusiast", 50)) // 3 + rng.randint(-10, 10)))

    return {
        "positivity": positivity,
        "verbosity": verbosity,
        "detail_level": detail,
        "formality": formality,
        "emoji_usage": emoji,
        "typo_tendency": typo,
        "complaint_focus": complaint,
    }


def build_appearance(
    name: str,
    gender: str,
    age: int,
    personality: Dict[str, int],
    seed: Optional[str] = None,
) -> Dict[str, Any]:
    rng = _rng(seed or name)

    # Height by gender + noise
    if gender == "Male":
        height = round(rng.uniform(1.65, 1.92), 2)
    elif gender == "Female":
        height = round(rng.uniform(1.52, 1.78), 2)
    else:
        height = round(rng.uniform(1.55, 1.85), 2)

    # Body type biased by lifestyle
    busy = personality.get("busy_free_time", 50)
    if busy < 30:
        body_weights = [0.15, 0.35, 0.40, 0.10]  # more athletic if "busy" means active lifestyle loosely
    elif busy > 70:
        body_weights = [0.25, 0.45, 0.15, 0.15]
    else:
        body_weights = [0.22, 0.45, 0.20, 0.13]
    body_type = rng.choices(BODY_TYPES, weights=body_weights, k=1)[0]

    skin = rng.choice(SKIN_TONES)

    if age >= 55:
        hair_color = rng.choices(
            ["gray", "white", "silver", "light_brown", "brown", "black"],
            weights=[0.3, 0.15, 0.2, 0.15, 0.12, 0.08],
            k=1,
        )[0]
    else:
        hair_color = rng.choices(
            [
                "black", "dark_brown", "brown", "light_brown", "blonde", "platinum",
                "red", "ginger", "auburn", "blue", "pink", "purple", "teal", "green", "orange", "gray",
            ],
            weights=[
                0.14, 0.12, 0.14, 0.08, 0.1, 0.04,
                0.05, 0.04, 0.04, 0.05, 0.05, 0.04, 0.03, 0.03, 0.03, 0.02,
            ],
            k=1,
        )[0]

    if gender == "Male":
        hair_style = rng.choices(
            ["short", "medium", "bald", "curly", "spiky", "side_part", "fringe", "mohawk", "afro"],
            weights=[0.22, 0.15, 0.1, 0.12, 0.12, 0.1, 0.08, 0.06, 0.05],
            k=1,
        )[0]
    elif gender == "Female":
        hair_style = rng.choices(
            ["medium", "long", "curly", "ponytail", "bun", "bob", "twin_tails", "fringe", "afro", "side_part"],
            weights=[0.14, 0.16, 0.12, 0.12, 0.1, 0.1, 0.08, 0.08, 0.05, 0.05],
            k=1,
        )[0]
    else:
        hair_style = rng.choice(HAIR_STYLES)

    # Clothing from personality
    creative = personality.get("analytical_creative", 50)
    risky = personality.get("safe_risky", 50)
    tech = personality.get("tech_novice_expert", 50)
    if tech > 70:
        clothing = rng.choice(["techwear", "casual", "streetwear"])
    elif creative > 70:
        clothing = rng.choice(["bohemian", "streetwear", "casual"])
    elif risky < 30:
        clothing = rng.choice(["formal", "casual"])
    else:
        clothing = rng.choice(CLOTHING)

    palette = rng.choice(CLOTHING_PALETTES.get(clothing, CLOTHING_PALETTES["casual"]))
    energy = max(0.1, min(1.0, personality.get("introvert_extrovert", 50) / 100.0 + rng.uniform(-0.15, 0.15)))

    return {
        "height": height,
        "body_type": body_type,
        "skin_tone": skin,
        "hair_color": hair_color,
        "hair_style": hair_style,
        "clothing_style": clothing,
        "primary_color": palette[0],
        "secondary_color": palette[1],
        "energy": round(energy, 2),
        "skin_hex": SKIN_HEX.get(skin, "#c68642"),
        "hair_hex": HAIR_HEX.get(hair_color, "#4a3020"),
    }


def sample_age(demographics: Dict[str, Any], seed: str) -> int:
    rng = _rng(seed + "-age")
    age_range = demographics.get("age_range") or [22, 45]
    lo, hi = int(age_range[0]), int(age_range[1])
    if lo > hi:
        lo, hi = hi, lo
    return rng.randint(lo, hi)


def sample_education(demographics: Dict[str, Any], seed: str) -> str:
    rng = _rng(seed + "-edu")
    level = demographics.get("education_level", "Mixed")
    mapping = {
        "Low": ["Educación secundaria", "Formación profesional básica", "Estudios primarios"],
        "Medium": ["Bachillerato", "Formación profesional", "Ciclo superior"],
        "High": ["Grado universitario", "Máster", "Doctorado", "Posgrado"],
        "Mixed": [
            "Educación secundaria",
            "Bachillerato",
            "Formación profesional",
            "Grado universitario",
            "Máster",
            "Autodidacta",
        ],
    }
    options = mapping.get(level, mapping["Mixed"])
    return rng.choice(options)


def sample_income(demographics: Dict[str, Any], seed: str, education: str) -> str:
    rng = _rng(seed + "-income")
    forced = demographics.get("income_level")
    if forced and forced != "Mixed":
        return forced
    # Soft correlate with education
    if "Doctorado" in education or "Máster" in education:
        return rng.choices(["medium", "high", "very_high"], weights=[0.3, 0.45, 0.25], k=1)[0]
    if "universitario" in education.lower() or "Grado" in education:
        return rng.choices(["low", "medium", "high"], weights=[0.2, 0.55, 0.25], k=1)[0]
    return rng.choices(["low", "medium", "high"], weights=[0.4, 0.45, 0.15], k=1)[0]


def sample_location(demographics: Dict[str, Any], seed: str) -> str:
    rng = _rng(seed + "-loc")
    regions = demographics.get("regions") or []
    if regions:
        return rng.choice(regions)
    cities = [
        "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga",
        "Bilbao", "Alicante", "Murcia", "Granada", "Valladolid", "Vigo",
        "A Coruña", "Santander", "Pamplona", "Salamanca", "Córdoba", "Gijón",
    ]
    return rng.choice(cities)


def enrich_profile(
    profile: Dict[str, Any],
    profile_parameters: Dict[str, Any],
    index: int,
) -> Dict[str, Any]:
    """Completa apariencia, estilo de reseña y defaults de consumidor de forma determinista."""
    seed = f"{profile.get('name', 'bot')}-{index}"
    demographics = profile_parameters.get("demographics") or {}

    # Personality fill defaults for new axes
    personality = profile.get("personality") or {}
    sampled = sample_personality(profile_parameters, seed)
    for k, v in sampled.items():
        if k not in personality or personality[k] is None:
            personality[k] = v
    profile["personality"] = personality

    if not profile.get("age"):
        profile["age"] = sample_age(demographics, seed)
    if not profile.get("education_level"):
        profile["education_level"] = sample_education(demographics, seed)
    if not profile.get("location"):
        profile["location"] = sample_location(demographics, seed)

    appearance = profile.get("appearance") or build_appearance(
        name=profile.get("name", f"bot{index}"),
        gender=profile.get("gender", "Other"),
        age=int(profile.get("age") or 30),
        personality=personality,
        seed=seed,
    )
    profile["appearance"] = appearance

    review_style = profile.get("review_style") or sample_review_style(profile_parameters, seed, personality)
    profile["review_style"] = review_style

    consumer = profile.get("consumer") or {}
    if not consumer.get("income_level"):
        consumer["income_level"] = sample_income(demographics, seed, profile.get("education_level", ""))
    if not consumer.get("occupation"):
        consumer["occupation"] = "Profesional"
    if not consumer.get("interests"):
        consumer["interests"] = []
    if not consumer.get("pain_points"):
        consumer["pain_points"] = []
    if not consumer.get("household"):
        consumer["household"] = "alone"
    if not consumer.get("shopping_channel"):
        consumer["shopping_channel"] = "both"
    if not consumer.get("brand_preferences"):
        consumer["brand_preferences"] = []
    if not consumer.get("recent_purchase_context"):
        consumer["recent_purchase_context"] = ""
    profile["consumer"] = consumer

    return profile


def verbosity_label(verbosity: int) -> str:
    """Etiqueta humana de verbosidad del reseñador (0-100)."""
    v = int(verbosity) if verbosity is not None else 50
    if v < 25:
        return "Pocas palabras"
    if v < 45:
        return "Conciso"
    if v < 65:
        return "Moderado"
    if v < 85:
        return "Hablador"
    return "Muy hablador"


def review_length_guidance(verbosity: int, detail: int) -> str:
    """
    Guia de longitud según verbosidad (eje principal: pocas palabras ↔ hablador)
    y nivel de detalle.
    """
    v = int(verbosity) if verbosity is not None else 50
    d = int(detail) if detail is not None else 50
    label = verbosity_label(v)

    if v < 25:
        return (
            f"VERBOSidad: {label} ({v}/100). Escribe MUY POCO: 1-2 frases cortas como máximo. "
            "Sin adornos, sin listas largas, sin relleno. Título de 2-5 palabras."
        )
    if v < 45:
        return (
            f"VERBOSidad: {label} ({v}/100). Reseña CORTA (2-4 frases). "
            "Directa y al grano. Un solo pro o con y basta."
        )
    if v < 65:
        base = (
            f"VERBOSidad: {label} ({v}/100). Longitud MEDIA: un párrafo o dos. "
            "Equilibrio entre opinión y algún detalle concreto."
        )
        if d >= 70:
            base += " Aun siendo moderado, incluye 1-2 detalles específicos del producto."
        return base
    if v < 85:
        return (
            f"VERBOSidad: {label} ({v}/100). Eres HABLADOR: 2-3 párrafos naturales. "
            "Cuenta anécdotas de uso, compara con lo que tenías, explica el porqué de la nota. "
            + ("Incluye bastantes detalles concretos." if d >= 55 else "Puedes divagar un poco en tono conversacional.")
        )
    return (
        f"VERBOSidad: {label} ({v}/100). Eres MUY HABLADOR: 3-4 párrafos o más. "
        "Escribes como en un foro: contexto personal, varios ejemplos, pros y contras desarrollados, "
        "y un cierre opinando. No te contengas en palabras."
    )


def rating_bias_guidance(
    positivity: int,
    skeptic: int,
    complaint: int,
    price_sensitive: int | None = None,
) -> str:
    """
    Sesgo de estrellas + cómo pesa la relación calidad/precio en la nota.
    price_sensitive: 0 = muy sensible al precio, 100 = prefiere premium (price_sensitive_premium).
    """
    # Higher positivity → higher stars tendency, but not forced
    if positivity >= 80 and complaint < 40:
        base = (
            "Tiendes a ser generoso en la nota (4-5) si el producto cubre lo básico, "
            "pero no regales 5 si hay fallos claros."
        )
    elif positivity <= 30 or complaint >= 70:
        base = (
            "Eres exigente: raramente das 5. Si algo falla, baja a 2-3. "
            "Solo 4+ si te convence de verdad."
        )
    elif skeptic is not None and skeptic < 35:
        base = "Eres escéptico con promesas de marketing; valora con rigor y justifica la nota."
    else:
        base = (
            "Valora de forma equilibrada: la nota debe cuadrar con lo que escribes "
            "(no digas que es malo y pongas 5)."
        )

    ps = int(price_sensitive) if price_sensitive is not None else 50
    if ps <= 35:
        qp = (
            " RELACIÓN CALIDAD/PRECIO (te importa mucho el precio): ajusta el rating a si "
            "merece lo que cuesta. Si es caro para lo que ofrece, baja estrellas aunque "
            "funcione bien; si es un chollo por lo que da, puedes subir la nota. "
            "Menciona el precio o la relación calidad-precio al justificar la valoración."
        )
    elif ps >= 70:
        qp = (
            " RELACIÓN CALIDAD/PRECIO (prefieres premium): prioriza calidad y acabados "
            "sobre el precio bajo. Aun así, si el precio es desorbitado respecto a lo que "
            "ofrece, no regales 5; si la calidad justifica el precio, puedes ser generoso. "
            "La nota debe reflejar si el producto vale lo que cuesta para ti."
        )
    else:
        qp = (
            " RELACIÓN CALIDAD/PRECIO: al poner el rating (1-5), sopesa calidad real vs precio "
            "del producto. Un producto bueno pero caro puede bajar media estrella; uno decente "
            "y barato puede subirla. La nota no es solo 'me gusta / no me gusta': es también "
            "si compensa lo que pagas. Refléjalo en el texto si tu verbosidad lo permite."
        )
    return base + qp
