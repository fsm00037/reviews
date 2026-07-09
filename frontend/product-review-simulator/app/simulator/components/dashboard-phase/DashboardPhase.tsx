import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  BarChart3,
  Sparkles,
  Star,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Users,
  Zap,
  Check,
  Rocket,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Target,
  Megaphone,
  Wrench,
  ShieldCheck,
  PackageOpen,
} from "lucide-react";
import { Product, AnalysisResult, KeywordAnalysis } from "@/lib/types";
import { getSessionId, ImprovementService } from "@/lib/api-services";

// ── Parser de secciones del informe de mejora ────────────────────────────
interface ImprovementCard {
  title: string;
  bullets: string[];
  rawEmoji: string;
}

const CARD_COLORS = [
  { bg: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-200 dark:border-indigo-900", badge: "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300", dot: "bg-indigo-400" },
  { bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-900", badge: "bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300", dot: "bg-purple-400" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-900", badge: "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300", dot: "bg-emerald-400" },
  { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-900", badge: "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300", dot: "bg-amber-400" },
  { bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-900", badge: "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300", dot: "bg-rose-400" },
  { bg: "bg-cyan-50 dark:bg-cyan-950/30", border: "border-cyan-200 dark:border-cyan-900", badge: "bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-300", dot: "bg-cyan-400" },
];

function parseSections(markdown: string): ImprovementCard[] {
  if (!markdown) return [];
  const lines = markdown.split("\n");
  const sections: ImprovementCard[] = [];
  let current: ImprovementCard | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    // Detectar cabeceras ##, ###, ####
    if (/^#{1,4}\s/.test(line)) {
      if (current && current.bullets.length > 0) sections.push(current);
      const title = line.replace(/^#+\s+/, "").replace(/[*_`]/g, "").trim();
      const emojiMatch = title.match(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/u);
      current = { title, bullets: [], rawEmoji: emojiMatch ? emojiMatch[0] : "" };
    } else if (/^[-*+]\s/.test(line) && current) {
      const bullet = line.replace(/^[-*+]\s+/, "").replace(/\*\*([^*]+)\*\*/g, "$1").trim();
      if (bullet) current.bullets.push(bullet);
    } else if (/^\d+\.\s/.test(line) && current) {
      const bullet = line.replace(/^\d+\.\s+/, "").replace(/\*\*([^*]+)\*\*/g, "$1").trim();
      if (bullet) current.bullets.push(bullet);
    }
  }
  if (current && current.bullets.length > 0) sections.push(current);
  return sections;
}

function ImprovementsGrid({ text }: { text: string }) {
  const sections = parseSections(text);
  if (sections.length === 0) return (
    <p className="text-sm text-gray-400 text-center py-8">No hay propuestas disponibles aún.</p>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {sections.map((section, idx) => {
        const c = CARD_COLORS[idx % CARD_COLORS.length];
        const top3 = section.bullets.slice(0, 3);
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
            className={`rounded-2xl border ${c.border} ${c.bg} p-4 flex flex-col gap-3`}
          >
            {/* Header */}
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none mt-0.5 flex-shrink-0">
                {section.rawEmoji || "💡"}
              </span>
              <p className={`text-[11px] font-bold uppercase tracking-wide leading-tight ${c.badge.split(" ").slice(-2).join(" ")} break-words`}>
                {section.title.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, "")}
              </p>
            </div>
            {/* Bullets */}
            <ul className="space-y-2">
              {top3.map((b, bIdx) => (
                <li key={bIdx} className="flex items-start gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot} mt-1.5 flex-shrink-0`} />
                  <span className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{b}</span>
                </li>
              ))}
            </ul>
            {section.bullets.length > 3 && (
              <span className={`text-[10px] font-semibold ${c.badge.split(" ").slice(-2).join(" ")} self-start px-1.5 py-0.5 rounded-full`}>
                +{section.bullets.length - 3} más
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}


interface DashboardPhaseProps {
  product: Product;
  analysisResult: AnalysisResult;
  setActiveStep: (step: number) => void;
  setBots: (bots: any[]) => void;
  setReviews: (reviews: any[]) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  demographics: any;
}

// Componente para gráfico de barras de calificaciones
const RatingBarChart = ({ distribution }: { distribution: number[] | any }) => {
  // Asegurarse de que la distribución sea un array válido de longitud 5
  const safeDistribution = React.useMemo(() => {
    // Si es un array, procesarlo como antes
    if (Array.isArray(distribution)) {
      // Si la longitud es 5, usar el array tal cual
      if (distribution.length === 5) {
        return distribution;
      }
      
      // Si la longitud es diferente de 5, crear un nuevo array con ceros
      const result = [0, 0, 0, 0, 0];
      
      // Copiar los valores disponibles (asegurándonos de no exceder los límites)
      for (let i = 0; i < Math.min(distribution.length, 5); i++) {
        result[i] = typeof distribution[i] === 'number' ? distribution[i] : 0;
      }
      
      return result;
    } 
    // Si es un objeto con formato RatingDistribution, convertirlo a array
    else if (distribution && typeof distribution === 'object') {
      // Comprobar si tiene las propiedades del formato RatingDistribution
      if ('one_star' in distribution || 
          'two_stars' in distribution || 
          'three_stars' in distribution || 
          'four_stars' in distribution || 
          'five_stars' in distribution) {
        // Crear array donde el índice 0 = one_star, índice 1 = two_stars, etc.
        return [
          Number(distribution.one_star || 0),
          Number(distribution.two_stars || 0),
          Number(distribution.three_stars || 0),
          Number(distribution.four_stars || 0),
          Number(distribution.five_stars || 0)
        ];
      }
    }
    
    // Si no es ni array ni objeto válido, devolver zeros
    return [0, 0, 0, 0, 0];
  }, [distribution]);
    
  const total = safeDistribution.reduce((sum, count) => sum + count, 0) || 1;  // Evitar división por cero
  const percentages = safeDistribution.map((count) => total > 0 ? (count / total) * 100 : 0);

  return (
    <div className="space-y-3">
      {[5, 4, 3, 2, 1].map((stars, index) => {
        // El valor en el array es: índice 0 = one_star, índice 4 = five_stars
        // Así que para 5 estrellas queremos safeDistribution[4], para 4 estrellas safeDistribution[3], etc.
        const arrayIndex = stars - 1;
        
        return (
          <div key={stars} className="flex items-center gap-2">
            <div className="w-8 text-right font-medium">{stars}★</div>
            <div className="flex-1">
              <div className="h-5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentages[arrayIndex]}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                />
              </div>
            </div>
            <div className="w-16 text-sm text-gray-500 dark:text-gray-400">
              {safeDistribution[arrayIndex] || 0} ({(percentages[arrayIndex] || 0).toFixed(0)}%)
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Componente para gráfico circular de sentimiento
const SentimentPieChart = ({ reviewsCount = { positive: 0, neutral: 0, negative: 0 } }) => {
  const { positive, neutral, negative } = reviewsCount;
  const total = positive + neutral + negative || 1; // Evitar división por cero

  const positivePercent = total > 0 ? (positive / total) * 100 : 0;
  const neutralPercent = total > 0 ? (neutral / total) * 100 : 0;
  const negativePercent = total > 0 ? (negative / total) * 100 : 0;

  // Calcular ángulos para el gráfico circular (en radianes)
  const positiveAngle = (positive / total) * 2 * Math.PI;
  const neutralAngle = (neutral / total) * 2 * Math.PI;
  const negativeAngle = (negative / total) * 2 * Math.PI;

  // Calcular coordenadas para los sectores del gráfico
  const calculateCoordinates = (startAngle: number, endAngle: number) => {
    const startX = 50 + 40 * Math.sin(startAngle);
    const startY = 50 - 40 * Math.cos(startAngle);
    const endX = 50 + 40 * Math.sin(endAngle);
    const endY = 50 - 40 * Math.cos(endAngle);
    
    // Para arcos largos (> 180 grados)
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
    
    return {
      path: `M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`,
      startX,
      startY,
      endX,
      endY
    };
  };

  // Calcular los sectores
  const positiveSector = calculateCoordinates(0, positiveAngle);
  const neutralSector = calculateCoordinates(positiveAngle, positiveAngle + neutralAngle);
  const negativeSector = calculateCoordinates(positiveAngle + neutralAngle, 2 * Math.PI);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Círculo base (fondo) */}
          <circle cx="50" cy="50" r="40" fill="#f0f0f0" className="dark:fill-gray-800" />
          
          {/* Sector negativo */}
          {negative > 0 && (
            <motion.path
              d={negativeSector.path}
              fill="#f87171" // rojo
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          )}
          
          {/* Sector neutral */}
          {neutral > 0 && (
            <motion.path
              d={neutralSector.path}
              fill="#fbbf24" // amarillo
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            />
          )}
          
          {/* Sector positivo */}
          {positive > 0 && (
            <motion.path
              d={positiveSector.path}
              fill="#4ade80" // verde
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            />
          )}

          {/* Círculo central */}
          <circle cx="50" cy="50" r="25" fill="white" className="dark:fill-gray-900" />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-2xl font-bold">{positivePercent.toFixed(0)}%</span>
          <span className="text-xs text-gray-500">Positivas</span>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span className="text-xs">Positivas ({positive})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
          <span className="text-xs">Neutrales ({neutral})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          <span className="text-xs">Negativas ({negative})</span>
        </div>
      </div>
    </div>
  );
};

// Componente para nube de palabras clave
const KeywordCloud = ({ keywords }: { keywords: KeywordAnalysis[] }) => {
  // Verificar si keywords es un array válido
  const safeKeywords = Array.isArray(keywords) ? keywords : [];
  
  return (
    <div className="flex flex-wrap justify-center gap-2 p-4">
      {safeKeywords.length > 0 ? (
        safeKeywords.map((keyword, index) => {
          const fontSize = 0.8 + ((keyword.count || 1) / 5) * 0.2 // Escala de 0.8 a 1.2rem
          const color =
            keyword.sentiment === "positive"
              ? "text-green-500 dark:text-green-400"
              : keyword.sentiment === "negative"
                ? "text-red-500 dark:text-red-400"
                : "text-gray-500 dark:text-gray-400"

          return (
            <motion.span
              key={keyword.word || index}
              className={`${color} font-medium px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700`}
              style={{ fontSize: `${fontSize}rem` }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              {keyword.word || ""}
              {keyword.count ? ` (${keyword.count})` : ""}
            </motion.span>
          )
        })
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No hay palabras clave disponibles</p>
      )}
    </div>
  );
};


export const DashboardPhase: React.FC<DashboardPhaseProps> = ({
  product,
  analysisResult,
  setActiveStep,
  setBots,
  setReviews,
  setAnalysisResult,
  demographics,
}) => {
  const [activeTab, setActiveTab] = useState<"metrics" | "improvements">("metrics");
  const [improvements, setImprovements] = useState<string>("");
  const [improvementsLoading, setImprovementsLoading] = useState(false);

  // States for creating improved child product
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [createdProductSession, setCreatedProductSession] = useState<string | null>(null);
  const [createdProductName, setCreatedProductName] = useState<string>("");
  const [createError, setCreateError] = useState<string>("");

  const fetchImprovements = async () => {
    if (improvements) return;
    setImprovementsLoading(true);
    try {
      const sessionId = getSessionId();
      const res = await ImprovementService.getImprovements(sessionId);
      if (res && res.improvements) {
        setImprovements(res.improvements);
      }
    } catch (e) {
      console.error("Error loading improvements:", e);
    } finally {
      setImprovementsLoading(false);
    }
  };

  const handleCreateImprovedProduct = async () => {
    setCreatingProduct(true);
    setCreateError("");
    try {
      const sessionId = getSessionId();
      const res = await ImprovementService.createImprovedProduct(sessionId);
      if (res && res.session_id) {
        setCreatedProductSession(res.session_id);
        setCreatedProductName(res.product?.name || "Producto v2");
      } else {
        setCreateError("No se pudo registrar la versión mejorada del producto");
      }
    } catch (e: any) {
      console.error(e);
      setCreateError(e.message || "Error al crear el producto mejorado");
    } finally {
      setCreatingProduct(false);
    }
  };

  useEffect(() => {
    if (activeTab === "improvements") {
      fetchImprovements();
    }
  }, [activeTab]);

  // Intentar parsear el analysisResult si viene como string
  const parsedAnalysisResult = React.useMemo(() => {
    if (typeof analysisResult === 'string') {
      try {
        console.log('Intentando parsear analysisResult que vino como string');
        return JSON.parse(analysisResult);
      } catch (error) {
        console.error('Error al parsear analysisResult:', error);
        return null;
      }
    }
    return analysisResult;
  }, [analysisResult]);

  // Depuración: Mostrar los datos recibidos
  console.log('DashboardPhase - Datos recibidos:', { 
    product, 
    analysisResult: parsedAnalysisResult, 
    demographics,
    hasAnalysisResult: !!parsedAnalysisResult,
    averageRating: parsedAnalysisResult?.average_rating,
    ratingDistribution: parsedAnalysisResult?.rating_distribution,
    positivePoints: parsedAnalysisResult?.positive_points,
    negativePoints: parsedAnalysisResult?.negative_points,
    keywordAnalysis: parsedAnalysisResult?.keyword_analysis,
    demographicInsights: parsedAnalysisResult?.demographic_insights
  });

  // Verificar si tenemos datos de análisis válidos
  const hasValidAnalysis = React.useMemo(() => {
    if (!parsedAnalysisResult) return false;
    
    // Verificar si al menos una de las propiedades clave existe
    return (
      (parsedAnalysisResult.average_rating !== undefined) ||
      (Array.isArray(parsedAnalysisResult.rating_distribution) && parsedAnalysisResult.rating_distribution.length > 0) ||
      (parsedAnalysisResult.rating_distribution && typeof parsedAnalysisResult.rating_distribution === 'object' && 
        ('one_star' in parsedAnalysisResult.rating_distribution || 
         'two_stars' in parsedAnalysisResult.rating_distribution || 
         'three_stars' in parsedAnalysisResult.rating_distribution || 
         'four_stars' in parsedAnalysisResult.rating_distribution || 
         'five_stars' in parsedAnalysisResult.rating_distribution)) ||
      (Array.isArray(parsedAnalysisResult.positive_points) && parsedAnalysisResult.positive_points.length > 0) ||
      (Array.isArray(parsedAnalysisResult.keyword_analysis) && parsedAnalysisResult.keyword_analysis.length > 0)
    );
  }, [parsedAnalysisResult]);

  // Si no hay datos válidos, mostrar un mensaje
  if (!hasValidAnalysis) {
    console.error('No hay datos de análisis válidos');
  } else {
    console.log('Datos de análisis válidos encontrados');
  }

  // Calcular conteos para el gráfico de sentimiento a partir del análisis de palabras clave
  const reviewsCount = React.useMemo(() => {
    // Valores por defecto
    const counts = {
      positive: 0,
      neutral: 0,
      negative: 0
    };
    
    // Para depuración
    console.log('Analizando keyword_analysis:', parsedAnalysisResult?.keyword_analysis);
    
    // Si tenemos datos de keyword_analysis, contamos las palabras por sentimiento
    if (parsedAnalysisResult?.keyword_analysis && Array.isArray(parsedAnalysisResult.keyword_analysis)) {
      parsedAnalysisResult.keyword_analysis.forEach((keyword: KeywordAnalysis) => {
        // Para depuración
        console.log(`Palabra: ${keyword.word}, Sentimiento: ${keyword.sentiment}, Conteo: ${keyword.count}`);
        
        // Asegurarse de que el conteo sea un número
        const count = typeof keyword.count === 'number' ? keyword.count : 0;
        
        if (keyword.sentiment === "positive") {
          counts.positive += count;
        } else if (keyword.sentiment === "negative") {
          counts.negative += count;
        } else {
          // Cualquier otro valor (incluyendo "neutral", undefined, etc.)
          counts.neutral += count;
        }
      });
    }
    
    // Para depuración
    console.log('Conteo final de sentimientos:', counts);
    
    // Si no hay datos o todos son cero, ponemos valores mínimos para mostrar algo en el gráfico
    if (counts.positive === 0 && counts.neutral === 0 && counts.negative === 0) {
      // Basamos los valores en el promedio de calificación
      if (parsedAnalysisResult?.average_rating !== undefined) {
        const rating = parsedAnalysisResult.average_rating;
        if (rating >= 4) {
          counts.positive = 5;
          counts.neutral = 2;
          counts.negative = 1;
        } else if (rating >= 3) {
          counts.positive = 3;
          counts.neutral = 4;
          counts.negative = 2;
        } else {
          counts.positive = 1;
          counts.neutral = 2;
          counts.negative = 5;
        }
      } else {
        // Valores predeterminados si no hay datos
        counts.positive = 1;
        counts.neutral = 1;
        counts.negative = 1;
      }
    }
    
    return counts;
  }, [parsedAnalysisResult]);

  return (
    <div className="space-y-6">
      <Card className="border-purple-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            Dashboard de análisis de reseñas
          </CardTitle>
          <CardDescription>
            Análisis e insights basados en las reseñas para {product.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Tab Selector */}
          <div className="flex border-b border-purple-100 dark:border-gray-800 mb-6">
            <button
              onClick={() => setActiveTab("metrics")}
              className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 -mb-px ${
                activeTab === "metrics"
                  ? "border-purple-500 text-purple-700 dark:text-purple-300"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-purple-600"
              }`}
            >
              Métricas y Sentimientos
            </button>
            <button
              onClick={() => setActiveTab("improvements")}
              className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 -mb-px ${
                activeTab === "improvements"
                  ? "border-purple-500 text-purple-700 dark:text-purple-300"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-purple-600"
              }`}
            >
              Propuestas de Mejora 💡
            </button>
          </div>

          {activeTab === "metrics" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-purple-100 dark:border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  Calificación promedio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                    {(parsedAnalysisResult && typeof parsedAnalysisResult.average_rating === 'number' ? parsedAnalysisResult.average_rating : 0).toFixed(1)}
                  </div>
                  <div className="text-xl text-gray-400 mt-2 ml-1">/5</div>
                </div>
                <div className="flex items-center justify-center mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= Math.round(parsedAnalysisResult && typeof parsedAnalysisResult.average_rating === 'number' ? parsedAnalysisResult.average_rating : 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-100 dark:border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-green-500" />
                  Análisis de sentimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SentimentPieChart reviewsCount={reviewsCount} />
              </CardContent>
            </Card>

            <Card className="border-purple-100 dark:border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Demografía de revisores
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500 dark:text-gray-400">Rango de edad</span>
                      <span className="font-medium">
                        {demographics.age_range[0]}-{demographics.age_range[1]} años
                      </span>
                    </div>
                    <Progress value={75} className="h-1.5" />
                  </div>
                 
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500 dark:text-gray-400">Educación</span>
                      <span className="font-medium">
                        {demographics.education_level}
                      </span>
                    </div>
                    <Progress value={60} className="h-1.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="border-purple-100 dark:border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                  Distribución de calificaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <RatingBarChart distribution={parsedAnalysisResult?.rating_distribution || [0, 0, 0, 0, 0]} />
              </CardContent>
            </Card>

            <Card className="border-purple-100 dark:border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Análisis de palabras clave
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <KeywordCloud keywords={parsedAnalysisResult?.keyword_analysis || []} />
              </CardContent>
            </Card>
          </div>

          {/* Información del producto */}
          <Card className="border-purple-100 dark:border-gray-800 mb-6">
            <CardHeader className="pb-2 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                Información detallada del producto
              </CardTitle>
              <CardDescription>
                Características y especificaciones técnicas del producto analizado
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Características principales */}
                <div>
                  <h4 className="text-md font-semibold mb-3 text-blue-700 dark:text-blue-400 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Características principales
                  </h4>
                  
                  {product.main_features && product.main_features.length > 0 ? (
                    <div className="space-y-2">
                      {product.main_features.map((feature, index) => (
                        <motion.div 
                          key={index} 
                          className="grid grid-cols-3 gap-2 items-center border-b border-blue-100 dark:border-blue-800 pb-2 last:border-0"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="font-medium text-sm text-blue-800 dark:text-blue-300">
                            {feature.feature}:
                          </div>
                          <div className="col-span-2 text-sm text-gray-700 dark:text-gray-300">
                            {feature.value || feature.description || ""}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No hay características disponibles.
                    </p>
                  )}
                </div>
                
                {/* Especificaciones técnicas */}
                <div>
                  <h4 className="text-md font-semibold mb-3 text-purple-700 dark:text-purple-400 flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    Especificaciones técnicas
                  </h4>
                  
                  {product.technical_specs && product.technical_specs.length > 0 ? (
                    <div className="space-y-2">
                      {product.technical_specs.map((spec, index) => (
                        <motion.div 
                          key={index} 
                          className="grid grid-cols-3 gap-2 items-center border-b border-purple-100 dark:border-purple-800 pb-2 last:border-0"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="font-medium text-sm text-purple-800 dark:text-purple-300">
                            {spec.spec}
                          </div>
                          <div className="col-span-2 text-sm text-gray-700 dark:text-gray-300">
                            {spec.value || spec.description || ""}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No hay especificaciones técnicas disponibles.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-purple-100 dark:border-gray-800 bg-green-50/50 dark:bg-green-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-green-600 dark:text-green-400">
                  <ThumbsUp className="h-5 w-5" />
                  Puntos positivos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2 border-gray-200 dark:border-gray-700">
                    Puntos positivos
                  </h3>
                  <ul className="space-y-2">
                    {parsedAnalysisResult && Array.isArray(parsedAnalysisResult.positive_points) && parsedAnalysisResult.positive_points.length > 0 ? (
                      parsedAnalysisResult.positive_points.map((point: string, index: number) => (
                        <motion.li
                          key={index}
                          className="flex items-center text-green-600 dark:text-green-400"
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Check className="h-5 w-5 mr-2 flex-shrink-0" />
                          <span>{point}</span>
                        </motion.li>
                      ))
                    ) : (
                      <li className="text-gray-500 dark:text-gray-400">No hay puntos positivos identificados</li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-100 dark:border-gray-800 bg-red-50/50 dark:bg-red-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                  <ThumbsDown className="h-5 w-5" />
                  Áreas de mejora
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2 border-gray-200 dark:border-gray-700">
                    Puntos negativos
                  </h3>
                  <ul className="space-y-2">
                    {parsedAnalysisResult && Array.isArray(parsedAnalysisResult.negative_points) && parsedAnalysisResult.negative_points.length > 0 ? (
                      parsedAnalysisResult.negative_points.map((point: string, index: number) => (
                        <motion.li
                          key={index}
                          className="flex items-center text-red-600 dark:text-red-400"
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                          <span>{point}</span>
                        </motion.li>
                      ))
                    ) : (
                      <li className="text-gray-500 dark:text-gray-400">No hay puntos negativos identificados</li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card className="border-purple-100 dark:border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Insights demográficos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(parsedAnalysisResult?.demographic_insights || []).map((insight: string, index: number) => (
                    <motion.div
                      key={index}
                      className="flex items-start gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className={`h-2 w-2 rounded-full ${index % 2 === 0 ? "bg-blue-500" : "bg-purple-500"} mt-1.5 flex-shrink-0`} />
                      <span className="text-sm">{insight}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          </>
          ) : (
            <div className="space-y-6 text-left pb-6 animate-in fade-in-40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 dark:border-gray-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                    Plan de Innovación y Mejora del Producto
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Propuestas de rediseño y posicionamiento generadas por la IA a partir del feedback de los clientes.
                  </p>
                </div>
                {!createdProductSession && improvements && (
                  <Button
                    onClick={handleCreateImprovedProduct}
                    disabled={creatingProduct}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90 text-white font-semibold text-xs shrink-0 self-start sm:self-center shadow-md shadow-emerald-500/10"
                  >
                    {creatingProduct ? (
                      <>
                        <span className="animate-spin mr-1.5">•</span>
                        Creando v2...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        Crear producto mejorado (v2)
                      </>
                    )}
                  </Button>
                )}
              </div>

              {createdProductSession && (
                <div className="p-5 border border-emerald-200 dark:border-emerald-950 bg-emerald-500/[0.03] dark:bg-emerald-950/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in zoom-in-95">
                  <div className="text-left">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      <Check className="h-3 w-3" />
                      Versión v2 Creada
                    </span>
                    <h4 className="font-bold text-sm mt-2 text-gray-800 dark:text-gray-200">
                      ¡{createdProductName} está listo para ser evaluado!
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      El producto mejorado se ha registrado en tu historial de experimentos como una versión hija del producto actual.
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0 w-full md:w-auto">
                    <Link href="/experiments" className="flex-1 md:flex-none">
                      <Button variant="outline" size="sm" className="w-full text-xs border-emerald-200/50 hover:bg-emerald-100/20 text-emerald-700 dark:text-emerald-300">
                        Ver experimentos
                      </Button>
                    </Link>
                    <Button
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          sessionStorage.setItem('review_simulator_session_id', createdProductSession);
                          window.location.reload();
                        }
                      }}
                      className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                      size="sm"
                    >
                      Simular v2 ahora
                    </Button>
                  </div>
                </div>
              )}

              {createError && (
                <div className="p-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
                  {createError}
                </div>
              )}

              {improvementsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">El consultor IA está redactando el plan estratégico...</p>
                </div>
              ) : (
                <ImprovementsGrid text={improvements} />
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 border-t border-purple-100 dark:border-gray-800 px-6 py-4">
          <div className="flex justify-between w-full">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setActiveStep(3)}
                variant="outline"
                className="border-purple-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a reseñas
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => {
                  setBots([])
                  setReviews([])
                  setAnalysisResult(null)
                  setActiveStep(1)
                }}
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
              >
                <Rocket className="mr-2 h-4 w-4" />
                Iniciar nueva simulación
              </Button>
            </motion.div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}; 