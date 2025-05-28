import React from "react";
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
} from "lucide-react";
import { Product, AnalysisResult, KeywordAnalysis } from "@/lib/types";

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
                      {index % 2 === 0 ? (
                        <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      )}
                      <span className="text-sm">{insight}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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