"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import AnimatedBackground from "@/components/animated-background"
import RocketProgressBar from "@/components/rocket-progress-bar"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "next-themes"
import { ApiErrorAlert } from "@/components/api-error-alert"
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
  BotConfigRequest
} from "@/lib/types"

// Importar los componentes de fase
import { ProductPhase } from "./components/product-phase/ProductPhase"
import { ConfigPhase } from "./components/config-phase/ConfigPhase"
import { BotProfilesPhase } from "./components/bot-profiles-phase/BotProfilesPhase"
import { ReviewsPhase } from "./components/reviews-phase/ReviewsPhase"
import { DashboardPhase } from "./components/dashboard-phase/DashboardPhase"

// Componente para animación de confeti
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

export default function SimulatorPage() {
  // Dentro de la función SimulatorPage
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
    introvert_extrovert: [0, 100],
    analytical_creative: [0, 100],
    busy_free_time: [0, 100],
    disorganized_organized: [0, 100],
    independent_cooperative: [0, 100],
    environmentalist: [0, 100],
    safe_risky: [0, 100],
  })

  // State for generated bots and reviews
  const [bots, setBots] = useState<BotProfile[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [activeStep, setActiveStep] = useState(0)
  const [checkpointStep, setCheckpointStep] = useState(0)
  const [isGeneratingBots, setIsGeneratingBots] = useState(false)
  const [isGeneratingReviews, setIsGeneratingReviews] = useState(false)
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<APIError | null>(null)
  const [productId, setProductId] = useState<number | undefined>(undefined)

  // Actualizar los pasos para incluir la nueva fase de dashboard
  const steps = ["Producto", "Configuración", "Perfiles", "Reseñas", "Dashboard"]

  // Function to generate bot profiles
  const generateBots = async () => {
    setIsGeneratingBots(true)
    setError(null)

    try {
      // Usar el rango de población para determinar el número de bots
      const numReviewers = Math.floor(Math.random() * 
        (populationRange[1] - populationRange[0] + 1)) + populationRange[0];
      
      // Ejecutar fase 2 para generar perfiles de bot (solo inicia el proceso)
      await BotService.generateBots(numReviewers);
      
      // Implementar un sistema de polling para verificar cuando los perfiles estén listos
      let attemptCount = 0;
      const maxAttempts = 30; // Intentar por 5 minutos (30 intentos x 10 segundos)
      const pollingInterval = 10000; // 10 segundos entre cada intento
      
      const checkBotProfiles = async () => {
        if (attemptCount >= maxAttempts) {
          setIsGeneratingBots(false); // Asegurarse de desactivar el estado de generación
          throw {
            status: 408, // Request Timeout
            message: 'Tiempo de espera agotado',
            details: 'Los perfiles de bot no se generaron en el tiempo esperado. Intenta nuevamente.'
          };
        }
        
        try {
          console.log(`Intento ${attemptCount + 1} de ${maxAttempts} para verificar perfiles de bot...`);
          const profiles = await BotService.getReviewerProfiles();
          
          if (profiles && Array.isArray(profiles) && profiles.length > 0) {
            console.log('Perfiles de bot generados exitosamente:', profiles);
            setBots(profiles);
            setActiveStep(2);
            setCheckpointStep(2);
            setIsGeneratingBots(false); // Desactivar el estado de generación al terminar exitosamente
            return true; // Éxito, terminar el polling
          } else {
            console.log('Los perfiles de bot aún no están listos, esperando...');
            attemptCount++;
            // Programar el próximo intento
            setTimeout(checkBotProfiles, pollingInterval);
            return false; // Continuar con el polling
          }
        } catch (err) {
          console.error('Error al verificar perfiles de bot:', err);
          // Si hay un error pero no es 404 (no encontrado), considerarlo como crítico
          if ((err as APIError).status !== 404) {
            setIsGeneratingBots(false); // Desactivar en caso de error crítico
            throw err;
          }
          attemptCount++;
          // Si es 404, los perfiles aún no existen, seguir esperando
          setTimeout(checkBotProfiles, pollingInterval);
          return false;
        }
      };
      
      // Iniciar el proceso de polling después de un breve retraso inicial
      setTimeout(checkBotProfiles, 5000);
      
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
      setIsGeneratingBots(false);
    }
  }

  // Function to generate reviews based on bot profiles
  const generateReviews = async () => {
    setIsGeneratingReviews(true)
    setError(null)

    try {
      // Ejecutar fase 3 para generar reseñas (solo inicia el proceso)
      await ReviewService.generateReviews();
      
      // Implementar un sistema de polling para verificar cuando las reseñas estén listas
      let attemptCount = 0;
      const maxAttempts = 30; // Intentar por 5 minutos (30 intentos x 10 segundos)
      const pollingInterval = 10000; // 10 segundos entre cada intento
      
      const checkReviews = async () => {
        if (attemptCount >= maxAttempts) {
          setIsGeneratingReviews(false); // Asegurarse de desactivar el estado de generación
          throw {
            status: 408, // Request Timeout
            message: 'Tiempo de espera agotado',
            details: 'Las reseñas no se generaron en el tiempo esperado. Intenta nuevamente.'
          };
        }
        
        try {
          console.log(`Intento ${attemptCount + 1} de ${maxAttempts} para verificar reseñas...`);
          const response = await ReviewService.getReviews();
          
          if (response && Array.isArray(response) && response.length > 0) {
            console.log('Reseñas generadas exitosamente:', response);
            setReviews(response);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
            setActiveStep(3);
            setCheckpointStep(3);
            setIsGeneratingReviews(false); // Desactivar el estado de generación al terminar exitosamente
            return true; // Éxito, terminar el polling
          } else {
            console.log('Las reseñas aún no están listas, esperando...');
            attemptCount++;
            // Programar el próximo intento
            setTimeout(checkReviews, pollingInterval);
            return false; // Continuar con el polling
          }
        } catch (err) {
          console.error('Error al verificar reseñas:', err);
          // Si hay un error pero no es 404 (no encontrado), considerarlo como crítico
          if ((err as APIError).status !== 404) {
            setIsGeneratingReviews(false); // Desactivar en caso de error crítico
            throw err;
          }
          attemptCount++;
          // Si es 404, las reseñas aún no existen, seguir esperando
          setTimeout(checkReviews, pollingInterval);
          return false;
        }
      };
      
      // Iniciar el proceso de polling después de un breve retraso inicial
      setTimeout(checkReviews, 5000);
      
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
      setIsGeneratingReviews(false);
    }
  }

  // Function to generate analysis based on reviews
  const generateAnalysis = async () => {
    setIsGeneratingAnalysis(true)
    setError(null)

    try {
      // Ejecutar fase 4 para generar análisis (solo inicia el proceso)
      await AnalysisService.generateAnalysis();
      
      // Implementar un sistema de polling para verificar cuando el análisis esté listo
      let attemptCount = 0;
      const maxAttempts = 30; // Intentar por 5 minutos (30 intentos x 10 segundos)
      const pollingInterval = 10000; // 10 segundos entre cada intento
      
      const checkAnalysis = async () => {
        if (attemptCount >= maxAttempts) {
          setIsGeneratingAnalysis(false); // Asegurarse de desactivar el estado de generación
          throw {
            status: 408, // Request Timeout
            message: 'Tiempo de espera agotado',
            details: 'El análisis no se generó en el tiempo esperado. Intenta nuevamente.'
          };
        }
        
        try {
          console.log(`Intento ${attemptCount + 1} de ${maxAttempts} para verificar análisis...`);
          const analysis = await AnalysisService.getAnalysis();
          
          if (analysis && Object.keys(analysis).length > 0) {
            console.log('Análisis generado exitosamente:', JSON.stringify(analysis, null, 2));
            
            // Verificar el formato de rating_distribution
            let safeAnalysis = analysis;
            
            if (!safeAnalysis.rating_distribution) {
              console.warn('No se encontró rating_distribution en el análisis');
              safeAnalysis.rating_distribution = [0, 0, 0, 0, 0];
            } else if (Array.isArray(safeAnalysis.rating_distribution)) {
              // Mantener el formato de array
              console.log('rating_distribution es un array:', safeAnalysis.rating_distribution);
            } else if (typeof safeAnalysis.rating_distribution === 'object') {
              // Si es un objeto, verificar que tenga el formato esperado
              console.log('rating_distribution es un objeto:', safeAnalysis.rating_distribution);
            }
            
            setAnalysisResult(safeAnalysis);
            setActiveStep(4);
            setCheckpointStep(4);
            setIsGeneratingAnalysis(false); // Desactivar el estado de generación al terminar exitosamente
            return true; // Éxito, terminar el polling
          } else {
            console.log('El análisis aún no está listo, esperando...');
            attemptCount++;
            // Programar el próximo intento
            setTimeout(checkAnalysis, pollingInterval);
            return false; // Continuar con el polling
          }
        } catch (err) {
          console.error('Error al verificar análisis:', err);
          // Si hay un error pero no es 404 (no encontrado), considerarlo como crítico
          if ((err as APIError).status !== 404) {
            setIsGeneratingAnalysis(false); // Desactivar en caso de error crítico
            throw err;
          }
          attemptCount++;
          // Si es 404, el análisis aún no existe, seguir esperando
          setTimeout(checkAnalysis, pollingInterval);
          return false;
        }
      };
      
      // Iniciar el proceso de polling después de un breve retraso inicial
      setTimeout(checkAnalysis, 5000);
      
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
      setIsGeneratingAnalysis(false);
    }
  }

  // Función para cargar los resultados actuales
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
        let newCheckpoint = 0;
        if (results.analysis && Object.keys(results.analysis).length > 0) {
          newCheckpoint = 4;
        } else if (results.reviews && results.reviews.length > 0) {
          newCheckpoint = 3;
        } else if (results.reviewers && results.reviewers.length > 0) {
          newCheckpoint = 2;
        } else if (results.product && Object.keys(results.product).length > 0) {
          newCheckpoint = 0; // Si hay información del producto, ir a la fase de configuración
        }
        
        setActiveStep(newCheckpoint);
        setCheckpointStep(newCheckpoint);
      } else {
        setActiveStep(0); // Si no hay resultados disponibles, iniciar en la fase 0
        setCheckpointStep(0);
      }
    } catch (err) {
      console.error("Error al cargar los resultados:", err);
      // No mostrar error si no hay resultados disponibles aún (simplemente ir a fase 0)
      if ((err as APIError).status === 404) {
        setActiveStep(0);
        setCheckpointStep(0);
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
              // Solo permitir ir a pasos hasta el checkpoint actual
              if (step <= checkpointStep) {
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
              <ProductPhase 
                product={product}
                setProduct={setProduct}
                setActiveStep={(step) => {
                  setActiveStep(step);
                  // Al configurar el producto, establecemos el checkpoint en 1 (fase de configuración)
                  setCheckpointStep(1);
                }}
                isGeneratingBots={isGeneratingBots}
                setIsGeneratingBots={setIsGeneratingBots}
                setError={setError}
              />
            )}

            {activeStep === 1 && (
              <ConfigPhase 
                populationRange={populationRange}
                setPopulationRange={setPopulationRange}
                positivityBias={positivityBias}
                setPositivityBias={setPositivityBias}
                verbosity={verbosity}
                setVerbosity={setVerbosity}
                detailLevel={detailLevel}
                setDetailLevel={setDetailLevel}
                demographics={demographics}
                setDemographics={setDemographics}
                personality={personality}
                setPersonality={setPersonality}
                generateBots={generateBots}
                setActiveStep={setActiveStep}
                isGeneratingBots={isGeneratingBots}
              />
            )}

            {/* Fase para ver los perfiles generados */}
            {activeStep === 2 && (
              <BotProfilesPhase
                bots={bots}
                generateReviews={generateReviews}
                setActiveStep={setActiveStep}
                isGeneratingReviews={isGeneratingReviews}
              />
            )}

            {/* Fase para ver las reseñas generadas */}
            {activeStep === 3 && (
              <ReviewsPhase
                product={product}
                bots={bots}
                reviews={reviews}
                generateAnalysis={generateAnalysis}
                setActiveStep={setActiveStep}
                isGeneratingAnalysis={isGeneratingAnalysis}
              />
            )}

            {/* Fase de dashboard con análisis */}
            {activeStep === 4 && analysisResult && (
              <DashboardPhase
                product={product}
                analysisResult={analysisResult}
                setActiveStep={setActiveStep}
                setBots={setBots}
                setReviews={setReviews}
                setAnalysisResult={setAnalysisResult}
                demographics={demographics}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

