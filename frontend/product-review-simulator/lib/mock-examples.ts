import { Product, BotProfile, Review, AnalysisResult } from "./types";

export interface MockSessionData {
  product: Product;
  reviewers: BotProfile[];
  reviews: Review[];
  analysis: AnalysisResult;
}

function demoBot(partial: Record<string, any>): BotProfile {
  return {
    id: partial.id,
    name: partial.name,
    avatar: "",
    bio: partial.bio || "",
    age: partial.age,
    location: partial.location,
    gender: partial.gender,
    education_level: partial.education || partial.education_level || "Universidad",
    personality: {
      introvert_extrovert: partial.traits?.positivity ?? 50,
      analytical_creative: partial.traits?.creative ?? 50,
      busy_free_time: 50,
      disorganized_organized: 50,
      independent_cooperative: 50,
      environmentalist: 40,
      safe_risky: 50,
      tech_novice_expert: partial.traits?.analytical ?? 50,
      price_sensitive_premium: 50,
      brand_loyal_explorer: 50,
      skeptic_enthusiast: 55,
    },
    backstory: partial.bio || "",
    consumer: {
      occupation: partial.occupation || "Profesional",
      income_level: "medium",
      interests: [],
      pain_points: [],
    },
  }
}

function demoReview(partial: Record<string, any>, botId: number): Review {
  return {
    id: partial.id,
    bot_id: botId,
    product_id: 1,
    rating: partial.rating,
    title: partial.title,
    content: partial.review_text || partial.content || "",
    verified_purchase: true,
  }
}

function demoAnalysis(partial: Record<string, any>): AnalysisResult {
  return {
    average_rating: partial.average_rating ?? 4,
    rating_distribution: partial.rating_distribution || [0, 0, 1, 1, 1],
    positive_points: partial.positive_points || [],
    negative_points: partial.negative_points || [],
    keyword_analysis: (partial.keyword_analysis || []).map((k: any) =>
      k.word
        ? k
        : { word: k.topic || "tema", count: k.count || 1, sentiment: k.sentiment >= 60 ? "positive" : k.sentiment >= 40 ? "neutral" : "negative" }
    ),
    demographic_insights: partial.demographic_insights || [],
    market_fit_score: partial.market_fit_score ?? Math.round((partial.average_rating ?? 4) * 20),
    launch_recommendation: partial.launch_recommendation || partial.summary,
  }
}

export const mockExampleSessions: Record<string, MockSessionData> = {
  headphones: {
    product: {
      name: "Auriculares Inalámbricos Pro ANC-X1",
      description:
        "Auriculares premium con cancelación activa de ruido híbrida de 40dB, audio espacial 3D de alta resolución y 40 horas de autonomía de batería. Diseño ergonómico con almohadillas de espuma viscoelástica.",
      price: "$189.99",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
      category: "Electrónica",
      main_features: [
        { feature: "Cancelación de Ruido", value: "ANC híbrida de 40dB con modo transparencia." },
        { feature: "Calidad de Audio", value: "Drivers 40mm Hi-Res y baja latencia." },
        { feature: "Autonomía", value: "Hasta 40h con ANC y carga rápida USB-C." },
      ],
      technical_specs: [
        { spec: "Respuesta de frecuencia", value: "20Hz - 40kHz" },
        { spec: "Conectividad", value: "Bluetooth 5.3 multipunto" },
        { spec: "Micrófonos", value: "6 mics beamforming" },
      ],
    },
    reviewers: [
      demoBot({ id: 1, name: "Sofía Alarcón", age: 24, gender: "Female", location: "Madrid, España", occupation: "Estudiante de Diseño", education: "Universidad", bio: "Apasionada por la música indie y el diseño minimalista.", traits: { analytical: 30, creative: 90, positivity: 80 } }),
      demoBot({ id: 2, name: "Carlos Mendoza", age: 38, gender: "Male", location: "Barcelona, España", occupation: "Ingeniero de Software", education: "Máster", bio: "Audiófilo exigente con rangos de frecuencia y latencia.", traits: { analytical: 95, creative: 25, positivity: 50 } }),
      demoBot({ id: 3, name: "Elena Rivas", age: 29, gender: "Female", location: "Valencia, España", occupation: "Creadora de Contenido", education: "Universidad", bio: "Trabaja en cafeterías ruidosas; necesita aislamiento y buenos mics.", traits: { analytical: 60, creative: 80, positivity: 75 } }),
    ],
    reviews: [
      demoReview({ id: 1, rating: 5, title: "¡Absolutamente hermosos y comodísimos!", review_text: "Me enamoré del diseño mate minimalista. Son ligeros y las almohadillas son como nubes. El ANC me aísla cuando dibujo." }, 1),
      demoReview({ id: 2, rating: 4, title: "Buena firma sonora, app mejorable", review_text: "Respuesta de frecuencia equilibrada. Multipunto OK. La app de EQ se desconecta a veces." }, 2),
      demoReview({ id: 3, rating: 5, title: "La mejor cancelación de ruido que he probado", review_text: "En cafeterías concurridas el ANC apaga el bullicio. En videollamadas me escuchan nítida. Batería brutal." }, 3),
    ],
    analysis: demoAnalysis({
      average_rating: 4.7,
      rating_distribution: [0, 0, 0, 1, 2],
      positive_points: ["ANC muy efectiva", "Comodidad premium", "Batería larga"],
      negative_points: ["App de EQ inestable"],
      market_fit_score: 88,
      summary: "Fuerte product-market fit en comodidad y ANC; iterar en software de control.",
      keyword_analysis: [
        { topic: "Cancelación de Ruido", sentiment: 92, count: 3 },
        { topic: "Comodidad", sentiment: 95, count: 2 },
      ],
    }),
  },
  coffee: {
    product: {
      name: "Cafetera Inteligente Precision Brew",
      description: "Cafetera de goteo programable de 12 tazas con control de temperatura PID, molinillo de muelas cónicas y filtro permanente de acero.",
      price: "$249.99",
      image: "https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?w=500&auto=format&fit=crop&q=60",
      category: "Hogar y Cocina",
      main_features: [
        { feature: "Control PID Digital", value: "Extracción estable a 93°C." },
        { feature: "Molinillo de Muelas", value: "15 niveles de ajuste fino." },
        { feature: "Programación App", value: "Intensidad y horarios vía WiFi." },
      ],
      technical_specs: [
        { spec: "Capacidad", value: "1.8 L (12 tazas)" },
        { spec: "Potencia", value: "1450 W" },
        { spec: "Filtro", value: "Acero inoxidable permanente" },
      ],
    },
    reviewers: [
      demoBot({ id: 1, name: "Andrés Gutiérrez", age: 45, gender: "Male", location: "Sevilla, España", occupation: "Empresario", education: "Universidad", bio: "Amante del café de especialidad y la domótica.", traits: { analytical: 80, creative: 40, positivity: 70 } }),
      demoBot({ id: 2, name: "Lucía Ortiz", age: 31, gender: "Female", location: "Bilbao, España", occupation: "Médica Residente", education: "Máster", bio: "Valora velocidad y facilidad de limpieza por las mañanas.", traits: { analytical: 75, creative: 30, positivity: 60 } }),
      demoBot({ id: 3, name: "Roberto Torres", age: 52, gender: "Male", location: "Zaragoza, España", occupation: "Profesor", education: "Doctorado", bio: "Tradicionalista; le regaló la familia este modelo inteligente.", traits: { analytical: 85, creative: 20, positivity: 40 } }),
    ],
    reviews: [
      demoReview({ id: 1, rating: 5, title: "Café de nivel barista desde la cama", review_text: "Molienda al momento y temperatura PID perfectas. La app de domótica encaja con mi rutina." }, 1),
      demoReview({ id: 2, rating: 4, title: "Muy práctica, aunque ruidosa al moler", review_text: "Programar a las 6AM es un salvavidas. El molinillo despierta a quien duerma ligero." }, 2),
      demoReview({ id: 3, rating: 2, title: "Demasiado compleja y la jarra gotea", review_text: "No necesito WiFi para un café. La jarra gotea al verter rápido. Prefiero la italiana." }, 3),
    ],
    analysis: demoAnalysis({
      average_rating: 3.7,
      rating_distribution: [0, 1, 0, 1, 1],
      positive_points: ["Sabor y temperatura PID", "Programación cómoda"],
      negative_points: ["Ruido del molinillo", "Jarra que gotea", "Complejidad para usuarios clásicos"],
      market_fit_score: 62,
      summary: "Encaje medio-alto en early adopters; riesgo con compradores tradicionales. Iterar jarra y ruido.",
    }),
  },
  smartwatch: {
    product: {
      name: "Reloj Inteligente FitTrack Elite",
      description: "Smartwatch deportivo premium con AMOLED Always-On, GPS multisistema, PPG y 5 ATM.",
      price: "$159.99",
      image: "https://images.unsplash.com/photo-1517502884422-41eaaced0168?w=500&auto=format&fit=crop&q=60",
      category: "Accesorios Deportivos",
      main_features: [
        { feature: "Pantalla AMOLED", value: "Always-On legible al sol." },
        { feature: "GPS Multisistema", value: "Rutas sin móvil." },
        { feature: "Sensores de Salud", value: "FC, SpO2, estrés y sueño." },
      ],
      technical_specs: [
        { spec: "Batería", value: "Hasta 10 días uso típico" },
        { spec: "Resistencia", value: "5 ATM" },
        { spec: "Sensores", value: "Giroscopio, acelerómetro, barómetro" },
      ],
    },
    reviewers: [
      demoBot({ id: 1, name: "María José Castillo", age: 27, gender: "Female", location: "Málaga, España", occupation: "Entrenadora Personal", education: "Universidad", bio: "Atleta de triatlón, obsesionada con métricas y GPS.", traits: { analytical: 90, creative: 35, positivity: 75 } }),
      demoBot({ id: 2, name: "Diego Ruiz", age: 34, gender: "Male", location: "Madrid, España", occupation: "Consultor de Negocios", education: "Máster", bio: "Quiere batería larga y notificaciones elegantes.", traits: { analytical: 70, creative: 50, positivity: 85 } }),
      demoBot({ id: 3, name: "Carla Navarro", age: 22, gender: "Female", location: "Sevilla, España", occupation: "Estudiante de Medicina", education: "Universidad", bio: "Monitorea sueño y estrés en exámenes.", traits: { analytical: 80, creative: 60, positivity: 70 } }),
    ],
    reviews: [
      demoReview({ id: 1, rating: 4, title: "GPS excelente, app deportiva básica", review_text: "GPS de doble banda clava las curvas. AMOLED perfecta al sol. Falta análisis avanzado de zonas FC en la app." }, 1),
      demoReview({ id: 2, rating: 5, title: "La batería dura una eternidad", review_text: "9-10 días por carga con notificaciones a diario. Elegante en la oficina y resistente." }, 2),
      demoReview({ id: 3, rating: 5, title: "Monitor de sueño y estrés real", review_text: "El sensor de estrés y la puntuación de sueño reflejan cómo me siento. Cómodo para dormir." }, 3),
    ],
    analysis: demoAnalysis({
      average_rating: 4.7,
      rating_distribution: [0, 0, 0, 1, 2],
      positive_points: ["Batería de hasta 10 días", "AMOLED y GPS precisos", "Bienestar y sueño"],
      negative_points: ["App poco profunda para atletas pro"],
      market_fit_score: 90,
      summary: "Listo para lanzamiento en lifestyle/fitness; reforzar app si se apunta a pro.",
    }),
  },
};
