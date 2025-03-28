import { 
  Product, 
  BotProfile, 
  Review, 
  AnalysisResult,
  APIError
} from './types';

// URL base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const error: APIError = {
        status: response.status,
        message: data.error || `Error ${response.status}: ${response.statusText}`,
        details: data.details || null
      };
      throw error;
    }
    
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      const networkError: APIError = {
        status: 0,
        message: 'Error de conexión: No se pudo conectar con el servidor',
        details: 'Verifica tu conexión a internet o que el servidor esté funcionando'
      };
      throw networkError;
    }
    
    throw error;
  }
}

// Servicios para Productos
export const ProductService = {
  // Limpiar outputs y analizar un producto desde URL
  analyzeProduct: async (productUrl: string, modelName?: string) => {
    // Primero limpiar la carpeta de outputs
    await fetchAPI('/clean-outputs', {
      method: 'POST'
    });
    
    // Luego realizar el análisis del producto
    const productInfo = await fetchAPI<Product>('/phase1', {
      method: 'POST',
      body: JSON.stringify({
        product_url: productUrl,
        model_name: modelName
      }),
    });
    
    // Normalizar la estructura de características y especificaciones
    if (productInfo.main_features) {
      productInfo.main_features = productInfo.main_features.map(feature => ({
        feature: feature.feature,
        value: feature.value || feature.description || ""
      }));
    }
    
    if (productInfo.technical_specs) {
      productInfo.technical_specs = productInfo.technical_specs.map(spec => ({
        spec: spec.spec,
        value: spec.value || spec.description || ""
      }));
    }
    
    return productInfo;
  },
    
  // Obtener información del producto actual
  getProductInfo: async () => {
    const productInfo = await fetchAPI<Product>('/product');
    
    // Normalizar la estructura de características y especificaciones
    if (productInfo.main_features) {
      productInfo.main_features = productInfo.main_features.map(feature => ({
        feature: feature.feature,
        value: feature.value || feature.description || ""
      }));
    }
    
    if (productInfo.technical_specs) {
      productInfo.technical_specs = productInfo.technical_specs.map(spec => ({
        spec: spec.spec,
        value: spec.value || spec.description || ""
      }));
    }
    
    return productInfo;
  },

  // Actualizar información del producto
  updateProduct: (product: Product) => 
    fetchAPI<Product>('/product', {
      method: 'PUT',
      body: JSON.stringify(product),
    })
};

// Servicios para Bots
export const BotService = {
  // Generar perfiles de bots
  generateBots: (numReviewers: number, modelName?: string) => 
    fetchAPI<{profiles: BotProfile[]}>('/phase2', {
      method: 'POST',
      body: JSON.stringify({
        num_reviewers: numReviewers,
        model_name: modelName
      }),
    }),
  
  // Obtener perfiles actuales
  getReviewerProfiles: () => fetchAPI<BotProfile[]>('/reviewers')
};

// Servicios para Reviews
export const ReviewService = {
  // Generar reseñas usando la fase 3
  generateReviews: (modelName?: string) => {
    return fetchAPI<any>('/phase3', {
      method: 'POST',
      body: JSON.stringify({
        model_name: modelName
      }),
    }).then(response => {
      // Verificar la estructura de la respuesta y adaptarla
      if (response && Array.isArray(response)) {
        // Si la respuesta es un array, asumimos que son las reseñas directamente
        return { reviews: response };
      } else if (response && typeof response === 'object' && 'reviews' in response) {
        // Si la respuesta tiene una propiedad 'reviews', la usamos
        return response;
      } else {
        // En cualquier otro caso, devolvemos un objeto con un array vacío
        console.warn('Formato de respuesta inesperado:', response);
        return { reviews: [] };
      }
    });
  },
  
  // Obtener reseñas existentes
  getReviews: () => {
    return fetchAPI<any>('/reviews').then(response => {
      // Verificar la estructura de la respuesta y adaptarla
      if (response && Array.isArray(response)) {
        // Si la respuesta es un array, asumimos que son las reseñas directamente
        return response;
      } else if (response && typeof response === 'object' && 'reviews' in response) {
        // Si la respuesta tiene una propiedad 'reviews', devolvemos esa propiedad
        return response.reviews;
      } else {
        // En cualquier otro caso, devolvemos un array vacío
        console.warn('Formato de respuesta inesperado en getReviews:', response);
        return [];
      }
    });
  }
};

// Servicios para Análisis
export const AnalysisService = {
  // Generar análisis usando la fase 4
  generateAnalysis: (modelName?: string) => {
    return fetchAPI<any>('/phase4', {
      method: 'POST',
      body: JSON.stringify({
        model_name: modelName
      }),
    }).then(response => {
      // Verificar si la respuesta es válida
      if (typeof response === 'object' && response !== null) {
        // Asegurarse de que todos los campos son serializables
        const safeResponse: any = {};
        
        // Copiar solo los campos que sabemos que son seguros
        if ('average_rating' in response) safeResponse.average_rating = response.average_rating;
        if ('rating_distribution' in response) safeResponse.rating_distribution = response.rating_distribution;
        if ('positive_points' in response) safeResponse.positive_points = response.positive_points;
        if ('negative_points' in response) safeResponse.negative_points = response.negative_points;
        if ('keyword_analysis' in response) safeResponse.keyword_analysis = response.keyword_analysis;
        if ('demographic_insights' in response) safeResponse.demographic_insights = response.demographic_insights;
        
        return safeResponse;
      }
      return response;
    });
  },
  
  // Obtener análisis actual
  getAnalysis: () => {
    return fetchAPI<any>('/analysis').then(response => {
      // Verificar si la respuesta es válida
      if (typeof response === 'object' && response !== null) {
        // Asegurarse de que todos los campos son serializables
        const safeResponse: any = {};
        
        // Copiar solo los campos que sabemos que son seguros
        if ('average_rating' in response) safeResponse.average_rating = response.average_rating;
        if ('rating_distribution' in response) safeResponse.rating_distribution = response.rating_distribution;
        if ('positive_points' in response) safeResponse.positive_points = response.positive_points;
        if ('negative_points' in response) safeResponse.negative_points = response.negative_points;
        if ('keyword_analysis' in response) safeResponse.keyword_analysis = response.keyword_analysis;
        if ('demographic_insights' in response) safeResponse.demographic_insights = response.demographic_insights;
        
        return safeResponse;
      }
      return response;
    });
  }
};

// Servicio para ejecutar todas las fases
export const SimulatorService = {
  // Ejecutar todo el proceso de una vez
  runCompleteAnalysis: async (productUrl: string, numReviewers: number, modelName?: string) => {
    // Primero limpiar la carpeta de outputs
    await fetchAPI('/clean-outputs', {
      method: 'POST'
    });
    
    // Luego ejecutar el análisis completo
    const results = await fetchAPI<{
      product: Product, 
      reviewers: BotProfile[], 
      reviews: Review[], 
      analysis: AnalysisResult
    }>('/analyze-all', {
      method: 'POST',
      body: JSON.stringify({
        product_url: productUrl,
        num_reviewers: numReviewers,
        model_name: modelName
      }),
    });
    
    // Normalizar la estructura de características y especificaciones
    if (results.product.main_features) {
      results.product.main_features = results.product.main_features.map(feature => ({
        feature: feature.feature,
        value: feature.value || feature.description || ""
      }));
    }
    
    if (results.product.technical_specs) {
      results.product.technical_specs = results.product.technical_specs.map(spec => ({
        spec: spec.spec,
        value: spec.value || spec.description || ""
      }));
    }
    
    return results;
  },
    
  // Obtener todos los resultados
  getAllResults: async () => {
    const results = await fetchAPI<{
      product: Product, 
      reviewers: BotProfile[], 
      reviews: any, 
      analysis: AnalysisResult
    }>('/results');
    
    // Normalizar la estructura de características y especificaciones
    if (results.product && results.product.main_features) {
      results.product.main_features = results.product.main_features.map(feature => ({
        feature: feature.feature,
        value: feature.value || feature.description || ""
      }));
    }
    
    if (results.product && results.product.technical_specs) {
      results.product.technical_specs = results.product.technical_specs.map(spec => ({
        spec: spec.spec,
        value: spec.value || spec.description || ""
      }));
    }
    
    // Normalizar el formato de las reviews si es necesario
    if (results.reviews) {
      if (typeof results.reviews === 'object' && 'reviews' in results.reviews && Array.isArray(results.reviews.reviews)) {
        results.reviews = results.reviews.reviews;
      } else if (!Array.isArray(results.reviews)) {
        console.warn('Formato de reviews inesperado en getAllResults:', results.reviews);
        results.reviews = [];
      }
    }
    
    return results;
  }
};

export default {
  ProductService,
  BotService,
  ReviewService,
  AnalysisService,
  SimulatorService
}; 