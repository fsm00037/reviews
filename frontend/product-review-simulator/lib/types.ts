// Tipo para producto
export interface Product {
  id?: number;
  name: string;
  description: string;
  price: string;
  image: string;
  category: string;
  main_features?: {
    feature: string;
    value?: string;
    description?: string;
  }[];
  technical_specs?: {
    spec: string;
    value?: string;
    description?: string;
  }[];
}

// Tipos para configuración demográfica (parametrizable comercial)
export interface DemographicConfig {
  age_range: [number, number];
  education_level: string; // 'Low', 'Medium', 'High' o 'Mixed'
  gender_ratio: string; // 'Male', 'Female' o 'Male&Female'
  income_level?: string; // 'low' | 'medium' | 'high' | 'very_high' | 'Mixed'
  regions?: string[];
}

// Tipos para configuración de personalidad (rangos de población)
export interface PersonalityConfig {
  introvert_extrovert: [number, number];
  analytical_creative: [number, number];
  busy_free_time: [number, number];
  disorganized_organized: [number, number];
  independent_cooperative: [number, number];
  environmentalist: [number, number];
  safe_risky: [number, number];
  price_sensitive_premium?: [number, number];
  brand_loyal_explorer?: [number, number];
  tech_novice_expert?: [number, number];
  skeptic_enthusiast?: [number, number];
}

// Tipos para personalidad de bot
export interface BotPersonality {
  introvert_extrovert: number;
  analytical_creative: number;
  busy_free_time: number;
  disorganized_organized: number;
  independent_cooperative: number;
  environmentalist: number;
  safe_risky: number;
  price_sensitive_premium?: number;
  brand_loyal_explorer?: number;
  tech_novice_expert?: number;
  skeptic_enthusiast?: number;
}

/** Apariencia física para simulación 3D */
export interface Appearance3D {
  height?: number;
  body_type?: "slim" | "average" | "athletic" | "heavy" | string;
  skin_tone?: string;
  hair_color?: string;
  hair_style?: string;
  clothing_style?: string;
  primary_color?: string;
  secondary_color?: string;
  energy?: number;
  skin_hex?: string;
  hair_hex?: string;
}

export interface ConsumerProfile {
  occupation?: string;
  income_level?: "low" | "medium" | "high" | "very_high" | string;
  household?: string;
  shopping_channel?: string;
  interests?: string[];
  pain_points?: string[];
  brand_preferences?: string[];
  recent_purchase_context?: string;
}

export interface ReviewStyle {
  positivity?: number;
  /** 0 = pocas palabras, 100 = muy hablador */
  verbosity?: number;
  detail_level?: number;
  formality?: number;
  emoji_usage?: number;
  typo_tendency?: number;
  complaint_focus?: number;
}

// Tipo para perfil de bot
export interface BotProfile {
  id: number;
  name: string;
  avatar: string;
  bio: string;
  age: number;
  location: string;
  gender: string;
  education_level: string;
  personality: BotPersonality;
  backstory?: string;
  appearance?: Appearance3D;
  consumer?: ConsumerProfile;
  review_style?: ReviewStyle;
}

// Tipo para review
export interface Review {
  id: number;
  bot_id: number;
  product_id: number;
  rating: number;
  title: string;
  content: string;
  date?: string;
  helpful_votes?: number;
  pros?: string[];
  cons?: string[];
  would_recommend?: boolean;
  usage_duration?: string;
  verified_purchase?: boolean;
}

// Tipo para distribución de calificaciones
export interface RatingDistribution {
  one_star: number;
  two_stars: number;
  three_stars: number;
  four_stars: number;
  five_stars: number;
}

// Tipo para análisis de palabras clave
export interface KeywordAnalysis {
  word: string;
  count: number;
  sentiment: "positive" | "negative" | "neutral";
}

// Tipo para resultado de análisis
export interface AnalysisResult {
  average_rating: number;
  rating_distribution: number[] | RatingDistribution;
  positive_points: string[];
  negative_points: string[];
  keyword_analysis: KeywordAnalysis[];
  demographic_insights: string[];
  market_fit_score?: number;
  launch_recommendation?: string;
  segment_breakdown?: { segment: string; avg_rating?: number; n?: number; note?: string }[];
}

// Tipo para configuración de bots
export interface BotConfigRequest {
  product_id: number;
  population_range: [number, number];
  positivity_bias: [number, number];
  verbosity: [number, number];
  detail_level: [number, number];
  demographics: DemographicConfig;
  personality: PersonalityConfig;
}

// Tipo para errores de API
export interface APIError {
  status: number;
  message: string;
  details: string | null;
}

// Tipo para sesiones recientes
export interface RecentSession {
  session_id: string;
  created_at: string;
  product_name: string;
  product_image: string | null;
  average_rating: number | null;
  parent_session_id?: string | null;
  parent_product_name?: string | null;
}
