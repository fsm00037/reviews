import { Product, BotProfile, Review, AnalysisResult } from "./types";

export interface MockSessionData {
  product: Product;
  reviewers: BotProfile[];
  reviews: Review[];
  analysis: AnalysisResult;
}

export const mockExampleSessions: Record<string, MockSessionData> = {
  "headphones": {
    product: {
      name: "Auriculares Inalámbricos Pro ANC-X1",
      description: "Auriculares premium con cancelación activa de ruido híbrida de 40dB, audio espacial 3D de alta resolución y 40 horas de autonomía de batería. Diseño ergonómico con almohadillas de espuma viscoelástica.",
      price: "$189.99",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
      category: "Electrónica",
      main_features: [
        { feature: "Cancelación de Ruido", value: "Cancelación activa de ruido híbrida de 40dB con modo de transparencia ambiental inteligente." },
        { feature: "Calidad de Audio", value: "Drivers dinámicos de 40mm con certificación Hi-Res Audio y soporte para códecs de ultra baja latencia." },
        { feature: "Autonomía", value: "Hasta 40 horas de reproducción continua con ANC activado y carga rápida USB-C de 10 minutos para 5 horas." }
      ],
      technical_specs: [
        { spec: "Respuesta de frecuencia", value: "20Hz - 40kHz" },
        { spec: "Conectividad", value: "Bluetooth 5.3 con emparejamiento multipunto a dos dispositivos" },
        { spec: "Micrófonos", value: "Sistema de 6 micrófonos beamforming para cancelación avanzada de viento en llamadas" }
      ]
    },
    reviewers: [
      { id: 1, name: "Sofía Alarcón", age: 24, gender: "Female", location: "Madrid, España", occupation: "Estudiante de Diseño", education: "Universidad", bio: "Apasionada por la música indie y el diseño minimalista. Valora la estética y la comodidad por encima de todo.", traits: { analytical: 30, creative: 90, positivity: 80 } },
      { id: 2, name: "Carlos Mendoza", age: 38, gender: "Male", location: "Barcelona, España", occupation: "Ingeniero de Software", education: "Máster", bio: "Melómano audiófilo exigente con los rangos de frecuencia y la latencia. Siempre compara especificaciones técnicas.", traits: { analytical: 95, creative: 25, positivity: 50 } },
      { id: 3, name: "Elena Rivas", age: 29, gender: "Female", location: "Valencia, España", occupation: "Creadora de Contenido", education: "Universidad", bio: "Trabaja en cafeterías ruidosas. Necesita aislamiento acústico absoluto y micrófonos excelentes para llamadas y directos.", traits: { analytical: 60, creative: 80, positivity: 75 } }
    ],
    reviews: [
      {
        id: 1,
        reviewer_name: "Sofía Alarcón",
        rating: 5,
        title: "¡Absolutamente hermosos y comodísimos!",
        review_text: "Me enamoré del diseño mate minimalista desde que los saqué de la caja. Son súper ligeros y las almohadillas son como nubes para las orejas; no me duelen nada después de llevarlos toda la tarde en la universidad. El sonido es muy envolvente y dinámico. La cancelación de ruido me aísla por completo cuando estoy dibujando. ¡Los recomiendo muchísimo si te importa el diseño y la comodidad!",
        sentiment: "positive",
        created_at: "2026-07-09T18:30:00Z"
      },
      {
        id: 2,
        reviewer_name: "Carlos Mendoza",
        rating: 4,
        title: "Buena firma sonora, pero la app móvil es mejorable",
        review_text: "Desde el punto de vista puramente técnico, la respuesta en frecuencia de los drivers de 40mm es bastante equilibrada, con graves profundos pero que no ahogan los medios. La compatibilidad con Bluetooth multipunto funciona correctamente al alternar entre el portátil y el móvil. Sin embargo, la ecualización fina requiere usar su aplicación oficial, la cual sufre de desconexiones esporádicas. Por lo demás, la cancelación de ruido cumple su cometido eficazmente.",
        sentiment: "neutral",
        created_at: "2026-07-09T19:45:00Z"
      },
      {
        id: 3,
        reviewer_name: "Elena Rivas",
        rating: 5,
        title: "La mejor cancelación de ruido que he probado",
        review_text: "Trabajo editando vídeo y haciendo streamings en cafeterías concurridas y estos auriculares me han salvado la vida. La cancelación activa de ruido apaga por completo el bullicio del fondo de forma mágica. Hice varias videollamadas con clientes y me comentan que me escuchan súper nítida a pesar del ruido ambiente gracias a los micrófonos. La batería dura una eternidad, llevo 3 días sin cargarlos y siguen al 60%. Excelente compra.",
        sentiment: "positive",
        created_at: "2026-07-09T20:15:00Z"
      }
    ],
    analysis: {
      summary: "Los Auriculares Inalámbricos Pro ANC-X1 reciben comentarios sumamente positivos, destacando la comodidad premium y la alta efectividad de su cancelación activa de ruido de 40dB. Los usuarios valoran significativamente su diseño minimalista y la excepcional duración de batería para el trabajo prolongado. Sin embargo, se identifican áreas críticas de mejora en la estabilidad de la aplicación móvil complementaria de ecualización.",
      positive_points: [
        "Cancelación de ruido (ANC) altamente efectiva en entornos concurridos como cafeterías o transporte público.",
        "Comodidad excelente gracias a las almohadillas de espuma viscoelástica y diseño ergonómico ligero.",
        "Batería de larga duración con capacidad de carga rápida muy eficiente."
      ],
      negative_points: [
        "Inestabilidad y desconexiones esporádicas en la aplicación móvil necesaria para personalizar la ecualización.",
        "El ecualizador por defecto puede resultar un poco neutro para amantes de graves hiper-potenciados."
      ],
      rating_distribution: [0, 0, 0, 1, 2], // 1 de 4 estrellas, 2 de 5 estrellas
      sentiment_distribution: { positive: 67, neutral: 33, negative: 0 },
      key_topics: [
        { topic: "Cancelación de Ruido", sentiment: 92, count: 3 },
        { topic: "Comodidad / Ergonomía", sentiment: 95, count: 2 },
        { topic: "Aplicación de Control", sentiment: 40, count: 1 }
      ],
      average_rating: 4.7
    }
  },
  "coffee": {
    product: {
      name: "Cafetera Inteligente Precision Brew",
      description: "Cafetera de goteo programable de 12 tazas con control de temperatura PID preciso mediante App, molinillo de muelas cónicas integrado y filtro permanente de acero.",
      price: "$249.99",
      image: "https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?w=500&auto=format&fit=crop&q=60",
      category: "Hogar y Cocina",
      main_features: [
        { feature: "Control PID Digital", value: "Mantiene la temperatura de extracción a 93°C estables para optimizar el aroma." },
        { feature: "Molinillo de Muelas", value: "Molinillo cónico de acero inoxidable integrado con 15 niveles de ajuste fino." },
        { feature: "Programación App", value: "Ajuste de intensidad, hora de inicio automático y control de mantenimiento de calor vía WiFi." }
      ],
      technical_specs: [
        { spec: "Capacidad de la Jarra", value: "Jarra de vidrio borosilicato de 1.8 Litros (12 tazas)" },
        { spec: "Potencia Eléctrica", value: "1450 Vatios para calentamiento rápido" },
        { spec: "Tipo de Filtro", value: "Filtro permanente de malla metálica de acero inoxidable" }
      ]
    },
    reviewers: [
      { id: 1, name: "Andrés Gutiérrez", age: 45, gender: "Male", location: "Sevilla, España", occupation: "Empresario", education: "Universidad", bio: "Amante del buen café espresso y de filtro de especialidad. Le gusta programar todo en su hogar domótico.", traits: { analytical: 80, creative: 40, positivity: 70 } },
      { id: 2, name: "Lucía Ortiz", age: 31, gender: "Female", location: "Bilbao, España", occupation: "Médica Residente", education: "Máster", bio: "Necesita mucho café por las mañanas y valora la velocidad y la facilidad de limpieza antes de irse al hospital.", traits: { analytical: 75, creative: 30, positivity: 60 } },
      { id: 3, name: "Roberto Torres", age: 52, gender: "Male", location: "Zaragoza, España", occupation: "Profesor", education: "Doctorado", bio: "Tradicionalista con el café. Prefiere la cafetera italiana tradicional pero su familia le regaló este modelo inteligente.", traits: { analytical: 85, creative: 20, positivity: 40 } }
    ],
    reviews: [
      {
        id: 1,
        reviewer_name: "Andrés Gutiérrez",
        rating: 5,
        title: "Café de nivel barista programado desde la cama",
        review_text: "Esta cafetera ha cambiado mi rutina de las mañanas. El café molido al momento con las muelas cónicas huele increíble por toda la casa antes de levantarme. La integración con la app de domótica es perfecta: puedo configurar la temperatura a 93°C exactos y la intensidad al máximo. El sabor del café de especialidad sale súper limpio, sin amargura excesiva. Vale cada céntimo que cuesta.",
        sentiment: "positive",
        created_at: "2026-07-08T07:20:00Z"
      },
      {
        id: 2,
        reviewer_name: "Lucía Ortiz",
        rating: 4,
        title: "Muy práctica para el día a día, aunque hace ruido al moler",
        review_text: "Como médica residente, mi tiempo por las mañanas es mínimo. Que muela y prepare el café automáticamente a las 6:00 AM es fantástico. La limpieza del filtro de acero es rápida. Lo único negativo es que el molinillo integrado hace bastante ruido al triturar el grano, lo suficiente para despertar a mis compañeros de piso si duermen ligero. Dejando eso de lado, el sabor del café es excelente.",
        sentiment: "positive",
        created_at: "2026-07-08T08:10:00Z"
      },
      {
        id: 3,
        reviewer_name: "Roberto Torres",
        rating: 2,
        title: "Demasiado compleja y la jarra gotea al servir",
        review_text: "Francamente, considero innecesario que una cafetera de goteo requiera conectarse al WiFi para sacarle partido. Las instrucciones de la pantalla táctil son confusas y la aplicación da errores si el router está en otra habitación. Además, el diseño del pico de la jarra de vidrio tiene un defecto: si intentas verter el café rápido, gotea y mancha la encimera. Prefiero el método tradicional italiano.",
        sentiment: "negative",
        created_at: "2026-07-08T09:30:00Z"
      }
    ],
    analysis: {
      summary: "La Cafetera Inteligente Precision Brew obtiene valoraciones mayoritariamente positivas por su excelente calidad de extracción, consistencia de sabor y conveniencia del molinillo integrado. No obstante, genera fricciones por el nivel de ruido del molinillo y la complejidad del software en usuarios tradicionales, sumado a un detalle de diseño en el vertido de la jarra.",
      positive_points: [
        "Calidad del sabor superior gracias a la molienda al instante y al control preciso de temperatura PID.",
        "Programación inteligente altamente conveniente para automatizar las mañanas."
      ],
      negative_points: [
        "El molinillo integrado emite un nivel de ruido elevado que puede resultar molesto a primera hora.",
        "La jarra de vidrio tiende a gotear ligeramente si se inclina con rapidez al servir.",
        "Curva de aprendizaje elevada para usuarios que prefieren interfaces analógicas tradicionales."
      ],
      rating_distribution: [0, 1, 0, 1, 1], // 1 de 2 estrellas, 1 de 4 estrellas, 1 de 5 estrellas
      sentiment_distribution: { positive: 67, neutral: 0, negative: 33 },
      key_topics: [
        { topic: "Sabor del Café", sentiment: 95, count: 2 },
        { topic: "Molinillo (Ruido)", sentiment: 45, count: 1 },
        { topic: "Facilidad de Uso (App)", sentiment: 50, count: 2 }
      ],
      average_rating: 3.7
    }
  },
  "smartwatch": {
    product: {
      name: "Reloj Inteligente FitTrack Elite",
      description: "Smartwatch deportivo premium con pantalla AMOLED Always-On de 1.43 pulgadas, sensor GPS multisistema, monitor continuo de ritmo cardíaco PPG, SpO2 y resistencia al agua de 5 ATM.",
      price: "$159.99",
      image: "https://images.unsplash.com/photo-1517502884422-41eaaced0168?w=500&auto=format&fit=crop&q=60",
      category: "Accesorios Deportivos",
      main_features: [
        { feature: "Pantalla AMOLED", value: "Pantalla Always-On AMOLED nítida y brillante incluso bajo la luz directa del sol." },
        { feature: "GPS Multisistema", value: "GPS de doble banda de alta precisión para registrar rutas de running y ciclismo sin llevar el móvil." },
        { feature: "Sensores de Salud", value: "Medición en tiempo real de frecuencia cardíaca, SpO2, niveles de estrés y fases del sueño profundo." }
      ],
      technical_specs: [
        { spec: "Autonomía de Batería", value: "Hasta 10 días de duración con uso típico, 24 horas continuas de tracking GPS" },
        { spec: "Resistencia al Agua", value: "Certificación 5 ATM (apto para natación y duchas)" },
        { spec: "Sensores incorporados", value: "Giroscopio de 3 ejes, acelerómetro, barómetro y sensor de luz ambiental" }
      ]
    },
    reviewers: [
      { id: 1, name: "María José Castillo", age: 27, gender: "Female", location: "Málaga, España", occupation: "Entrenadora Personal", education: "Universidad", bio: "Atleta de triatlón apasionada por las métricas de rendimiento y la precisión de posicionamiento satelital.", traits: { analytical: 90, creative: 35, positivity: 75 } },
      { id: 2, name: "Diego Ruiz", age: 34, gender: "Male", location: "Madrid, España", occupation: "Consultor de Negocios", education: "Máster", bio: "Lleva un estilo de vida ajetreado. Busca un smartwatch elegante que dure muchos días sin cargar y reciba notificaciones.", traits: { analytical: 70, creative: 50, positivity: 85 } },
      { id: 3, name: "Carla Navarro", age: 22, gender: "Female", location: "Sevilla, España", occupation: "Estudiante de Medicina", education: "Universidad", bio: "Interesada en los aspectos de bienestar, monitoreo del sueño y control de estrés durante las épocas de exámenes.", traits: { analytical: 80, creative: 60, positivity: 70 } }
    ],
    reviews: [
      {
        id: 1,
        reviewer_name: "María José Castillo",
        rating: 4,
        title: "GPS de excelente precisión, pero la app deportiva carece de análisis avanzado",
        review_text: "He probado el GPS en mis rutas de running habituales y la precisión de la doble banda es asombrosa, clava las curvas y distancias sin desviaciones. La pantalla AMOLED se ve de maravilla corriendo bajo el sol de Málaga. Mi única queja es que la aplicación móvil complementaria es un poco básica si quieres analizar tus zonas de entrenamiento cardíaco en detalle. Aun así, por este precio, el hardware es imbatible.",
        sentiment: "positive",
        created_at: "2026-07-07T11:15:00Z"
      },
      {
        id: 2,
        reviewer_name: "Diego Ruiz",
        rating: 5,
        title: "La batería dura una eternidad, diseño elegante",
        review_text: "Lo que más detestaba de los smartwatches era tener que cargarlos a diario. Con el FitTrack Elite me olvido por completo; me dura fácilmente 9 o 10 días por carga completa recibiendo decenas de correos y notificaciones al día. El cristal de la pantalla es ultra resistente, ya le he dado varios golpes accidentales en la oficina y sigue intacto. Muy elegante para vestir formal también.",
        sentiment: "positive",
        created_at: "2026-07-07T13:40:00Z"
      },
      {
        id: 3,
        reviewer_name: "Carla Navarro",
        rating: 5,
        title: "El monitor de sueño y estrés funciona de verdad",
        review_text: "Compré este reloj principalmente para controlar mi salud en épocas de exámenes. El sensor de estrés me ayuda a darme cuenta de cuándo debo pausar y hacer respiraciones guiadas. Además, la puntuación de calidad del sueño es súper exacta, refleja exactamente cómo me siento al levantarme. Es súper cómodo para dormir porque no pesa nada. ¡Me encanta!",
        sentiment: "positive",
        created_at: "2026-07-07T15:00:00Z"
      }
    ],
    analysis: {
      summary: "El Reloj Inteligente FitTrack Elite destaca como una excelente opción de alto rendimiento deportivo y de bienestar. Los usuarios elogian con entusiasmo la duración de la batería de hasta 10 días, la nitidez de su pantalla AMOLED y el posicionamiento preciso del GPS. Las únicas críticas se centran en la simplicidad de la aplicación móvil de análisis para usuarios sumamente técnicos.",
      positive_points: [
        "Batería excepcional de hasta 10 días que elimina la necesidad de recargas diarias.",
        "Pantalla AMOLED de alta resolución con brillo excelente y lectura perfecta bajo luz solar.",
        "GPS de doble banda de alta precisión y velocidad de conexión satelital."
      ],
      negative_points: [
        "La aplicación móvil complementaria carece de análisis avanzado de rendimiento deportivo para atletas profesionales."
      ],
      rating_distribution: [0, 0, 0, 1, 2], // 1 de 4 estrellas, 2 de 5 estrellas
      sentiment_distribution: { positive: 100, neutral: 0, negative: 0 },
      key_topics: [
        { topic: "Duración de Batería", sentiment: 98, count: 2 },
        { topic: "GPS / Precisión de Ruta", sentiment: 92, count: 1 },
        { topic: "Pantalla & Visualización", sentiment: 96, count: 1 }
      ],
      average_rating: 4.7
    }
  }
};
