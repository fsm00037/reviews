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

/**
 * Posición en el mapa de personalidad (formación):
 * - Eje X: Introvertido (izq) → Extrovertido (der)
 * - Eje Z: Novato tech (atrás) → Experto tech (delante)
 * Jitter mínimo por id para no solaparse sin salir de la zona.
 */
export function personalityPosition(bot: BotProfile, index: number, total: number): [number, number, number] {
  const p = bot.personality || ({} as BotPersonality)
  const seed = Math.abs((bot.id ?? index) * 2654435761) >>> 0

  const introExt = p.introvert_extrovert ?? 50
  const tech = p.tech_novice_expert ?? p.analytical_creative ?? 50

  // Mapa centrado ~±4.6 (dentro del patio)
  const xBase = (introExt / 100) * 9.2 - 4.6
  const zBase = (tech / 100) * 9.2 - 4.6

  // Separación local pequeña (0–0.35) para evitar solapes exactos
  const jitterR = 0.12 + (seed % 24) / 100
  const jitterA = ((seed % 360) * Math.PI) / 180
  // Empuje radial suave si hay muchos en el mismo cuadrante
  const crowd = Math.min(0.25, total * 0.008)
  const x = xBase + Math.cos(jitterA) * (jitterR + crowd)
  const z = zBase + Math.sin(jitterA) * (jitterR + crowd)

  return [
    Math.max(-5.1, Math.min(5.1, x)),
    0,
    Math.max(-5.1, Math.min(5.1, z)),
  ]
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
