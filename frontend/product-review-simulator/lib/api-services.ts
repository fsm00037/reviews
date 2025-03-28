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
      console.log('Respuesta original del API en phase4:', response);
      
      // Si la respuesta es una cadena, intentar parsearla
      if (typeof response === 'string') {
        try {
          console.log('La respuesta del API es una cadena, intentando parsear');
          response = JSON.parse(response);
        } catch (error) {
          console.error('Error al parsear la respuesta:', error);
          // Si falla el parsing, devolver un objeto con estructura mínima
          return {
            average_rating: 0,
            rating_distribution: [0, 0, 0, 0, 0],
            positive_points: [],
            negative_points: [],
            keyword_analysis: [],
            demographic_insights: []
          };
        }
      }
      
      // Verificar si la respuesta es válida
      if (typeof response === 'object' && response !== null) {
        // Asegurarse de que todos los campos son serializables
        const safeResponse: any = {};
        
        // Copiar solo los campos que sabemos que son seguros
        if ('average_rating' in response) safeResponse.average_rating = Number(response.average_rating);
        
        // Asegurar que rating_distribution sea un array de 5 elementos
        if ('rating_distribution' in response) {
          if (Array.isArray(response.rating_distribution)) {
            // Asegurar que hay exactamente 5 elementos
            const distribution = [...response.rating_distribution];
            while (distribution.length < 5) {
              distribution.push(0);
            }
            // Tomar solo los primeros 5 elementos si hay más
            safeResponse.rating_distribution = distribution.slice(0, 5).map(Number);
          } else {
            // Si no es un array, crear uno por defecto
            safeResponse.rating_distribution = [0, 0, 0, 0, 0];
          }
        } else {
          safeResponse.rating_distribution = [0, 0, 0, 0, 0];
        }
        
        // Asegurar que los arrays de puntos son arrays
        if ('positive_points' in response && Array.isArray(response.positive_points)) {
          safeResponse.positive_points = response.positive_points;
        } else {
          safeResponse.positive_points = [];
        }
        
        if ('negative_points' in response && Array.isArray(response.negative_points)) {
          safeResponse.negative_points = response.negative_points;
        } else {
          safeResponse.negative_points = [];
        }
        
        // Asegurar que keyword_analysis sea un array válido
        if ('keyword_analysis' in response && Array.isArray(response.keyword_analysis)) {
          safeResponse.keyword_analysis = response.keyword_analysis.map((keyword: any) => ({
            word: keyword.word || "",
            count: Number(keyword.count || 0),
            sentiment: keyword.sentiment || "neutral"
          }));
        } else {
          safeResponse.keyword_analysis = [];
        }
        
        // Asegurar que demographic_insights sea un array
        if ('demographic_insights' in response && Array.isArray(response.demographic_insights)) {
          safeResponse.demographic_insights = response.demographic_insights;
        } else {
          safeResponse.demographic_insights = [];
        }
        
        console.log('Respuesta normalizada:', safeResponse);
        return safeResponse;
      }
      
      // Si no es un objeto, devolver un objeto con estructura mínima
      console.warn('Respuesta no válida del API, devolviendo estructura mínima');
      return {
        average_rating: 0,
        rating_distribution: [0, 0, 0, 0, 0],
        positive_points: [],
        negative_points: [],
        keyword_analysis: [],
        demographic_insights: []
      };
    });
  },
  
  // Obtener análisis actual
  getAnalysis: () => {
    return fetchAPI<any>('/analysis').then(response => {
      console.log('Respuesta original del API en getAnalysis:', response);
      
      // Si la respuesta es una cadena, intentar parsearla
      if (typeof response === 'string') {
        try {
          console.log('La respuesta del API es una cadena, intentando parsear');
          response = JSON.parse(response);
        } catch (error) {
          console.error('Error al parsear la respuesta:', error);
          // Si falla el parsing, devolver un objeto con estructura mínima
          return {
            average_rating: 0,
            rating_distribution: [0, 0, 0, 0, 0],
            positive_points: [],
            negative_points: [],
            keyword_analysis: [],
            demographic_insights: []
          };
        }
      }
      
      // Verificar si la respuesta es válida
      if (typeof response === 'object' && response !== null) {
        // Asegurarse de que todos los campos son serializables
        const safeResponse: any = {};
        
        // Copiar solo los campos que sabemos que son seguros
        if ('average_rating' in response) safeResponse.average_rating = Number(response.average_rating);
        
        // Asegurar que rating_distribution sea un array de 5 elementos
        if ('rating_distribution' in response) {
          if (Array.isArray(response.rating_distribution)) {
            // Asegurar que hay exactamente 5 elementos
            const distribution = [...response.rating_distribution];
            while (distribution.length < 5) {
              distribution.push(0);
            }
            // Tomar solo los primeros 5 elementos si hay más
            safeResponse.rating_distribution = distribution.slice(0, 5).map(Number);
          } else {
            // Si no es un array, crear uno por defecto
            safeResponse.rating_distribution = [0, 0, 0, 0, 0];
          }
        } else {
          safeResponse.rating_distribution = [0, 0, 0, 0, 0];
        }
        
        // Asegurar que los arrays de puntos son arrays
        if ('positive_points' in response && Array.isArray(response.positive_points)) {
          safeResponse.positive_points = response.positive_points;
        } else {
          safeResponse.positive_points = [];
        }
        
        if ('negative_points' in response && Array.isArray(response.negative_points)) {
          safeResponse.negative_points = response.negative_points;
        } else {
          safeResponse.negative_points = [];
        }
        
        // Asegurar que keyword_analysis sea un array válido
        if ('keyword_analysis' in response && Array.isArray(response.keyword_analysis)) {
          safeResponse.keyword_analysis = response.keyword_analysis.map((keyword: any) => ({
            word: keyword.word || "",
            count: Number(keyword.count || 0),
            sentiment: keyword.sentiment || "neutral"
          }));
        } else {
          safeResponse.keyword_analysis = [];
        }
        
        // Asegurar que demographic_insights sea un array
        if ('demographic_insights' in response && Array.isArray(response.demographic_insights)) {
          safeResponse.demographic_insights = response.demographic_insights;
        } else {
          safeResponse.demographic_insights = [];
        }
        
        return safeResponse;
      }
      
      // Si no es un objeto, devolver un objeto con estructura mínima
      console.warn('Respuesta no válida del API, devolviendo estructura mínima');
      return {
        average_rating: 0,
        rating_distribution: [0, 0, 0, 0, 0],
        positive_points: [],
        negative_points: [],
        keyword_analysis: [],
        demographic_insights: []
      };
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