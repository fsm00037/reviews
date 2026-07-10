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
  { bg: "bg-primary/[0.02] dark:bg-primary/[0.04]", border: "border-primary/10 dark:border-primary/20", badge: "bg-primary/10 text-primary", dot: "bg-primary" },
  { bg: "bg-muted/30 dark:bg-muted/10", border: "border-border", badge: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  { bg: "bg-emerald-500/[0.02] dark:bg-emerald-500/[0.04]", border: "border-emerald-500/10 dark:border-emerald-500/20", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  { bg: "bg-cyan-500/[0.02] dark:bg-cyan-500/[0.04]", border: "border-cyan-500/10 dark:border-cyan-500/20", badge: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400", dot: "bg-cyan-500" },
  { bg: "bg-amber-500/[0.02] dark:bg-amber-500/[0.04]", border: "border-amber-500/10 dark:border-amber-500/20", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  { bg: "bg-indigo-500/[0.02] dark:bg-indigo-500/[0.04]", border: "border-indigo-500/10 dark:border-indigo-500/20", badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", dot: "bg-indigo-500" },
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
      <Card className="border-border bg-card/60 backdrop-blur-md overflow-hidden rounded-2xl shadow-lg shadow-black/[0.03]">
        <CardHeader className="border-b border-border/60 bg-muted/10 pb-5">
          <CardTitle className="flex items-center gap-2.5 text-lg font-bold">
            <BarChart3 className="h-5 w-5 text-primary" />
            Dashboard de análisis de reseñas
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            Análisis e insights basados en las reseñas para {product.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Tab Selector */}
          <div className="flex border-b border-border/60 mb-6">
            <button
              onClick={() => setActiveTab("metrics")}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 -mb-px ${
                activeTab === "metrics"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Métricas y Sentimientos
            </button>
            <button
              onClick={() => setActiveTab("improvements")}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 -mb-px ${
                activeTab === "improvements"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Propuestas de Mejora 💡
            </button>
          </div>

          {activeTab === "metrics" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="border-border bg-background/50 hover:border-primary/20 glow-card-hover rounded-2xl shadow-sm transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Star className="h-4.5 w-4.5 text-amber-500 fill-amber-500" />
                      Calificación promedio
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex items-baseline justify-center">
                      <div className="text-5xl font-extrabold text-foreground tracking-tight">
                        {(parsedAnalysisResult && typeof parsedAnalysisResult.average_rating === 'number' ? parsedAnalysisResult.average_rating : 0).toFixed(1)}
                      </div>
                      <div className="text-sm font-semibold text-muted-foreground ml-1">/ 5.0</div>
                    </div>
                    <div className="flex items-center justify-center mt-3 gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= Math.round(parsedAnalysisResult && typeof parsedAnalysisResult.average_rating === 'number' ? parsedAnalysisResult.average_rating : 0) ? "fill-amber-500 text-amber-500" : "text-border"}`}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border bg-background/50 hover:border-primary/20 glow-card-hover rounded-2xl shadow-sm transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <ThumbsUp className="h-4.5 w-4.5 text-emerald-500" />
                      Sentimiento General
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-1">
                    <SentimentPieChart reviewsCount={reviewsCount} />
                  </CardContent>
                </Card>

                <Card className="border-border bg-background/50 hover:border-primary/20 glow-card-hover rounded-2xl shadow-sm transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Users className="h-4.5 w-4.5 text-primary" />
                      Demografía de revisores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-4 text-xs font-medium text-foreground">
                      <div>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-muted-foreground">Rango de edad</span>
                          <span className="font-bold">
                            {demographics.age_range[0]}-{demographics.age_range[1]} años
                          </span>
                        </div>
                        <Progress value={75} className="h-1.5 bg-muted" />
                      </div>
                     
                      <div>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-muted-foreground">Educación</span>
                          <span className="font-bold">
                            {demographics.education_level === "Low" ? "Bajo" : demographics.education_level === "Medium" ? "Medio" : demographics.education_level === "High" ? "Alto" : "Mixto"}
                          </span>
                        </div>
                        <Progress value={60} className="h-1.5 bg-muted" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card className="border-border bg-background/50 hover:border-primary/20 glow-card-hover rounded-2xl shadow-sm transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <BarChart3 className="h-4.5 w-4.5 text-primary" />
                      Distribución de calificaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <RatingBarChart distribution={parsedAnalysisResult?.rating_distribution || [0, 0, 0, 0, 0]} />
                  </CardContent>
                </Card>

                <Card className="border-border bg-background/50 hover:border-primary/20 glow-card-hover rounded-2xl shadow-sm transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-primary" />
                      Análisis de palabras clave
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <KeywordCloud keywords={parsedAnalysisResult?.keyword_analysis || []} />
                  </CardContent>
                </Card>
              </div>

              {/* Información del producto */}
              <Card className="border-border bg-background/50 hover:border-primary/20 glow-card-hover rounded-2xl shadow-sm transition-all duration-300 mb-6">
                <CardHeader className="pb-4 border-b border-border/60 bg-muted/10">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-primary" />
                    Información detallada del producto
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    Características y especificaciones técnicas del producto analizado
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Características principales */}
                    <div>
                      <h4 className="text-xs font-bold mb-4 text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Características principales
                      </h4>
                      
                      {product.main_features && product.main_features.length > 0 ? (
                        <div className="space-y-3">
                          {product.main_features.map((feature, index) => (
                            <motion.div 
                              key={index} 
                              className="grid grid-cols-3 gap-2 items-center border-b border-border/40 pb-3 last:border-0 last:pb-0"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <div className="font-semibold text-xs text-foreground/80">
                                {feature.feature}:
                              </div>
                              <div className="col-span-2 text-xs text-muted-foreground">
                                {feature.value || feature.description || ""}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No hay características disponibles.
                        </p>
                      )}
                    </div>
                    
                    {/* Especificaciones técnicas */}
                    <div>
                      <h4 className="text-xs font-bold mb-4 text-foreground flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-primary animate-pulse" />
                        Especificaciones técnicas
                      </h4>
                      
                      {product.technical_specs && product.technical_specs.length > 0 ? (
                        <div className="space-y-3">
                          {product.technical_specs.map((spec, index) => (
                            <motion.div 
                              key={index} 
                              className="grid grid-cols-3 gap-2 items-center border-b border-border/40 pb-3 last:border-0 last:pb-0"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <div className="font-semibold text-xs text-foreground/80">
                                {spec.spec}
                              </div>
                              <div className="col-span-2 text-xs text-muted-foreground">
                                {spec.value || spec.description || ""}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No hay especificaciones técnicas disponibles.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-border bg-background/40 hover:border-emerald-500/20 glow-card-hover rounded-2xl shadow-sm transition-all duration-300">
                  <CardHeader className="pb-2 border-b border-border/40">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <ThumbsUp className="h-4.5 w-4.5" />
                      Puntos positivos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ul className="space-y-2.5 mt-1">
                      {parsedAnalysisResult && Array.isArray(parsedAnalysisResult.positive_points) && parsedAnalysisResult.positive_points.length > 0 ? (
                        parsedAnalysisResult.positive_points.map((point: string, index: number) => (
                          <motion.li
                            key={index}
                            className="flex items-start text-emerald-600 dark:text-emerald-400 text-xs font-medium leading-relaxed"
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Check className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{point}</span>
                          </motion.li>
                        ))
                      ) : (
                        <li className="text-xs text-muted-foreground italic">No hay puntos positivos identificados</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-border bg-background/40 hover:border-destructive/20 glow-card-hover rounded-2xl shadow-sm transition-all duration-300">
                  <CardHeader className="pb-2 border-b border-border/40">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-2">
                      <ThumbsDown className="h-4.5 w-4.5" />
                      Áreas de mejora
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ul className="space-y-2.5 mt-1">
                      {parsedAnalysisResult && Array.isArray(parsedAnalysisResult.negative_points) && parsedAnalysisResult.negative_points.length > 0 ? (
                        parsedAnalysisResult.negative_points.map((point: string, index: number) => (
                          <motion.li
                            key={index}
                            className="flex items-start text-red-600 dark:text-red-400 text-xs font-medium leading-relaxed"
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{point}</span>
                          </motion.li>
                        ))
                      ) : (
                        <li className="text-xs text-muted-foreground italic">No hay puntos negativos identificados</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <Card className="border-border bg-background/50 hover:border-primary/20 glow-card-hover rounded-2xl shadow-sm transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Users className="h-4.5 w-4.5 text-primary" />
                      Insights demográficos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(parsedAnalysisResult?.demographic_insights || []).map((insight: string, index: number) => (
                        <motion.div
                          key={index}
                          className="flex items-start gap-2.5 p-3 rounded-xl border border-border/40 bg-background/30"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className={`h-2 w-2 rounded-full ${index % 2 === 0 ? "bg-primary" : "bg-cyan-500"} mt-1.5 flex-shrink-0`} />
                          <span className="text-xs leading-relaxed font-medium">{insight}</span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="space-y-6 text-left pb-6 animate-in fade-in-40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-foreground">
                    Plan de Innovación y Mejora del Producto
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Propuestas de rediseño y posicionamiento generadas por la IA a partir del feedback de los clientes.
                  </p>
                </div>
                {!createdProductSession && improvements && (
                  <Button
                    onClick={handleCreateImprovedProduct}
                    disabled={creatingProduct}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl h-9 px-4 shrink-0 shadow-md shadow-emerald-600/10"
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
                <div className="p-5 border border-emerald-200 dark:border-emerald-950/60 bg-emerald-500/[0.02] dark:bg-emerald-950/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in zoom-in-95">
                  <div className="text-left">
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      <Check className="h-3 w-3 stroke-[3]" />
                      Versión v2 Creada
                    </span>
                    <h4 className="font-bold text-sm mt-2 text-foreground">
                      ¡{createdProductName} está listo para ser evaluado!
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      El producto mejorado se ha registrado en tu historial de experimentos como una versión hija del producto actual.
                    </p>
                  </div>
                  <div className="flex gap-2.5 shrink-0 w-full md:w-auto">
                    <Link href="/experiments" className="flex-1 md:flex-none">
                      <Button variant="outline" size="sm" className="w-full text-xs rounded-xl border-emerald-200/50 hover:bg-emerald-100/10 text-emerald-700 dark:text-emerald-300">
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
                      className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
                      size="sm"
                    >
                      Simular v2 ahora
                    </Button>
                  </div>
                </div>
              )}

              {createError && (
                <div className="p-3 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-xl">
                  {createError}
                </div>
              )}

              {improvementsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <p className="text-xs text-muted-foreground">El consultor IA está redactando el plan estratégico...</p>
                </div>
              ) : (
                <ImprovementsGrid text={improvements} />
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/10 border-t border-border/60 px-6 py-4">
          <div className="flex justify-between w-full">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => setActiveStep(3)}
                variant="outline"
                className="border-border hover:bg-accent rounded-xl text-xs font-semibold px-4 h-10 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a reseñas
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => {
                  setBots([])
                  setReviews([])
                  setAnalysisResult(null)
                  setActiveStep(1)
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/95 transition-all font-semibold rounded-xl px-5 h-10 shadow-sm shadow-primary/10"
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