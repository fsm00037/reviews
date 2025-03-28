"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Star,
  Sparkles,
  Zap,
  Users,
  MessageSquare,
  ArrowRight,
  Rocket,
  UserCircle2,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Check,
} from "lucide-react"
import { FanIcon as MaleIcon } from "lucide-react"
import { FanIcon as FemaleIcon } from "lucide-react"
import AnimatedBackground from "@/components/animated-background"
import RocketProgressBar from "@/components/rocket-progress-bar"
import { CustomRangeSlider } from "@/components/custom-range-slider"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "next-themes"
import { Progress } from "@/components/ui/progress"
import { ApiErrorAlert } from "@/components/api-error-alert"
import { LoadingSpinner } from "@/components/loading-spinner"
import { SimulatorService } from "@/lib/api-services"
import { APIError } from "@/lib/types"

// Importar servicios API y tipos
import { ProductService, BotService, ReviewService, AnalysisService } from "@/lib/api-services"
import { 
  Product, 
  BotProfile, 
  Review, 
  DemographicConfig, 
  PersonalityConfig, 
  AnalysisResult,
  BotConfigRequest,
  KeywordAnalysis,
  BotPersonality
} from "@/lib/types"

// Eliminar todas las interfaces locales que ahora se importan desde /lib/types.ts

export default function SimulatorPage() {
  // Dentro de la función SimulatorPage, añadir:
  const { theme, setTheme } = useTheme()

  // State for product information
  const [product, setProduct] = useState<Product>({
    name: "Premium Wireless Headphones",
    description:
      "Experience crystal-clear sound with our premium wireless headphones. Featuring active noise cancellation, 30-hour battery life, and comfortable over-ear design.",
    price: "$149.99",
    image: "/placeholder.svg?height=300&width=300",
    category: "Electronics",
  })

  // State for bot configuration
  const [populationRange, setPopulationRange] = useState<[number, number]>([3, 8])
  const [positivityBias, setPositivityBias] = useState<[number, number]>([60, 80])
  const [verbosity, setVerbosity] = useState<[number, number]>([40, 70])
  const [detailLevel, setDetailLevel] = useState<[number, number]>([50, 80])

  // New demographic configuration
  const [demographics, setDemographics] = useState<DemographicConfig>({
    age_range: [25, 45],
    education_range: [12, 18], // Years of education (12 = high school, 16 = bachelor's, 18 = master's)
    gender_ratio: 50, // 50% male, 50% female
  })

  // New personality configuration with ranges
  const [personality, setPersonality] = useState<PersonalityConfig>({
    introvert_extrovert: [40, 80],
    analytical_creative: [30, 60],
    busy_free_time: [50, 90],
    disorganized_organized: [40, 70],
    independent_cooperative: [10, 40],
    environmentalist: [50, 80],
    safe_risky: [60, 90],
  })

  // State for generated bots and reviews
  const [bots, setBots] = useState<BotProfile[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [activeStep, setActiveStep] = useState(0)
  const [isGeneratingBots, setIsGeneratingBots] = useState(false)
  const [isGeneratingReviews, setIsGeneratingReviews] = useState(false)
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<APIError | null>(null)
  const [productId, setProductId] = useState<number | undefined>(undefined)
  const [showProductDetails, setShowProductDetails] = useState(false)

  // Actualizar los pasos para incluir la nueva fase de dashboard
  const steps = ["Producto", "Configuración", "Perfiles", "Reseñas", "Dashboard"]

  // Function to handle product form submission
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    try {
      setIsGeneratingBots(true)
      
      // Obtener la URL del producto del formulario
      const productUrl = (e.currentTarget as HTMLFormElement).elements.namedItem('productUrl') as HTMLInputElement;
      
      // Ejecutar fase 1 para obtener información del producto
      const productInfo = await ProductService.analyzeProduct(productUrl.value);
      setProduct(productInfo);
      setActiveStep(1);
    } catch (err) {
      console.error("Error al analizar el producto:", err);
      if ((err as APIError).status !== undefined) {
        setError(err as APIError);
      } else {
        setError({
          status: 500,
          message: `Error inesperado: ${(err as Error).message || 'Desconocido'}`,
          details: 'Verifica la URL del producto e intenta nuevamente'
        });
      }
    } finally {
      setIsGeneratingBots(false);
    }
  }

  // Function to generate bot profiles
  const generateBots = async () => {
    setIsGeneratingBots(true)
    setError(null)

    try {
      // Usar el rango de población para determinar el número de bots
      const numReviewers = Math.floor(Math.random() * 
        (populationRange[1] - populationRange[0] + 1)) + populationRange[0];
      
      // Ejecutar fase 2 para generar perfiles de bot
      const response = await BotService.generateBots(numReviewers);
      
      if (response && response.profiles) {
        setBots(response.profiles);
        setActiveStep(2);
      } else {
        throw {
          status: 500,
          message: 'La respuesta del servidor no contiene perfiles',
          details: 'La API no devolvió datos de perfiles válidos'
        };
      }
    } catch (err) {
      console.error("Error al generar los bots:", err);
      if ((err as APIError).status !== undefined) {
        setError(err as APIError);
      } else {
        setError({
          status: 500,
          message: `Error inesperado: ${(err as Error).message || 'Desconocido'}`,
          details: 'No se pudieron generar los perfiles de bot'
        });
      }
    } finally {
      setIsGeneratingBots(false);
    }
  }

  // Function to generate reviews based on bot profiles
  const generateReviews = async () => {
    setIsGeneratingReviews(true)
    setError(null)

    try {
      // Ejecutar fase 3 para generar reseñas
      const response = await ReviewService.generateReviews();
      
      if (response && response.reviews) {
        setReviews(response.reviews);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        setActiveStep(3);
      } else {
        throw {
          status: 500,
          message: 'La respuesta del servidor no contiene reseñas',
          details: 'La API no devolvió datos de reseñas válidos'
        };
      }
    } catch (err) {
      console.error("Error al generar las reseñas:", err);
      if ((err as APIError).status !== undefined) {
        setError(err as APIError);
      } else {
        setError({
          status: 500,
          message: `Error inesperado: ${(err as Error).message || 'Desconocido'}`,
          details: 'No se pudieron generar las reseñas'
        });
      }
    } finally {
      setIsGeneratingReviews(false);
    }
  }

  // Function to generate analysis based on reviews
  const generateAnalysis = async () => {
    setIsGeneratingAnalysis(true)
    setError(null)

    try {
      // Ejecutar fase 4 para generar análisis
      const analysis = await AnalysisService.generateAnalysis();
      
      if (analysis) {
        setAnalysisResult(analysis);
        setActiveStep(4);
      } else {
        throw {
          status: 500,
          message: 'La respuesta del servidor no contiene análisis',
          details: 'La API no devolvió datos de análisis válidos'
        };
      }
    } catch (err) {
      console.error("Error al generar el análisis:", err);
      if ((err as APIError).status !== undefined) {
        setError(err as APIError);
      } else {
        setError({
          status: 500,
          message: `Error inesperado: ${(err as Error).message || 'Desconocido'}`,
          details: 'No se pudo generar el análisis'
        });
      }
    } finally {
      setIsGeneratingAnalysis(false);
    }
  }

  // Añadir una nueva función para ejecutar todo el proceso completo
  const runCompleteAnalysis = async (productUrl: string) => {
    setError(null);
    
    try {
      setIsGeneratingBots(true);
      setIsGeneratingReviews(true);
      setIsGeneratingAnalysis(true);
      
      // Ejecutar todas las fases a la vez
      const numReviewers = Math.floor(Math.random() * 
        (populationRange[1] - populationRange[0] + 1)) + populationRange[0];
      
      const results = await SimulatorService.runCompleteAnalysis(productUrl, numReviewers);
      
      if (results) {
        setProduct(results.product);
        setBots(results.reviewers);
        setReviews(results.reviews);
        setAnalysisResult(results.analysis);
        setActiveStep(4); // Ir directamente al dashboard final
      }
    } catch (err) {
      console.error("Error al ejecutar el análisis completo:", err);
      if ((err as APIError).status !== undefined) {
        setError(err as APIError);
      } else {
        setError({
          status: 500,
          message: `Error inesperado: ${(err as Error).message || 'Desconocido'}`,
          details: 'No se pudo completar el análisis'
        });
      }
    } finally {
      setIsGeneratingBots(false);
      setIsGeneratingReviews(false);
      setIsGeneratingAnalysis(false);
    }
  };

  // Añadir una función para cargar los resultados actuales
  const loadCurrentResults = async () => {
    setError(null);
    
    try {
      const results = await SimulatorService.getAllResults();
      
      if (results) {
        setProduct(results.product);
        setBots(results.reviewers);
        setReviews(results.reviews);
        setAnalysisResult(results.analysis);
        
        // Determinar en qué paso estamos basado en los datos disponibles
        if (results.analysis && Object.keys(results.analysis).length > 0) {
          setActiveStep(4);
        } else if (results.reviews && results.reviews.length > 0) {
          setActiveStep(3);
        } else if (results.reviewers && results.reviewers.length > 0) {
          setActiveStep(2);
        } else if (results.product && Object.keys(results.product).length > 0) {
          setActiveStep(1); // Si hay información del producto, ir a la fase de configuración
        } else {
          setActiveStep(0); // Si no hay información, iniciar en la fase 0 (información del producto)
        }
      } else {
        setActiveStep(0); // Si no hay resultados disponibles, iniciar en la fase 0
      }
    } catch (err) {
      console.error("Error al cargar los resultados:", err);
      // No mostrar error si no hay resultados disponibles aún (simplemente ir a fase 0)
      if ((err as APIError).status === 404) {
        setActiveStep(0);
      } else if ((err as APIError).status !== undefined) {
        setError(err as APIError);
      } else {
        setError({
          status: 500,
          message: `Error inesperado: ${(err as Error).message || 'Desconocido'}`,
          details: 'No se pudieron cargar los resultados'
        });
      }
    }
  };

  // En la sección de renderizado, antes del primer <AnimatePresence>, añadir:
  <ApiErrorAlert 
    error={error} 
    onDismiss={() => setError(null)} 
  />

  // Confetti animation
  const Confetti = () => {
    const confettiCount = 100
    const colors = ["#FF5733", "#33FF57", "#3357FF", "#F3FF33", "#FF33F3"]

    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {Array.from({ length: confettiCount }).map((_, i) => {
          const left = Math.random() * 100
          const animationDuration = 2 + Math.random() * 3
          const delay = Math.random()
          const size = 5 + Math.random() * 10
          const color = colors[Math.floor(Math.random() * colors.length)]

          return (
            <motion.div
              key={i}
              initial={{
                top: -20,
                left: `${left}%`,
                opacity: 1,
                rotate: 0,
              }}
              animate={{
                top: "100vh",
                left: `${left + (Math.random() * 20 - 10)}%`,
                opacity: 0,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: animationDuration,
                delay: delay,
                ease: "easeOut",
              }}
              style={{
                position: "absolute",
                width: size,
                height: size,
                backgroundColor: color,
                borderRadius: Math.random() > 0.5 ? "50%" : "0%",
              }}
            />
          )
        })}
      </div>
    )
  }

  // Space theme stars background
  const SpaceStars = () => {
    return (
      <div className="fixed inset-0 z-0">
        {Array.from({ length: 50 }).map((_, i) => {
          const size = Math.random() * 2 + 1
          const top = Math.random() * 100
          const left = Math.random() * 100
          const animationDelay = Math.random() * 5

          return (
            <motion.div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: size,
                height: size,
                top: `${top}%`,
                left: `${left}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 3 + Math.random() * 2,
                delay: animationDelay,
                ease: "easeInOut",
              }}
            />
          )
        })}
      </div>
    )
  }

  // Componente para gráfico de barras de calificaciones
  const RatingBarChart = ({ distribution }: { distribution: number[] }) => {
    const total = distribution.reduce((sum, count) => sum + count, 0)
    const percentages = distribution.map((count) => (count / total) * 100)

    return (
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((stars, index) => (
          <div key={stars} className="flex items-center gap-2">
            <div className="w-8 text-right font-medium">{stars}★</div>
            <div className="flex-1">
              <div className="h-5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentages[5 - stars]}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                />
              </div>
            </div>
            <div className="w-12 text-sm text-gray-500 dark:text-gray-400">
              {distribution[5 - stars]} ({percentages[5 - stars].toFixed(0)}%)
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Componente para gráfico circular de sentimiento
  const SentimentPieChart = () => {
    const positive = reviews.filter((r) => r.rating >= 4).length
    const neutral = reviews.filter((r) => r.rating === 3).length
    const negative = reviews.filter((r) => r.rating <= 2).length
    const total = reviews.length

    const positivePercent = (positive / total) * 100
    const neutralPercent = (neutral / total) * 100
    const negativePercent = (negative / total) * 100

    // Calcular ángulos para el gráfico circular
    const positiveAngle = (positive / total) * 360
    const neutralAngle = (neutral / total) * 360

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Círculo base (negativo) */}
            <circle cx="50" cy="50" r="40" fill="#f87171" />

            {/* Sector neutral */}
            {neutral > 0 && (
              <motion.path
                d={`M 50 50 L 50 10 A 40 40 0 ${positiveAngle > 180 ? 1 : 0} 1 ${50 + 40 * Math.sin((positiveAngle * Math.PI) / 180)} ${50 - 40 * Math.cos((positiveAngle * Math.PI) / 180)} Z`}
                fill="#fbbf24"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
            )}

            {/* Sector positivo */}
            {positive > 0 && (
              <motion.path
                d={`M 50 50 L 50 10 A 40 40 0 0 1 ${50 + 40 * Math.sin(0)} ${50 - 40 * Math.cos(0)} Z`}
                fill="#4ade80"
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
            <span className="text-xs text-gray-500">Positive</span>
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-xs">Positive ({positive})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
            <span className="text-xs">Neutral ({neutral})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span className="text-xs">Negative ({negative})</span>
          </div>
        </div>
      </div>
    )
  }

  // Componente para nube de palabras clave
  const KeywordCloud = ({ keywords }: { keywords: KeywordAnalysis[] }) => {
    return (
      <div className="flex flex-wrap justify-center gap-2 p-4">
        {keywords.map((keyword, index) => {
          const fontSize = 0.8 + (keyword.count / 5) * 0.2 // Escala de 0.8 a 1.2rem
          const color =
            keyword.sentiment === "positive"
              ? "text-green-500 dark:text-green-400"
              : keyword.sentiment === "negative"
                ? "text-red-500 dark:text-red-400"
                : "text-gray-500 dark:text-gray-400"

          return (
            <motion.span
              key={keyword.word}
              className={`${color} font-medium px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700`}
              style={{ fontSize: `${fontSize}rem` }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              {keyword.word}
            </motion.span>
          )
        })}
      </div>
    )
  }

  // Agregar mensaje de error
  const ErrorMessage = () => {
    if (!error) return null
    
    return (
      <div className="p-4 mb-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-400">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <p>{error.message}</p>
        </div>
      </div>
    )
  }

  // Añadir useEffect para cargar los resultados al iniciar
  useEffect(() => {
    loadCurrentResults();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <AnimatedBackground />
      <SpaceStars />
      {showConfetti && <Confetti />}

      <div className="container mx-auto py-6 px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center mb-6"
        >
          <Link href="/" className="mr-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-purple-200 dark:border-gray-700 hover:bg-purple-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            Product Review Simulator
          </h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </motion.div>

        <div className="mb-8">
          <RocketProgressBar
            steps={steps}
            currentStep={activeStep}
            onStepClick={(step) => {
              // Only allow going back to previous steps or current step
              if (step <= activeStep) {
                setActiveStep(step)
              }
            }}
          />
        </div>

        <ApiErrorAlert 
          error={error} 
          onDismiss={() => setError(null)} 
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeStep === 0 && (
              <Card className="border-purple-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    Información del producto
                  </CardTitle>
                  <CardDescription>Ingresa la URL de un producto o proporciona detalles para una nueva simulación</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="productUrl" className="text-sm font-medium">
                          URL del producto
                        </Label>
                        <Input
                          id="productUrl"
                          placeholder="https://example.com/product"
                          className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-gray-700 focus-visible:ring-purple-500"
                        />
                        <Button
                          type="submit"
                          variant="outline"
                          className="mt-2 border-purple-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors w-full"
                          disabled={isGeneratingBots}
                        >
                          {isGeneratingBots ? (
                            <LoadingSpinner text="Analizando producto..." size="sm" />
                          ) : (
                            <>Extraer información del producto</>
                          )}
                        </Button>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          O ingresa los datos del producto manualmente a continuación
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="productImage" className="text-sm font-medium">
                          Imagen del producto
                        </Label>
                        <div className="border border-purple-200 dark:border-gray-700 rounded-md p-2 flex justify-center bg-white/50 dark:bg-gray-800/50">
                          <motion.img
                            src={product.image || "/placeholder.svg"}
                            alt="Product"
                            className="h-40 w-40 object-contain"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="productName" className="text-sm font-medium">
                        Nombre del producto
                      </Label>
                      <Input
                        id="productName"
                        value={product.name}
                        onChange={(e) => setProduct({ ...product, name: e.target.value })}
                        className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-gray-700 focus-visible:ring-purple-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="productDescription" className="text-sm font-medium">
                        Descripción del producto
                      </Label>
                      <Textarea
                        id="productDescription"
                        rows={3}
                        value={product.description}
                        onChange={(e) => setProduct({ ...product, description: e.target.value })}
                        className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-gray-700 focus-visible:ring-purple-500 min-h-[100px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="productPrice" className="text-sm font-medium">
                          Precio
                        </Label>
                        <Input
                          id="productPrice"
                          value={product.price}
                          onChange={(e) => setProduct({ ...product, price: e.target.value })}
                          className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-gray-700 focus-visible:ring-purple-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="productCategory" className="text-sm font-medium">
                          Categoría
                        </Label>
                        <Input
                          id="productCategory"
                          value={product.category}
                          onChange={(e) => setProduct({ ...product, category: e.target.value })}
                          className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-gray-700 focus-visible:ring-purple-500"
                        />
                      </div>
                    </div>

                    {/* Características principales */}
                    <div className="mt-6 bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3 text-blue-700 dark:text-blue-400 flex items-center">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Características principales
                      </h3>
                      
                      {product.main_features && product.main_features.length > 0 ? (
                        <div className="space-y-2">
                          {product.main_features.map((feature, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center border-b border-blue-100 dark:border-blue-800 pb-2 last:border-0">
                              <div className="font-medium text-sm text-blue-800 dark:text-blue-300">
                                {feature.feature}:
                              </div>
                              <div className="col-span-2 text-sm text-gray-700 dark:text-gray-300">
                                <Input
                                  value={feature.value || feature.description || ""}
                                  onChange={(e) => {
                                    const newFeatures = [...(product.main_features || [])];
                                    // Asignar a ambas propiedades para asegurar compatibilidad
                                    newFeatures[index].value = e.target.value;
                                    newFeatures[index].description = e.target.value;
                                    setProduct({ ...product, main_features: newFeatures });
                                  }}
                                  className="bg-white/70 dark:bg-gray-800/70 border-blue-200 dark:border-blue-900 focus-visible:ring-blue-500 h-8"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No hay características disponibles. Se añadirán al obtener información del producto.
                        </div>
                      )}

                      <Button
                        onClick={() => {
                          const newFeatures = [...(product.main_features || [])];
                          newFeatures.push({ feature: "Nueva característica", value: "" });
                          setProduct({ ...product, main_features: newFeatures });
                        }}
                        variant="outline"
                        size="sm"
                        className="mt-3 border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs"
                      >
                        + Añadir característica
                      </Button>
                    </div>

                    {/* Especificaciones técnicas */}
                    <div className="mt-4 bg-purple-50/50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3 text-purple-700 dark:text-purple-400 flex items-center">
                        <Zap className="h-4 w-4 mr-2" />
                        Especificaciones técnicas
                      </h3>
                      
                      {product.technical_specs && product.technical_specs.length > 0 ? (
                        <div className="space-y-2">
                          {product.technical_specs.map((spec, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center border-b border-purple-100 dark:border-purple-800 pb-2 last:border-0">
                              <div className="font-medium text-sm text-purple-800 dark:text-purple-300">
                                {spec.spec}
                              </div>
                              <div className="col-span-2 text-sm text-gray-700 dark:text-gray-300">
                                <Input
                                  value={spec.value || spec.description || ""}
                                  onChange={(e) => {
                                    const newSpecs = [...(product.technical_specs || [])];
                                    // Asignar a ambas propiedades para asegurar compatibilidad
                                    newSpecs[index].value = e.target.value;
                                    newSpecs[index].description = e.target.value;
                                    setProduct({ ...product, technical_specs: newSpecs });
                                  }}
                                  className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-purple-900 focus-visible:ring-purple-500 h-8"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No hay especificaciones técnicas disponibles. Se añadirán al obtener información del producto.
                        </div>
                      )}

                      <Button
                        onClick={() => {
                          const newSpecs = [...(product.technical_specs || [])];
                          newSpecs.push({ spec: "Nueva especificación", value: "" });
                          setProduct({ ...product, technical_specs: newSpecs });
                        }}
                        variant="outline"
                        size="sm"
                        className="mt-3 border-purple-200 dark:border-purple-900 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs"
                      >
                        + Añadir especificación
                      </Button>
                    </div>

                    <div className="flex justify-between mt-6">
                      <Button
                        onClick={async () => {
                          try {
                            setError(null);
                            await ProductService.updateProduct(product);
                            // Mostrar un mensaje de éxito temporal
                            setError({
                              status: 200,
                              message: "Información del producto actualizada correctamente",
                              details: "Los cambios han sido guardados"
                            });
                            setTimeout(() => setError(null), 3000);
                          } catch (err) {
                            console.error("Error al actualizar el producto:", err);
                            if ((err as APIError).status !== undefined) {
                              setError(err as APIError);
                            } else {
                              setError({
                                status: 500,
                                message: `Error: ${(err as Error).message || 'Desconocido'}`,
                                details: 'No se pudo actualizar la información del producto'
                              });
                            }
                          }
                        }}
                        variant="outline"
                        className="border-purple-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors"
                        type="button"
                      >
                        Guardar cambios
                      </Button>
                      
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={() => setActiveStep(1)}
                          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                          type="button"
                        >
                          Continuar a configuración de bots
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                          >
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </motion.div>
                        </Button>
                      </motion.div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeStep === 1 && (
              <Card className="border-purple-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    Configuración de bots
                  </CardTitle>
                  <CardDescription>Ajusta los parámetros para la generación de perfiles de bots</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column - Demographics */}
                    <div>
                      <div className="mb-8">
                        <h3 className="text-xl font-bold mb-4">Tamaño de la población</h3>
                        <CustomRangeSlider
                          label=""
                          minLabel="min"
                          maxLabel="max"
                          minValue={populationRange[0]}
                          maxValue={populationRange[1]}
                          absoluteMin={1}
                          absoluteMax={20}
                          onChange={(min, max) => setPopulationRange([min, max])}
                        />
                      </div>

                      <div className="mb-8">
                        <h3 className="text-xl font-bold mb-4">Demografía</h3>

                        <div className="mb-6">
                          <h4 className="text-lg font-semibold mb-2">Edad</h4>
                          <CustomRangeSlider
                            label=""
                            minLabel="min"
                            maxLabel="max"
                            minValue={demographics.age_range[0]}
                            maxValue={demographics.age_range[1]}
                            absoluteMin={18}
                            absoluteMax={80}
                            onChange={(min, max) => setDemographics({ ...demographics, age_range: [min, max] })}
                          />
                        </div>

                        <div className="mb-6">
                          <h4 className="text-lg font-semibold mb-2">Nivel educativo</h4>
                          <CustomRangeSlider
                            label=""
                            minLabel="min"
                            maxLabel="max"
                            minValue={demographics.education_range[0]}
                            maxValue={demographics.education_range[1]}
                            absoluteMin={8}
                            absoluteMax={22}
                            onChange={(min, max) => setDemographics({ ...demographics, education_range: [min, max] })}
                          />
                        </div>

                        <div className="mb-6">
                          <h4 className="text-lg font-semibold mb-2">Género</h4>
                          <div className="flex gap-4 mt-4">
                            <Button
                              onClick={() => setDemographics({ ...demographics, gender_ratio: 100 })}
                              className={`flex-1 ${demographics.gender_ratio === 100 ? "bg-green-500 hover:bg-green-600" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}
                            >
                              M
                            </Button>
                            <Button
                              onClick={() => setDemographics({ ...demographics, gender_ratio: 50 })}
                              className={`flex-1 ${demographics.gender_ratio === 50 ? "bg-gradient-to-r from-green-500 to-orange-500 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}
                            >
                              M/F
                            </Button>
                            <Button
                              onClick={() => setDemographics({ ...demographics, gender_ratio: 0 })}
                              className={`flex-1 ${demographics.gender_ratio === 0 ? "bg-orange-500 hover:bg-orange-600" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}
                            >
                              F
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Review Settings */}
                    <div>
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-4">Configuración de reseñas</h3>
                        
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold mb-2">Sesgo de positividad</h4>
                          <CustomRangeSlider
                            label=""
                            minValue={positivityBias[0]}
                            maxValue={positivityBias[1]}
                            absoluteMin={0}
                            absoluteMax={100}
                            onChange={(min, max) => setPositivityBias([min, max])}
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Valores más altos generan reseñas más positivas
                          </p>
                        </div>

                        <div className="mb-6">
                          <h4 className="text-lg font-semibold mb-2">Verbosidad</h4>
                          <CustomRangeSlider
                            label=""
                            minValue={verbosity[0]}
                            maxValue={verbosity[1]}
                            absoluteMin={0}
                            absoluteMax={100}
                            onChange={(min, max) => setVerbosity([min, max])}
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Controla la longitud y detalle de las reseñas
                          </p>
                        </div>

                        <div className="mb-6">
                          <h4 className="text-lg font-semibold mb-2">Nivel de detalle del producto</h4>
                          <CustomRangeSlider
                            label=""
                            minValue={detailLevel[0]}
                            maxValue={detailLevel[1]}
                            absoluteMin={0}
                            absoluteMax={100}
                            onChange={(min, max) => setDetailLevel([min, max])}
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Cuánta información específica del producto incluir en las reseñas
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección de personalidad */}
                  <div className="mt-8 bg-amber-50 dark:bg-amber-950/30 p-6 rounded-xl">
                    <h3 className="text-xl font-bold mb-6">Personalidad</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="mb-6">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Introvertido</span>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Extrovertido</span>
                          </div>
                          <CustomRangeSlider
                            label=""
                            minValue={personality.introvert_extrovert[0]}
                            maxValue={personality.introvert_extrovert[1]}
                            absoluteMin={0}
                            absoluteMax={100}
                            onChange={(min, max) => setPersonality({ ...personality, introvert_extrovert: [min, max] })}
                          />
                        </div>

                        <div className="mb-6">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Analítico</span>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Creativo</span>
                          </div>
                          <CustomRangeSlider
                            label=""
                            minValue={personality.analytical_creative[0]}
                            maxValue={personality.analytical_creative[1]}
                            absoluteMin={0}
                            absoluteMax={100}
                            onChange={(min, max) => setPersonality({ ...personality, analytical_creative: [min, max] })}
                          />
                        </div>

                        <div className="mb-6">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ocupado</span>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tiempo libre</span>
                          </div>
                          <CustomRangeSlider
                            label=""
                            minValue={personality.busy_free_time[0]}
                            maxValue={personality.busy_free_time[1]}
                            absoluteMin={0}
                            absoluteMax={100}
                            onChange={(min, max) => setPersonality({ ...personality, busy_free_time: [min, max] })}
                          />
                        </div>

                        <div className="mb-6 md:mb-0">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Desorganizado</span>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Organizado</span>
                          </div>
                          <CustomRangeSlider
                            label=""
                            minValue={personality.disorganized_organized[0]}
                            maxValue={personality.disorganized_organized[1]}
                            absoluteMin={0}
                            absoluteMax={100}
                            onChange={(min, max) => setPersonality({ ...personality, disorganized_organized: [min, max] })}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="mb-6">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Independiente</span>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Cooperativo</span>
                          </div>
                          <CustomRangeSlider
                            label=""
                            minValue={personality.independent_cooperative[0]}
                            maxValue={personality.independent_cooperative[1]}
                            absoluteMin={0}
                            absoluteMax={100}
                            onChange={(min, max) =>
                              setPersonality({ ...personality, independent_cooperative: [min, max] })
                            }
                          />
                        </div>

                        <div className="mb-6">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ecologista</span>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">No ecologista</span>
                          </div>
                          <CustomRangeSlider
                            label=""
                            minValue={personality.environmentalist[0]}
                            maxValue={personality.environmentalist[1]}
                            absoluteMin={0}
                            absoluteMax={100}
                            onChange={(min, max) => setPersonality({ ...personality, environmentalist: [min, max] })}
                          />
                        </div>

                        <div className="mb-6">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Seguro</span>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Arriesgado</span>
                          </div>
                          <CustomRangeSlider
                            label=""
                            minValue={personality.safe_risky[0]}
                            maxValue={personality.safe_risky[1]}
                            absoluteMin={0}
                            absoluteMax={100}
                            onChange={(min, max) => setPersonality({ ...personality, safe_risky: [min, max] })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => setActiveStep(0)}
                        variant="outline"
                        className="border-purple-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a información del producto
                      </Button>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={generateBots}
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity relative overflow-hidden"
                        disabled={isGeneratingBots}
                      >
                        {isGeneratingBots ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              className="mr-2"
                            >
                              <Zap className="h-4 w-4" />
                            </motion.div>
                            <span className="relative z-10">Generando perfiles de bot...</span>
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
                              animate={{
                                x: ["-100%", "100%"],
                              }}
                              transition={{
                                repeat: Number.POSITIVE_INFINITY,
                                duration: 2,
                                ease: "linear",
                              }}
                              style={{ opacity: 0.3 }}
                            />
                          </>
                        ) : (
                          <>
                            <UserCircle2 className="mr-2 h-4 w-4" />
                            <span>Generar perfiles de bot</span>
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fase para ver los perfiles generados */}
            {activeStep === 2 && (
              <Card className="border-purple-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle2 className="h-5 w-5 text-purple-500" />
                    Perfiles de bot
                  </CardTitle>
                  <CardDescription>Revisa los perfiles de bot generados antes de crear las reseñas</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bots.map((bot, index) => (
                      <motion.div
                        key={bot.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="h-full border-purple-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 border-2 border-purple-200 dark:border-gray-700">
                                <AvatarImage src={bot.avatar} alt={bot.name} />
                                <AvatarFallback
                                  className={`${bot.gender === "Male" ? "bg-gradient-to-br from-blue-500 to-indigo-500" : "bg-gradient-to-br from-pink-500 to-purple-500"} text-white flex items-center justify-center`}
                                >
                                  {bot.gender === "Male" ? (
                                    <MaleIcon className="h-6 w-6" />
                                  ) : (
                                    <FemaleIcon className="h-6 w-6" />
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg">{bot.name}</CardTitle>
                                <CardDescription>
                                  {bot.age} • {bot.gender === "Male" ? "Hombre" : "Mujer"} • {bot.location}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{bot.education_level}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{bot.bio}</p>

                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Rasgos de personalidad
                              </h4>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                <div>
                                  <div className="flex justify-between">
                                    <span>Introvertido</span>
                                    <span>Extrovertido</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-1">
                                    <div
                                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full"
                                      style={{ width: `${Math.round(bot.personality.introvert_extrovert)}%` }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between">
                                    <span>Analítico</span>
                                    <span>Creativo</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-1">
                                    <div
                                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full"
                                      style={{ width: `${Math.round(bot.personality.analytical_creative)}%` }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between">
                                    <span>Ocupado</span>
                                    <span>Tiempo libre</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-1">
                                    <div
                                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full"
                                      style={{ width: `${Math.round(bot.personality.busy_free_time)}%` }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between">
                                    <span>Desorganizado</span>
                                    <span>Organizado</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-1">
                                    <div
                                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full"
                                      style={{ width: `${Math.round(bot.personality.disorganized_organized)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex justify-between mt-8">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => setActiveStep(1)}
                        variant="outline"
                        className="border-purple-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a configuración
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={generateReviews}
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                        disabled={isGeneratingReviews}
                      >
                        {isGeneratingReviews ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              className="mr-2"
                            >
                              <Zap className="h-4 w-4" />
                            </motion.div>
                            Generando reseñas...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Generar reseñas
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fase para ver las reseñas generadas */}
            {activeStep === 3 && (
              <Card className="border-purple-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-500" />
                    Reseñas generadas
                  </CardTitle>
                  <CardDescription>Reseñas generadas por los perfiles de bot según tu configuración</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b border-purple-100 dark:border-gray-800">
                    <div className="flex-shrink-0">
                      <motion.img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="h-32 w-32 object-contain rounded-md"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{product.description}</p>
                      <p className="text-lg font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                        {product.price}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Categoría: {product.category}</p>

                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
                          return (
                            <motion.div
                              key={star}
                              initial={{ scale: 0, rotate: -30 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: star * 0.1, type: "spring" }}
                            >
                              <Star
                                className={`h-5 w-5 ${star <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                              />
                            </motion.div>
                          )
                        })}
                        <span className="ml-2 text-sm font-medium">
                          {reviews.length > 0
                            ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                            : "0.0"}{" "}
                          de 5
                        </span>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          ({reviews.length} reseñas)
                        </span>
                      </div>
                      
                      {/* Botón para mostrar detalles */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 text-xs border-purple-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-800"
                        onClick={() => setShowProductDetails(prevState => !prevState)}
                      >
                        {showProductDetails ? 'Ocultar detalles' : 'Ver detalles del producto'}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Detalles del producto (características y especificaciones) */}
                  <AnimatePresence>
                    {showProductDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden mb-6"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Características principales */}
                          <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <h4 className="text-md font-semibold mb-3 text-blue-700 dark:text-blue-400 flex items-center">
                              <Sparkles className="h-4 w-4 mr-2" />
                              Características principales
                            </h4>
                            
                            {product.main_features && product.main_features.length > 0 ? (
                              <div className="space-y-2">
                                {product.main_features.map((feature, index) => (
                                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center border-b border-blue-100 dark:border-blue-800 pb-2 last:border-0">
                                    <div className="font-medium text-sm text-blue-800 dark:text-blue-300">
                                      {feature.feature}:
                                    </div>
                                    <div className="col-span-2 text-sm text-gray-700 dark:text-gray-300">
                                      {feature.value || feature.description || ""}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                No hay características disponibles. Se añadirán al obtener información del producto.
                              </div>
                            )}
                          </div>
                          
                          {/* Especificaciones técnicas */}
                          <div className="bg-purple-50/50 dark:bg-purple-900/20 p-4 rounded-lg">
                            <h4 className="text-md font-semibold mb-3 text-purple-700 dark:text-purple-400 flex items-center">
                              <Zap className="h-4 w-4 mr-2" />
                              Especificaciones técnicas
                            </h4>
                            
                            {product.technical_specs && product.technical_specs.length > 0 ? (
                              <div className="space-y-2">
                                {product.technical_specs.map((spec, index) => (
                                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center border-b border-purple-100 dark:border-purple-800 pb-2 last:border-0">
                                    <div className="font-medium text-sm text-purple-800 dark:text-purple-300">
                                      {spec.spec}
                                    </div>
                                    <div className="col-span-2 text-sm text-gray-700 dark:text-gray-300">
                                      {spec.value || spec.description || ""}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                No hay especificaciones técnicas disponibles. Se añadirán al obtener información del producto.
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                    {reviews.map((review, index) => {
                      const bot = bots.find((b) => b.id === review.bot_id)
                      return (
                        <motion.div
                          key={review.id}
                          className="border-b border-purple-100 dark:border-gray-800 pb-6 last:border-0"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-8 w-8 border-2 border-purple-200 dark:border-gray-700">
                              <AvatarImage src={bot?.avatar} alt={bot?.name} />
                              <AvatarFallback
                                className={`${bot?.gender === "Male" ? "bg-gradient-to-br from-blue-500 to-indigo-500" : "bg-gradient-to-br from-pink-500 to-purple-500"} text-white flex items-center justify-center`}
                              >
                                {bot?.gender === "Male" ? (
                                  <MaleIcon className="h-4 w-4" />
                                ) : (
                                  <FemaleIcon className="h-4 w-4" />
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{bot?.name}</span>
                          </div>

                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                              />
                            ))}
                          </div>

                          <h4 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">{review.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Reseña del {review.date}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{review.content}</p>

                          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            {review.helpful_votes || 0} personas encontraron esto útil
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  <div className="flex justify-between mt-8">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => setActiveStep(2)}
                        variant="outline"
                        className="border-purple-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a perfiles
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={generateAnalysis}
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                        disabled={isGeneratingAnalysis}
                      >
                        {isGeneratingAnalysis ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              className="mr-2"
                            >
                              <Zap className="h-4 w-4" />
                            </motion.div>
                            Analizando reseñas...
                          </>
                        ) : (
                          <>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Generar dashboard
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fase de dashboard con análisis */}
            {activeStep === 4 && analysisResult && (
              <div className="space-y-6">
                <Card className="border-purple-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-500" />
                      Dashboard de análisis de reseñas
                    </CardTitle>
                    <CardDescription>
                      Análisis e insights basados en {reviews.length} reseñas para {product.name}
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
                              {(analysisResult?.average_rating ?? 0).toFixed(1)}
                            </div>
                            <div className="text-xl text-gray-400 mt-2 ml-1">/5</div>
                          </div>
                          <div className="flex items-center justify-center mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-5 w-5 ${star <= Math.round(analysisResult?.average_rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
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
                          <SentimentPieChart />
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
                                <span className="text-gray-500 dark:text-gray-400">Proporción de géneros</span>
                                <span className="font-medium">
                                  {demographics.gender_ratio}% H / {100 - demographics.gender_ratio}% M
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${demographics.gender_ratio}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-500 dark:text-gray-400">Educación</span>
                                <span className="font-medium">
                                  {demographics.education_range[0]}-{demographics.education_range[1]} años
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
                          <RatingBarChart distribution={analysisResult?.rating_distribution || [0, 0, 0, 0, 0]} />
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
                          <KeywordCloud keywords={analysisResult?.keyword_analysis || []} />
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
                              {analysisResult?.positive_points?.map((point, index) => (
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
                              )) || <li className="text-gray-500 dark:text-gray-400">No hay puntos positivos identificados</li>}
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
                              {analysisResult?.negative_points?.map((point, index) => (
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
                              )) || <li className="text-gray-500 dark:text-gray-400">No hay puntos negativos identificados</li>}
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
                            {(analysisResult?.demographic_insights || []).map((insight, index) => (
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
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Agregar después del main y antes del footer */}
      {error && <ErrorMessage />}
    </div>
  )
}

