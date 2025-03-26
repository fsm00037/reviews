import { 
  Product, 
  BotProfile, 
  Review, 
  DemographicConfig, 
  PersonalityConfig, 
  AnalysisResult 
} from './types';

// URL base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Función de ayuda para realizar peticiones
async function fetchAPI<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Servicios para Productos
export const ProductService = {
  // Obtener todos los productos
  getProducts: () => fetchAPI<Product[]>('/products'),
  
  // Obtener un producto específico por ID
  getProduct: (id: number) => fetchAPI<Product>(`/products/${id}`),
  
  // Crear un nuevo producto
  createProduct: (product: Omit<Product, 'id'>) => 
    fetchAPI<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),
};

// Servicios para Bots
export const BotService = {
  // Generar perfiles de bots según la configuración
  generateBots: (config: {
    product_id: number;
    population_range: [number, number];
    positivity_bias: [number, number];
    verbosity: [number, number];
    detail_level: [number, number];
    demographics: DemographicConfig;
    personality: PersonalityConfig;
  }) => fetchAPI<BotProfile[]>('/bots/generate', {
    method: 'POST',
    body: JSON.stringify(config),
  }),
  
  // Obtener un bot específico
  getBot: (id: number) => fetchAPI<BotProfile>(`/bots/${id}`),
};

// Servicios para Reviews
export const ReviewService = {
  // Generar reviews basadas en perfiles de bots
  generateReviews: (data: {
    product_id: number;
    bot_ids: number[];
  }) => fetchAPI<Review[]>('/reviews/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Obtener reviews para un producto específico
  getProductReviews: (productId: number) => 
    fetchAPI<Review[]>(`/reviews/product/${productId}`),
};

// Servicios para Análisis
export const AnalysisService = {
  // Obtener análisis de reviews para un producto
  getProductAnalysis: (productId: number) => 
    fetchAPI<AnalysisResult>(`/analysis/product/${productId}`),
};

export default {
  ProductService,
  BotService,
  ReviewService,
  AnalysisService
}; 