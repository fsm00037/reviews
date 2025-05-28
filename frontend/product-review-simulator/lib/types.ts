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

// Tipos para configuración demográfica
export interface DemographicConfig {
  age_range: [number, number];
  education_level: string; // 'Low', 'Medium', 'High' o 'Mixed'
  gender_ratio: string; // 'Male', 'Female' o 'Male&Female'
}

// Tipos para configuración de personalidad
export interface PersonalityConfig {
  introvert_extrovert: [number, number];
  analytical_creative: [number, number];
  busy_free_time: [number, number];
  disorganized_organized: [number, number];
  independent_cooperative: [number, number];
  environmentalist: [number, number];
  safe_risky: [number, number];
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