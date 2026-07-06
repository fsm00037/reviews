"use client"

import Link from "next/link"
import { ArrowRight, Sparkles, BarChart3, UserCircle2, MessageSquare } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AnimatedBackground from "@/components/animated-background"
import { ThemeToggle } from "@/components/theme-toggle"
import { SimulatorService } from "@/lib/api-services"
import { ApiErrorAlert } from "@/components/api-error-alert"
import { LoadingSpinner } from "@/components/loading-spinner"
import { APIError, RecentSession } from "@/lib/types"
import { ProductService } from "@/lib/api-services"

export default function Home() {
  const [hovered, setHovered] = useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<APIError | null>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessions = await SimulatorService.getRecentSessions();
        setRecentSessions(sessions || []);
      } catch (err) {
        console.error("Error loading recent sessions:", err);
      } finally {
        setIsLoadingSessions(false);
      }
    };
    fetchSessions();
  }, []);

  const handleSelectRecentSession = (sessionId: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('review_simulator_session_id', sessionId);
      router.push('/simulator');
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const handleQuickAnalysis = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!urlInputRef.current?.value) {
      setAnalyzeError({
        status: 400,
        message: "La URL del producto es obligatoria",
        details: "Por favor, ingresa la URL de un producto para analizar"
      })
      return
    }
    
    setIsAnalyzing(true)
    setAnalyzeError(null)
    
    try {
      const productUrl = urlInputRef.current.value

      // Generar un identificador de sesión nuevo y único para esta simulación
      if (typeof window !== 'undefined') {
        const newSessionId = crypto.randomUUID();
        sessionStorage.setItem('review_simulator_session_id', newSessionId);
        console.log('Nueva sesión creada:', newSessionId);
      }

      // Ejecutar sólo la fase 1: análisis del producto (inicia el proceso en segundo plano)
      await ProductService.analyzeProduct(productUrl)
      
      // Sistema de polling para verificar cuando la información del producto esté lista
      let attemptCount = 0;
      const maxAttempts = 30; // Intentar por 5 minutos (30 intentos x 10 segundos)
      const pollingInterval = 10000; // 10 segundos
      
      const checkProductReady = async (): Promise<boolean> => {
        if (attemptCount >= maxAttempts) {
          throw {
            status: 408, // Request Timeout
            message: 'Tiempo de espera agotado',
            details: 'El análisis del producto no se completó en el tiempo esperado. Intenta nuevamente.'
          };
        }
        
        try {
          console.log(`Intento ${attemptCount + 1} de ${maxAttempts} para verificar producto...`);
          const product = await ProductService.getProductInfo();
          
          if (product && product.name && product.name.trim() !== "") {
            console.log('Información del producto lista:', product);
            return true; // Listo
          }
        } catch (err) {
          console.error('Error al verificar producto:', err);
          // Si el error no es 404 (no encontrado), considerarlo como crítico
          if ((err as APIError).status !== 404) {
            throw err;
          }
        }
        
        attemptCount++;
        // Esperar antes del siguiente intento
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
        return checkProductReady();
      };
      
      // Iniciar el polling y esperar a que complete
      await checkProductReady();
      
      // Redirigir a la página del simulador
      router.push('/simulator')
    } catch (err) {
      console.error("Error al analizar el producto:", err)
      if ((err as APIError).status !== undefined) {
        setAnalyzeError(err as APIError)
      } else {
        setAnalyzeError({
          status: 500,
          message: `Error: ${(err as Error).message || 'Desconocido'}`,
          details: 'No se pudo realizar el análisis inicial del producto'
        })
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AnimatedBackground />

      <header className="px-4 lg:px-6 h-16 flex items-center backdrop-blur-md bg-white/70 dark:bg-gray-950/70 border-b border-purple-100 dark:border-gray-800 sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="#">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mr-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg p-1.5"
          >
            <Sparkles className="h-5 w-5 text-white" />
          </motion.div>
          <motion.span
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
          >
            ReviewSim 2025
          </motion.span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link
            className="text-sm font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            href="#"
          >
            About
          </Link>
          <Link
            className="text-sm font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            href="#"
          >
            Help
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex-1 relative z-10">
        <section className="w-full py-12 md:py-24 lg:py-32 overflow-hidden">
          <div className="container px-4 md:px-6 relative">
            <motion.div
              initial="hidden"
              animate="show"
              variants={container}
              className="flex flex-col items-center justify-center space-y-8 text-center relative z-10"
            >
              <motion.div variants={item} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                  className="inline-block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1 rounded-lg mb-4"
                >
                  <span className="bg-white dark:bg-gray-950 rounded-md px-3 py-1 text-sm font-medium block">
                    Simulación de Reseñas de Próxima Generación
                  </span>
                </motion.div>
                <motion.h1
                  variants={item}
                  className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                >
                  Simulador de Reseñas de Productos
                </motion.h1>
                <motion.p variants={item} className="mx-auto max-w-[700px] text-gray-600 dark:text-gray-300 md:text-xl">
                  Genera reseñas de productos con perfiles de bots impulsados por IA
                </motion.p>
              </motion.div>
              <motion.div variants={item} className="w-full max-w-sm space-y-2">
                {analyzeError && (
                  <ApiErrorAlert 
                    error={analyzeError} 
                    onDismiss={() => setAnalyzeError(null)} 
                  />
                )}
                <form onSubmit={handleQuickAnalysis} className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                  <Input
                    className="max-w-lg flex-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-purple-200 dark:border-gray-700 focus-visible:ring-purple-500"
                    placeholder="Ingresa URL del producto para iniciar el análisis"
                    type="text"
                    name="productUrl"
                    ref={urlInputRef}
                    disabled={isAnalyzing}
                    required
                  />
                  <motion.div whileHover={{ scale: isAnalyzing ? 1 : 1.05 }} whileTap={{ scale: isAnalyzing ? 1 : 0.95 }}>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity w-full sm:w-auto"
                      onMouseEnter={() => setHovered(true)}
                      onMouseLeave={() => setHovered(false)}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <LoadingSpinner text="Analizando..." size="sm" />
                      ) : (
                        <>
                          <span>Iniciar análisis</span>
                          <motion.div
                            animate={{ x: hovered ? 5 : 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </motion.div>
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
                <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
                  El análisis se realizará paso a paso en la página del simulador
                </p>
              </motion.div>

              {recentSessions.length > 0 && (
                <motion.div
                  variants={item}
                  className="w-full max-w-4xl mt-12 text-left"
                >
                  <h3 className="text-xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                    Simulaciones Recientes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentSessions.map((session) => (
                      <motion.div
                        key={session.session_id}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectRecentSession(session.session_id)}
                        className="cursor-pointer p-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border border-purple-100 dark:border-gray-800 rounded-xl hover:border-purple-300 dark:hover:border-purple-900 transition-all flex flex-col justify-between h-36 shadow-sm hover:shadow-md"
                      >
                        <div>
                          <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                            {session.product_name}
                          </h4>
                          <span className="text-xs text-gray-400 block mt-1">
                            {new Date(session.created_at).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-2 border-t border-purple-50 dark:border-gray-800">
                          {session.average_rating ? (
                            <div className="flex items-center space-x-1">
                              <span className="text-amber-500 font-bold text-sm">★</span>
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {session.average_rating.toFixed(1)} / 5.0
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                              En progreso...
                            </span>
                          )}
                          <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                            Ver simulación <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 relative z-10">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-2 lg:gap-12"
            >
              <div className="space-y-4">
                <div className="inline-block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1 rounded-lg">
                  <span className="bg-white dark:bg-gray-950 rounded-md px-3 py-1 text-sm font-medium block">
                    Cómo funciona
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                  Simula reseñas de productos en cinco simples pasos
                </h2>
                <p className="max-w-[600px] text-gray-600 dark:text-gray-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Nuestra plataforma te permite generar reseñas realistas de productos con perfiles de bots personalizables y
                  proporciona un análisis integral para mejorar tu producto.
                </p>
              </div>
              <div className="grid gap-4">
                {[
                  {
                    icon: <Sparkles className="h-5 w-5 text-indigo-500" />,
                    title: "1. Información del Producto",
                    description: "Ingresa una URL de producto o crea una nueva simulación de producto",
                    content:
                      "Nuestro sistema mostrará información detallada del producto incluyendo imágenes, descripciones y especificaciones.",
                  },
                  {
                    icon: <UserCircle2 className="h-5 w-5 text-purple-500" />,
                    title: "2. Configurar Población de Bots",
                    description: "Ajusta los parámetros para generar una población de usuarios bot realistas",
                    content:
                      "Personaliza el número de bots, distribución demográfica y rasgos de personalidad para crear un conjunto diverso de reseñadores.",
                  },
                  {
                    icon: <UserCircle2 className="h-5 w-5 text-pink-500" />,
                    title: "3. Revisar Perfiles de Bots",
                    description: "Examina los perfiles de bots generados antes de crear reseñas",
                    content:
                      "Revisa los rasgos demográficos y de personalidad de cada bot para asegurarte de que coincidan con tu público objetivo antes de generar reseñas.",
                  },
                  {
                    icon: <MessageSquare className="h-5 w-5 text-indigo-500" />,
                    title: "4. Generar Reseñas",
                    description: "Cada bot generará una reseña al estilo de Amazon basada en su perfil",
                    content:
                      "Las reseñas reflejarán la personalidad, estilo de escritura y opinión del bot sobre el producto, creando una simulación realista.",
                  },
                  {
                    icon: <BarChart3 className="h-5 w-5 text-purple-500" />,
                    title: "5. Panel de Análisis",
                    description: "Obtén información integral de las reseñas generadas",
                    content:
                      "Visualiza análisis detallados, análisis de sentimientos, fortalezas clave y áreas de mejora basadas en la retroalimentación simulada de los clientes.",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className="overflow-hidden border-purple-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-200/20 dark:hover:shadow-purple-900/20 transition-all duration-300">
                      <CardHeader className="bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          {item.icon}
                          {item.title}
                        </CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.content}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <footer className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-t border-purple-100 dark:border-gray-800 relative z-10">
        <div className="container flex flex-col gap-2 sm:flex-row py-6 px-4 md:px-6">
          <p className="text-xs text-gray-500 dark:text-gray-400">© 2025 ReviewSim. Todos los derechos reservados.</p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link
              className="text-xs text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
              href="#"
            >
              Términos de Servicio
            </Link>
            <Link
              className="text-xs text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
              href="#"
            >
              Privacidad
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

