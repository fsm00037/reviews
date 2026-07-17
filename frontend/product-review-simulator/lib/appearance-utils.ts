import type { Appearance3D, BotPersonality, BotProfile } from "./types"

const SKIN_HEX: Record<string, string> = {
  fair: "#f3c9a8",
  light: "#e8b48a",
  medium: "#c98a54",
  olive: "#b07a4a",
  tan: "#9a6435",
  brown: "#6e4226",
  dark: "#3d2416",
}

/** Paleta amplia de pelo (natural + fashion) */
const HAIR_HEX: Record<string, string> = {
  black: "#1c1410",
  dark_brown: "#2c1810",
  brown: "#5c3a21",
  light_brown: "#8b5a2b",
  auburn: "#922b21",
  red: "#c0392b",
  ginger: "#e07a3d",
  blonde: "#e0c068",
  platinum: "#f0e6c8",
  gray: "#9aa0a8",
  white: "#f0eeea",
  blue: "#3b82f6",
  teal: "#14b8a6",
  pink: "#ec4899",
  purple: "#a855f7",
  green: "#22c55e",
  orange: "#f97316",
  silver: "#c0c7d1",
}

const HAIR_COLOR_KEYS = Object.keys(HAIR_HEX)

const HAIR_STYLES_MALE = [
  "short",
  "medium",
  "bald",
  "curly",
  "spiky",
  "side_part",
  "fringe",
  "mohawk",
  "afro",
]
const HAIR_STYLES_FEMALE = [
  "medium",
  "long",
  "curly",
  "ponytail",
  "bun",
  "bob",
  "twin_tails",
  "fringe",
  "afro",
  "side_part",
]
const HAIR_STYLES_ANY = [...new Set([...HAIR_STYLES_MALE, ...HAIR_STYLES_FEMALE])]

/** Muchos colores de ropa vivos + neutros */
const SHIRT_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981",
  "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
  "#d946ef", "#ec4899", "#f43f5e", "#fb7185",
  "#1e293b", "#334155", "#475569", "#64748b", "#0f172a", "#18181b",
  "#fef3c7", "#fce7f3", "#e0e7ff", "#d1fae5", "#fff7ed", "#fafafa",
  "#7c2d12", "#14532d", "#1e3a8a", "#4c1d95", "#831843", "#164e63",
  "#be123c", "#c2410c", "#a16207", "#4d7c0f", "#0f766e", "#1d4ed8",
]

const ACCENT_COLORS = [
  "#fbbf24", "#f472b6", "#67e8f9", "#a3e635", "#c4b5fd", "#fda4af",
  "#fde68a", "#99f6e4", "#bfdbfe", "#e9d5ff", "#fecdd3", "#fed7aa",
  "#ffffff", "#f8fafc", "#e2e8f0", "#94a3b8", "#38bdf8", "#4ade80",
]

const PANTS_COLORS = [
  "#1e293b", "#0f172a", "#334155", "#1e3a5f", "#172554", "#3f3f46",
  "#44403c", "#292524", "#365314", "#14532d", "#164e63", "#4c1d95",
  "#7c2d12", "#881337", "#374151", "#1f2937", "#0c4a6e", "#312e81",
  "#57534e", "#78716c", "#a8a29e", "#d6d3d1", "#2563eb", "#dc2626",
  "#059669", "#7c3aed", "#ea580c", "#db2777",
]

const SHOE_COLORS = [
  "#0f172a", "#1f2937", "#292524", "#ffffff", "#f8fafc", "#ef4444",
  "#3b82f6", "#a855f7", "#f97316", "#22c55e", "#eab308", "#ec4899",
  "#78350f", "#0ea5e9", "#111827", "#52525b",
]

const EYE_HEX = [
  "#3d2914", "#2c4a3e", "#3a4a6b", "#4a3728", "#1a1a1a", "#5c4033",
  "#1e40af", "#065f46", "#713f12", "#44403c", "#0e7490",
]

function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function pick<T>(arr: T[], seed: number, salt: number): T {
  return arr[Math.abs(seed + salt * 2654435761) % arr.length]
}

function shade(hex: string, amount: number): string {
  const n = hex.replace("#", "")
  const num = parseInt(n.length === 3 ? n.split("").map((c) => c + c).join("") : n, 16)
  const r = Math.min(255, Math.max(0, ((num >> 16) & 255) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 255) + amount))
  const b = Math.min(255, Math.max(0, (num & 255) + amount))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/** Variación de matiz ligera para no repetir el mismo hex */
function jitterColor(hex: string, seed: number, salt: number): string {
  const n = hex.replace("#", "")
  const num = parseInt(n.length === 3 ? n.split("").map((c) => c + c).join("") : n, 16)
  const j = ((seed + salt) % 31) - 15
  const r = Math.min(255, Math.max(0, ((num >> 16) & 255) + j))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 255) + ((salt % 21) - 10)))
  const b = Math.min(255, Math.max(0, (num & 255) + (((seed >> 3) + salt) % 25) - 12))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

export type ResolvedAppearance = Required<
  Pick<
    Appearance3D,
    | "height"
    | "body_type"
    | "skin_tone"
    | "hair_color"
    | "hair_style"
    | "clothing_style"
    | "primary_color"
    | "secondary_color"
    | "energy"
    | "skin_hex"
    | "hair_hex"
  >
> & {
  pants_color: string
  shoe_color: string
  eye_color: string
  lip_color: string
  seed: number
  gender: string
  age: number
}

export function resolveAppearance(bot: BotProfile): ResolvedAppearance {
  const a = bot.appearance || {}
  const seed = hashSeed(`${bot.name}-${bot.id}-${bot.location || ""}`)
  const p = bot.personality || ({} as BotPersonality)

  // Variedad visual siempre por seed (nombre+id) → población diversa aunque el backend sea limitado
  const skinTone = a.skin_tone || pick(["fair", "light", "medium", "olive", "tan", "brown", "dark"], seed, 1)

  const age = bot.age || 30
  let hairColorKey = pick(HAIR_COLOR_KEYS, seed, 3)
  if (age >= 55) {
    hairColorKey = pick(["gray", "white", "silver", "light_brown", "brown", "platinum"], seed, 4)
  }

  const bodyType = a.body_type || pick(["slim", "average", "athletic", "heavy"], seed, 5)
  const clothing = pick(["casual", "formal", "sporty", "streetwear", "bohemian", "techwear"], seed, 7)

  const hairStyle =
    bot.gender === "Male"
      ? pick(HAIR_STYLES_MALE, seed, 9)
      : bot.gender === "Female"
        ? pick(HAIR_STYLES_FEMALE, seed, 11)
        : pick(HAIR_STYLES_ANY, seed, 13)

  let height = a.height
  if (!height) {
    if (bot.gender === "Male") height = 1.65 + (seed % 28) / 100
    else if (bot.gender === "Female") height = 1.52 + (seed % 26) / 100
    else height = 1.55 + (seed % 30) / 100
  }

  const primary = jitterColor(pick(SHIRT_COLORS, seed, 13), seed, 17)
  const secondary = jitterColor(pick(ACCENT_COLORS, seed, 19), seed, 23)

  const energy =
    a.energy ??
    Math.min(1, Math.max(0.15, ((p.introvert_extrovert ?? 50) / 100) * 0.85 + ((seed % 20) - 10) / 100))

  const skinHex = a.skin_hex || SKIN_HEX[skinTone] || "#c98a54"
  const hairHex = HAIR_HEX[hairColorKey] || pick(Object.values(HAIR_HEX), seed, 29)

  let pants = pick(PANTS_COLORS, seed, 41)
  let shoes = pick(SHOE_COLORS, seed, 47)

  if (clothing === "formal") {
    pants = pick(["#1e293b", "#111827", "#334155", "#1e3a5f", "#0f172a", "#27272a"], seed, 21)
    shoes = pick(["#0f172a", "#1c1917", "#292524"], seed, 23)
  } else if (clothing === "sporty") {
    pants = pick(["#0f172a", "#1e3a5f", "#14532d", "#2563eb", "#dc2626", "#18181b"], seed, 21)
    shoes = pick(["#f8fafc", "#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7"], seed, 23)
  } else if (clothing === "streetwear") {
    pants = pick(["#18181b", "#27272a", "#3f3f46", "#4c1d95", "#7c2d12", "#0f766e"], seed, 21)
    shoes = pick(["#fafafa", "#a855f7", "#f97316", "#ec4899", "#06b6d4"], seed, 23)
  } else if (clothing === "bohemian") {
    pants = pick(["#92400e", "#78350f", "#a16207", "#b45309", "#7c3aed", "#be185d"], seed, 21)
    shoes = pick(["#78350f", "#a16207", "#44403c", "#fef3c7"], seed, 23)
  } else if (clothing === "techwear") {
    pants = pick(["#111827", "#0f172a", "#1e293b", "#020617"], seed, 21)
    shoes = pick(["#0ea5e9", "#22d3ee", "#38bdf8", "#64748b"], seed, 23)
  }

  pants = jitterColor(pants, seed, 53)
  shoes = jitterColor(shoes, seed, 59)

  const eye = pick(EYE_HEX, seed, 61)
  const lip =
    bot.gender === "Female"
      ? pick(["#c4787a", "#b56576", "#a24b5a", "#e11d48", "#fb7185", shade(skinHex, -15)], seed, 67)
      : shade(skinHex, -12)

  return {
    height,
    body_type: bodyType,
    skin_tone: skinTone,
    hair_color: hairColorKey,
    hair_style: hairStyle,
    clothing_style: clothing,
    primary_color: primary,
    secondary_color: secondary,
    energy,
    skin_hex: skinHex,
    hair_hex: hairHex,
    pants_color: pants,
    shoe_color: shoes,
    eye_color: eye,
    lip_color: lip,
    seed,
    gender: bot.gender || "Other",
    age,
  }
}

const MAP_HALF = 5.0 // mitad del mapa de personalidad (metros)

/** Claves de personalidad usadas en los mapas 3D */
export type PersonalityAxisKey = keyof BotPersonality

export type PersonalityMapDef = {
  id: string
  /** Etiqueta corta del botón / HUD */
  shortLabel: string
  /** Eje X: izq → der */
  xKey: PersonalityAxisKey
  xLeft: string
  xRight: string
  /** Eje Z: atrás → delante (en el suelo) */
  zKey: PersonalityAxisKey
  zBack: string
  zFront: string
  /** Etiquetas de cuadrantes (opcional, se generan si faltan) */
  qNW?: string
  qNE?: string
  qSW?: string
  qSE?: string
}

/** Mapas alternables en modo Personalidad */
export const PERSONALITY_MAPS: PersonalityMapDef[] = [
  {
    id: "social_tech",
    shortLabel: "Social × Tech",
    xKey: "introvert_extrovert",
    xLeft: "Introvertido",
    xRight: "Extrovertido",
    zKey: "tech_novice_expert",
    zBack: "Novato tech",
    zFront: "Experto tech",
    qNW: "Intro · Novato",
    qNE: "Extro · Novato",
    qSW: "Intro · Experto",
    qSE: "Extro · Experto",
  },
  {
    id: "social_risk",
    shortLabel: "Social × Riesgo",
    xKey: "introvert_extrovert",
    xLeft: "Introvertido",
    xRight: "Extrovertido",
    zKey: "safe_risky",
    zBack: "Prudente",
    zFront: "Arriesgado",
    qNW: "Intro · Prudente",
    qNE: "Extro · Prudente",
    qSW: "Intro · Arriesgado",
    qSE: "Extro · Arriesgado",
  },
  {
    id: "mind_price",
    shortLabel: "Mente × Precio",
    xKey: "analytical_creative",
    xLeft: "Analítico",
    xRight: "Creativo",
    zKey: "price_sensitive_premium",
    zBack: "Sensible precio",
    zFront: "Premium",
    qNW: "Analítico · Precio",
    qNE: "Creativo · Precio",
    qSW: "Analítico · Premium",
    qSE: "Creativo · Premium",
  },
  {
    id: "time_order",
    shortLabel: "Tiempo × Orden",
    xKey: "busy_free_time",
    xLeft: "Ocupado",
    xRight: "Tiempo libre",
    zKey: "disorganized_organized",
    zBack: "Desorganizado",
    zFront: "Organizado",
    qNW: "Ocupado · Caos",
    qNE: "Libre · Caos",
    qSW: "Ocupado · Orden",
    qSE: "Libre · Orden",
  },
  {
    id: "loyalty_skept",
    shortLabel: "Marca × Actitud",
    xKey: "brand_loyal_explorer",
    xLeft: "Fiel a marcas",
    xRight: "Explorador",
    zKey: "skeptic_enthusiast",
    zBack: "Escéptico",
    zFront: "Entusiasta",
    qNW: "Fiel · Escéptico",
    qNE: "Explora · Escéptico",
    qSW: "Fiel · Entusiasta",
    qSE: "Explora · Entusiasta",
  },
  {
    id: "coop_eco",
    shortLabel: "Grupo × Eco",
    xKey: "independent_cooperative",
    xLeft: "Independiente",
    xRight: "Cooperativo",
    zKey: "environmentalist",
    zBack: "Poco eco",
    zFront: "Ecologista",
    qNW: "Indep · Poco eco",
    qNE: "Coop · Poco eco",
    qSW: "Indep · Eco",
    qSE: "Coop · Eco",
  },
]

export function getPersonalityMap(index: number): PersonalityMapDef {
  const i = ((index % PERSONALITY_MAPS.length) + PERSONALITY_MAPS.length) % PERSONALITY_MAPS.length
  return PERSONALITY_MAPS[i]
}

function axisValue(bot: BotProfile, key: PersonalityAxisKey): number {
  const p = bot.personality || ({} as BotPersonality)
  const v = p[key]
  if (typeof v === "number" && !Number.isNaN(v)) return Math.max(0, Math.min(100, v))
  // Fallbacks suaves si falta un eje
  if (key === "tech_novice_expert" && typeof p.analytical_creative === "number") {
    return p.analytical_creative
  }
  return 50
}

/**
 * Normaliza un valor respecto al resto de la población (min–max).
 * Si todos son iguales, usa el rank por índice para no amontonar.
 * Combina posición relativa en la muestra + valor absoluto 0–100.
 */
function representativeNorm(
  value: number,
  peers: number[],
  index: number,
  total: number
): number {
  const min = Math.min(...peers)
  const max = Math.max(...peers)
  let relative: number
  if (max - min < 0.5) {
    relative = total <= 1 ? 0.5 : index / (total - 1)
  } else {
    relative = (value - min) / (max - min)
  }
  const absolute = Math.max(0, Math.min(1, value / 100))
  return relative * 0.72 + absolute * 0.28
}

/**
 * Posición en el mapa de personalidad (formación) según un par de ejes.
 * Si se pasa `allBots`, la posición es relativa a la población.
 */
export function personalityPosition(
  bot: BotProfile,
  index: number,
  total: number,
  allBots?: BotProfile[],
  mapDef: PersonalityMapDef = PERSONALITY_MAPS[0]
): [number, number, number] {
  const peers = allBots && allBots.length > 0 ? allBots : [bot]
  const xPeers = peers.map((b) => axisValue(b, mapDef.xKey))
  const zPeers = peers.map((b) => axisValue(b, mapDef.zKey))

  const xv = axisValue(bot, mapDef.xKey)
  const zv = axisValue(bot, mapDef.zKey)

  const nx = representativeNorm(xv, xPeers, index, total)
  const nz = representativeNorm(zv, zPeers, index, total)

  let x = nx * (MAP_HALF * 2) - MAP_HALF
  let z = nz * (MAP_HALF * 2) - MAP_HALF

  const seed = Math.abs((bot.id ?? index) * 2654435761 + mapDef.id.length * 97) >>> 0
  const jitterR = 0.08 + (seed % 18) / 120
  const jitterA = ((seed % 360) * Math.PI) / 180
  x += Math.cos(jitterA) * jitterR
  z += Math.sin(jitterA) * jitterR

  const dist = Math.hypot(x, z)
  if (dist < 0.45 && total > 3) {
    const push = 0.35 + (index % 5) * 0.12
    const a = (index / Math.max(total, 1)) * Math.PI * 2
    x += Math.cos(a) * push
    z += Math.sin(a) * push
  }

  const clamp = MAP_HALF + 0.15
  return [
    Math.max(-clamp, Math.min(clamp, x)),
    0,
    Math.max(-clamp, Math.min(clamp, z)),
  ]
}

/** Calcula todas las plazas y aplica separación mínima (repulsión simple). */
export function personalityPositions(
  bots: BotProfile[],
  mapDef: PersonalityMapDef = PERSONALITY_MAPS[0]
): Map<number | string, [number, number, number]> {
  const n = bots.length
  const raw = bots.map((bot, i) => personalityPosition(bot, i, n, bots, mapDef))
  const minDist = Math.max(0.85, Math.min(1.35, 1.55 - n * 0.02))

  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = raw[i]
        const b = raw[j]
        let dx = b[0] - a[0]
        let dz = b[2] - a[2]
        let d = Math.hypot(dx, dz)
        if (d < 1e-4) {
          const ang = ((i * 37 + j * 11) % 360) * (Math.PI / 180)
          dx = Math.cos(ang)
          dz = Math.sin(ang)
          d = 0.01
        }
        if (d < minDist) {
          const push = ((minDist - d) / 2) * 0.85
          const ux = dx / d
          const uz = dz / d
          a[0] -= ux * push
          a[2] -= uz * push
          b[0] += ux * push
          b[2] += uz * push
        }
      }
    }
  }

  const clamp = MAP_HALF + 0.2
  const map = new Map<number | string, [number, number, number]>()
  bots.forEach((bot, i) => {
    const p = raw[i]
    map.set(bot.id ?? i, [
      Math.max(-clamp, Math.min(clamp, p[0])),
      0,
      Math.max(-clamp, Math.min(clamp, p[2])),
    ])
  })
  return map
}

export function bodyScale(bodyType: string): {
  torso: number
  limbs: number
  shoulders: number
  hips: number
  chest: number
} {
  switch (bodyType) {
    case "slim":
      return { torso: 0.88, limbs: 0.92, shoulders: 0.9, hips: 0.88, chest: 0.88 }
    case "athletic":
      return { torso: 1.08, limbs: 1.05, shoulders: 1.18, hips: 0.98, chest: 1.12 }
    case "heavy":
      return { torso: 1.22, limbs: 1.08, shoulders: 1.15, hips: 1.25, chest: 1.2 }
    default:
      return { torso: 1, limbs: 1, shoulders: 1, hips: 1, chest: 1 }
  }
}

export function genderShape(gender: string): {
  shoulderMul: number
  hipMul: number
  chestMul: number
  waistMul: number
} {
  if (gender === "Female") return { shoulderMul: 0.9, hipMul: 1.12, chestMul: 1.05, waistMul: 0.88 }
  if (gender === "Male") return { shoulderMul: 1.12, hipMul: 0.95, chestMul: 1.08, waistMul: 0.96 }
  return { shoulderMul: 1, hipMul: 1, chestMul: 1, waistMul: 1 }
}
