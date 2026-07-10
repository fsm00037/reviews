"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
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
import { AuthModal } from "@/components/auth-modal"

// Importar servicios API y tipos
import { ProductService, BotService, ReviewService, AnalysisService, getSessionId } from "@/lib/api-services"
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
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string } | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("review_simulator_user")
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored))
        } catch (e) {}
      }
    }
  }, [])

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
  const [populationSize, setPopulationSize] = useState<number>(5)
  const [positivityBias, setPositivityBias] = useState<[number, number]>([60, 80])
  const [verbosity, setVerbosity] = useState<[number, number]>([40, 70])
  const [detailLevel, setDetailLevel] = useState<[number, number]>([50, 80])

  // New demographic configuration
  const [demographics, setDemographics] = useState<DemographicConfig>({
    age_range: [25, 45],
    education_level: "Mixed", // Opción mixta por defecto
    gender_ratio: "Male&Female", // Opción mixta por defecto
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

  // State for product adaptation
  const [adaptToProduct, setAdaptToProduct] = useState<boolean>(true)

  // State for population prompt and custom configuration mode
  const [populationPrompt, setPopulationPrompt] = useState<string>("")
  const [useCustomConfig, setUseCustomConfig] = useState<boolean>(false)

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

  const eventSourceRef = useRef<EventSource | null>(null);

  // Función para conectar a Server-Sent Events (SSE)
  const connectSSE = (
    phase: 'phase2' | 'phase3',
    onMessage: (message: { type: string; data: any }) => void,
    onError: () => void
  ): EventSource | null => {
    if (typeof window === 'undefined') return null;

    // Asegurarse de cerrar conexiones previas
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sessionId = getSessionId();
    const API_URL_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const sseUrl = `${API_URL_BASE}/api/events/${sessionId}`;
    
    console.log(`[SSE] Conectando a canal de eventos: ${sseUrl}`);
    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log(`[SSE] Evento recibido (${phase}):`, message.type);
        
        if (message.type === 'ping' || message.type === 'connected') {
          return;
        }
        
        onMessage(message);
      } catch (err) {
        console.error('[SSE] Error al parsear mensaje:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn(`[SSE] Error o desconexión en canal de eventos de ${phase}:`, err);
      eventSource.close();
      if (eventSourceRef.current === eventSource) {
        eventSourceRef.current = null;
      }
      onError();
    };

    return eventSource;
  };

  // Function to generate bot profiles
  const generateBots = async () => {
    setIsGeneratingBots(true)
    setError(null)
    // Transición inmediata a la fase de perfiles para mostrar la generación uno a uno en tiempo real
    setActiveStep(2)
    setCheckpointStep(2)

    let sseSource: EventSource | null = null;
    let isConnected = false;
    const numReviewers = populationSize;

    // --- FALLBACK DE POLLING ROBUSTO ---
    let attemptCount = 0;
    const maxAttempts = 100;
    const pollingInterval = 3000;
    
    const checkBotProfilesFallback = async () => {
      if (attemptCount >= maxAttempts) {
        setIsGeneratingBots(false);
        throw {
          status: 408,
          message: 'Tiempo de espera agotado',
          details: 'Los perfiles de bot no se generaron en el tiempo esperado. Intenta nuevamente.'
        };
      }
      
      try {
        console.log(`[Fallback Polling] Intento ${attemptCount + 1} de ${maxAttempts}...`);
        const statusInfo = await SimulatorService.getPhaseStatus('phase2');
        const profiles = await BotService.getReviewerProfiles();
        
        if (profiles && Array.isArray(profiles)) {
          if (profiles.length > 0) {
            setBots(profiles);
          }
          
          if (statusInfo.status === 'completed' || profiles.length === numReviewers) {
            console.log('[Fallback Polling] Fase 2 completada. Obtenidos:', profiles.length);
            setIsGeneratingBots(false);
            return true;
          } else if (statusInfo.status === 'failed') {
            setIsGeneratingBots(false);
            throw {
              status: 500,
              message: 'Error al generar perfiles (Fallback)',
              details: statusInfo.error || 'La Fase 2 falló críticamente en el backend'
            };
          } else {
            attemptCount++;
            setTimeout(checkBotProfilesFallback, pollingInterval);
            return false;
          }
        }
      } catch (err) {
        console.error('[Fallback Polling] Error:', err);
        if ((err as APIError).status === 404) {
          attemptCount++;
          setTimeout(checkBotProfilesFallback, pollingInterval);
          return false;
        }
        setIsGeneratingBots(false);
        throw err;
      }
    };

    const startFallback = () => {
      if (isConnected) return;
      console.log('[SSE Fallback] Activando polling de respaldo para perfiles...');
      setTimeout(checkBotProfilesFallback, 1000);
    };

    try {
      // 1. Conectar a SSE antes de lanzar la tarea
      sseSource = connectSSE(
        'phase2',
        async (message) => {
          isConnected = true;
          if (message.type === 'profile_generated') {
            const newBot = message.data;
            setBots((prev) => {
              const filtered = prev.filter((b) => b.id !== newBot.id);
              return [...filtered, newBot].sort((a, b) => a.id - b.id);
            });
          } else if (message.type === 'phase2_completed') {
            console.log('[SSE] Fase 2 completada reportada por eventos');
            try {
              const res = await BotService.getReviewerProfiles();
              if (res && Array.isArray(res)) setBots(res);
            } catch (e) {
              console.error('Error en fetch final de perfiles:', e);
            }
            setIsGeneratingBots(false);
            sseSource?.close();
          } else if (message.type === 'phase2_failed') {
            console.error('[SSE] Fase 2 falló reportada por eventos:', message.data.error);
            setError({
              status: 500,
              message: 'Error al generar perfiles',
              details: message.data.error || 'La generación falló en el backend'
            });
            setIsGeneratingBots(false);
            sseSource?.close();
          }
        },
        () => {
          startFallback();
        }
      );

      // 2. Ejecutar fase 2 en segundo plano
      await BotService.generateBots(
        numReviewers,
        [populationSize, populationSize],
        positivityBias,
        verbosity,
        detailLevel,
        demographics,
        personality,
        adaptToProduct,
        undefined, // modelName
        useCustomConfig ? undefined : populationPrompt // only use populationPrompt if they are not in custom configuration mode
      );
      
      // 3. Temporizador de seguridad: si tras 4 segundos no hay ningún perfil recibido, arrancar el fallback
      setTimeout(() => {
        setBots((currentBots) => {
          if (currentBots.length === 0) {
            console.log('[SSE] Sin perfiles recibidos en 4s. Activando polling de seguridad.');
            startFallback();
          }
          return currentBots;
        });
      }, 4000);
      
    } catch (err) {
      console.error("Error al generar los bots:", err);
      sseSource?.close();
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
    // Transición inmediata a la fase de reseñas para mostrar la generación en directo
    setActiveStep(3)
    setCheckpointStep(3)

    let sseSource: EventSource | null = null;
    let isConnected = false;

    // --- FALLBACK DE POLLING ROBUSTO ---
    let attemptCount = 0;
    const maxAttempts = 100;
    const pollingInterval = 3000;
    
    const checkReviewsFallback = async () => {
      if (attemptCount >= maxAttempts) {
        setIsGeneratingReviews(false);
        throw {
          status: 408,
          message: 'Tiempo de espera agotado',
          details: 'Las reseñas no se generaron en el tiempo esperado. Intenta nuevamente.'
        };
      }
      
      try {
        console.log(`[Fallback Polling] Intento ${attemptCount + 1} de ${maxAttempts}...`);
        const statusInfo = await SimulatorService.getPhaseStatus('phase3');
        const response = await ReviewService.getReviews();
        
        if (response && Array.isArray(response)) {
          if (response.length > 0) {
            setReviews(response);
          }
          
          if (statusInfo.status === 'completed' || response.length === bots.length) {
            console.log('[Fallback Polling] Fase 3 completada. Obtenidas:', response.length);
            if (response.length > 0) {
              setReviews(response);
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 3000);
            }
            setIsGeneratingReviews(false);
            return true;
          } else if (statusInfo.status === 'failed') {
            setIsGeneratingReviews(false);
            throw {
              status: 500,
              message: 'Error al generar reseñas (Fallback)',
              details: statusInfo.error || 'La Fase 3 falló críticamente en el backend'
            };
          } else {
            attemptCount++;
            setTimeout(checkReviewsFallback, pollingInterval);
            return false;
          }
        }
      } catch (err) {
        console.error('[Fallback Polling] Error:', err);
        if ((err as APIError).status === 404) {
          attemptCount++;
          setTimeout(checkReviewsFallback, pollingInterval);
          return false;
        }
        setIsGeneratingReviews(false);
        throw err;
      }
    };

    const startFallback = () => {
      if (isConnected) return;
      console.log('[SSE Fallback] Activando polling de respaldo para reseñas...');
      setTimeout(checkReviewsFallback, 1000);
    };

    try {
      // Verificar que tenemos los datos necesarios
      if (!product || Object.keys(product).length === 0) {
        throw {
          status: 400,
          message: 'Información del producto no disponible',
          details: 'Se requiere la información del producto para generar reseñas'
        };
      }

      if (!bots || bots.length === 0) {
        throw {
          status: 400,
          message: 'Perfiles de usuario no disponibles',
          details: 'Se requieren los perfiles de usuario para generar reseñas'
        };
      }

      // 1. Conectar a SSE antes de lanzar la tarea
      sseSource = connectSSE(
        'phase3',
        async (message) => {
          isConnected = true;
          if (message.type === 'review_generated') {
            const newReview = message.data;
            setReviews((prev) => {
              const filtered = prev.filter((r) => r.id !== newReview.id);
              return [...filtered, newReview].sort((a, b) => a.id - b.id);
            });
          } else if (message.type === 'phase3_completed') {
            console.log('[SSE] Fase 3 completada reportada por eventos');
            try {
              const res = await ReviewService.getReviews();
              if (res && Array.isArray(res)) setReviews(res);
            } catch (e) {
              console.error('Error en fetch final de reseñas:', e);
            }
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
            setIsGeneratingReviews(false);
            sseSource?.close();
          } else if (message.type === 'phase3_failed') {
            console.error('[SSE] Fase 3 falló reportada por eventos:', message.data.error);
            setError({
              status: 500,
              message: 'Error al generar reseñas',
              details: message.data.error || 'La generación falló en el backend'
            });
            setIsGeneratingReviews(false);
            sseSource?.close();
          }
        },
        () => {
          startFallback();
        }
      );

      // 2. Ejecutar fase 3
      await ReviewService.generateReviews(product, bots);
      
      // 3. Temporizador de seguridad: si tras 4 segundos no hay ninguna reseña recibida, arrancar el fallback
      setTimeout(() => {
        setReviews((currentReviews) => {
          if (currentReviews.length === 0) {
            console.log('[SSE] Sin reseñas recibidas en 4s. Activando polling de seguridad.');
            startFallback();
          }
          return currentReviews;
        });
      }, 4000);
      
    } catch (err) {
      console.error("Error al generar las reseñas:", err);
      sseSource?.close();
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

  // Función para cargar los resultados actuales y reconectar a procesos activos
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

        // --- RECONEXIÓN AUTOMÁTICA SSE SI HAY GENERACIÓN ACTIVA ---
        try {
          const status2 = await SimulatorService.getPhaseStatus('phase2');
          if (status2.status === 'running' || status2.status === 'pending') {
            setIsGeneratingBots(true);
            const numReviewers = results.reviewers.length || populationSize; // Intentar deducir la población
            
            let isConnected = false;
            let attemptCount = 0;
            const maxAttempts = 100;
            const pollingInterval = 3000;

            const checkBotProfilesFallback = async () => {
              if (attemptCount >= maxAttempts) { setIsGeneratingBots(false); return; }
              try {
                const s = await SimulatorService.getPhaseStatus('phase2');
                const p = await BotService.getReviewerProfiles();
                if (p && Array.isArray(p)) {
                  if (p.length > 0) setBots(p);
                  if (s.status === 'completed' || p.length === numReviewers) {
                    setIsGeneratingBots(false);
                    return;
                  } else if (s.status === 'failed') {
                    setIsGeneratingBots(false);
                    return;
                  } else {
                    attemptCount++;
                    setTimeout(checkBotProfilesFallback, pollingInterval);
                  }
                }
              } catch (e) {
                attemptCount++;
                setTimeout(checkBotProfilesFallback, pollingInterval);
              }
            };

            const sse2 = connectSSE(
              'phase2',
              (message) => {
                isConnected = true;
                if (message.type === 'profile_generated') {
                  const newBot = message.data;
                  setBots((prev) => {
                    const filtered = prev.filter((b) => b.id !== newBot.id);
                    return [...filtered, newBot].sort((a, b) => a.id - b.id);
                  });
                } else if (message.type === 'phase2_completed') {
                  setIsGeneratingBots(false);
                  sse2?.close();
                } else if (message.type === 'phase2_failed') {
                  setIsGeneratingBots(false);
                  sse2?.close();
                }
              },
              () => {
                if (!isConnected) setTimeout(checkBotProfilesFallback, 1000);
              }
            );

            setTimeout(() => {
              setBots((currentBots) => {
                if (currentBots.length === 0) {
                  console.log('[SSE Reconexión] Sin perfiles en 4s. Activando polling.');
                  setTimeout(checkBotProfilesFallback, 1000);
                }
                return currentBots;
              });
            }, 4000);
          }
        } catch (e) {
          console.warn('Error en reconexión Fase 2:', e);
        }

        try {
          const status3 = await SimulatorService.getPhaseStatus('phase3');
          if (status3.status === 'running' || status3.status === 'pending') {
            setIsGeneratingReviews(true);
            const numBots = results.reviewers.length;

            let isConnected = false;
            let attemptCount = 0;
            const maxAttempts = 100;
            const pollingInterval = 3000;

            const checkReviewsFallback = async () => {
              if (attemptCount >= maxAttempts) { setIsGeneratingReviews(false); return; }
              try {
                const s = await SimulatorService.getPhaseStatus('phase3');
                const r = await ReviewService.getReviews();
                if (r && Array.isArray(r)) {
                  if (r.length > 0) setReviews(r);
                  if (s.status === 'completed' || r.length === numBots) {
                    setIsGeneratingReviews(false);
                    return;
                  } else if (s.status === 'failed') {
                    setIsGeneratingReviews(false);
                    return;
                  } else {
                    attemptCount++;
                    setTimeout(checkReviewsFallback, pollingInterval);
                  }
                }
              } catch (e) {
                attemptCount++;
                setTimeout(checkReviewsFallback, pollingInterval);
              }
            };

            const sse3 = connectSSE(
              'phase3',
              (message) => {
                isConnected = true;
                if (message.type === 'review_generated') {
                  const newReview = message.data;
                  setReviews((prev) => {
                    const filtered = prev.filter((r) => r.id !== newReview.id);
                    return [...filtered, newReview].sort((a, b) => a.id - b.id);
                  });
                } else if (message.type === 'phase3_completed') {
                  setIsGeneratingReviews(false);
                  sse3?.close();
                } else if (message.type === 'phase3_failed') {
                  setIsGeneratingReviews(false);
                  sse3?.close();
                }
              },
              () => {
                if (!isConnected) setTimeout(checkReviewsFallback, 1000);
              }
            );

            setTimeout(() => {
              setReviews((currentReviews) => {
                if (currentReviews.length === 0) {
                  console.log('[SSE Reconexión] Sin reseñas en 4s. Activando polling.');
                  setTimeout(checkReviewsFallback, 1000);
                }
                return currentReviews;
              });
            }, 4000);
          }
        } catch (e) {
          console.warn('Error en reconexión Fase 3:', e);
        }

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

  // Añadir useEffect para cargar los resultados al iniciar y limpiar SSE al desmontar
  useEffect(() => {
    loadCurrentResults();
    return () => {
      if (eventSourceRef.current) {
        console.log('[SSE] Cerrando conexión de eventos activa al desmontar componente');
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <AnimatedBackground />
      {showConfetti && <Confetti />}

      <div className="container mx-auto py-8 px-6 max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center mb-8 border-b border-border/40 pb-5"
        >
          <Link href="/" className="mr-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl border-border bg-background/50 hover:bg-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Link className="flex items-center justify-center gap-2" href="/">
            <span className="font-bold text-lg tracking-tight">
              reviewsim<span className="text-primary font-extrabold">.ai</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            {currentUser && (
              <Link
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                href="/experiments"
              >
                Mis Experimentos
              </Link>
            )}
            <ThemeToggle />
            <AuthModal onStateChange={() => {
              const stored = localStorage.getItem("review_simulator_user")
              if (stored) {
                setCurrentUser(JSON.parse(stored))
              } else {
                setCurrentUser(null)
              }
            }} />
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
                populationSize={populationSize}
                setPopulationSize={setPopulationSize}
                demographics={demographics}
                setDemographics={setDemographics}
                personality={personality}
                setPersonality={setPersonality}
                adaptToProduct={adaptToProduct}
                setAdaptToProduct={setAdaptToProduct}
                generateBots={generateBots}
                setActiveStep={setActiveStep}
                isGeneratingBots={isGeneratingBots}
                bots={bots}
                setBots={setBots}
                populationPrompt={populationPrompt}
                setPopulationPrompt={setPopulationPrompt}
                useCustomConfig={useCustomConfig}
                setUseCustomConfig={setUseCustomConfig}
              />
            )}

            {/* Fase para ver los perfiles generados */}
            {activeStep === 2 && (
              <BotProfilesPhase 
                bots={bots}
                generateReviews={generateReviews}
                setActiveStep={setActiveStep}
                isGeneratingReviews={isGeneratingReviews}
                isGeneratingBots={isGeneratingBots}
                populationSize={populationSize}
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
                isGeneratingReviews={isGeneratingReviews}
                populationSize={bots.length}
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

