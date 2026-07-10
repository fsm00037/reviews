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
import { AuthModal } from "@/components/auth-modal"

export default function Home() {
  const [hovered, setHovered] = useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<APIError | null>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string } | null>(null)

  const exampleProducts = [
    {
      key: "headphones",
      name: "Auriculares Pro ANC-X1",
      description: "Auriculares inalámbricos de alta gama con cancelación activa de ruido híbrida de 40dB y sonido espacial.",
      category: "Electrónica",
      price: "$189.99",
      rating: 4.7,
      icon: "🎧",
    },
    {
      key: "coffee",
      name: "Smart Cafetera Precision Brew",
      description: "Cafetera inteligente programable con molinillo integrado de acero y control de temperatura PID.",
      category: "Hogar y Cocina",
      price: "$249.99",
      rating: 3.7,
      icon: "☕",
    },
    {
      key: "smartwatch",
      name: "FitTrack Watch Elite",
      description: "Smartwatch deportivo premium con pantalla AMOLED Always-On, GPS multisistema y monitor de salud PPG.",
      category: "Accesorios Deportivos",
      price: "$159.99",
      rating: 4.7,
      icon: "⌚",
    }
  ];

  const handleSelectExampleProduct = (key: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('review_simulator_example_key', key);
      router.push('/simulator');
    }
  };

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

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoadingSessions(true);
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
  }, [currentUser]);

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
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AnimatedBackground />

      <header className="px-6 h-16 flex items-center backdrop-blur-md bg-background/50 dark:bg-background/40 border-b border-border/60 sticky top-0 z-50 transition-colors">
        <Link className="flex items-center justify-center gap-2.5" href="#">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="bg-primary shadow-lg shadow-primary/25 rounded-xl p-1.5"
          >
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </motion.div>
          <motion.span
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80"
          >
            reviewsim<span className="text-primary font-extrabold">.ai</span>
          </motion.span>
        </Link>
        <nav className="ml-auto flex gap-6 items-center">
          {currentUser && (
            <Link
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              href="/experiments"
            >
              Mis Experimentos
            </Link>
          )}
          <Link
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            href="#"
          >
            About
          </Link>
          <Link
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            href="#"
          >
            Help
          </Link>
          <ThemeToggle />
          <AuthModal onStateChange={() => {
            const stored = localStorage.getItem("review_simulator_user")
            if (stored) {
              setCurrentUser(JSON.parse(stored))
            } else {
              setCurrentUser(null)
            }
          }} />
        </nav>
      </header>

      <main className="flex-1 relative z-10">
        <section className="w-full py-16 md:py-28 lg:py-36 overflow-hidden">
          <div className="container px-6 relative max-w-5xl">
            <motion.div
              initial="hidden"
              animate="show"
              variants={container}
              className="flex flex-col items-center justify-center space-y-10 text-center relative z-10"
            >
              <motion.div variants={item} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-primary/20 bg-primary/5 text-primary shadow-sm shadow-primary/5 mb-3"
                >
                  <Sparkles className="h-3 w-3 animate-pulse" />
                  <span>Simulación de Reseñas por IA de Próxima Generación</span>
                </motion.div>
                
                <motion.h1
                  variants={item}
                  className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/75"
                >
                  Diseña productos óptimos a través de <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-primary to-cyan-500">reseñas sintéticas</span>
                </motion.h1>
                
                <motion.p variants={item} className="mx-auto max-w-[620px] text-muted-foreground md:text-xl leading-relaxed">
                  Genera comentarios honestos de consumidores simulados mediante perfiles de bots de IA sumamente realistas antes del lanzamiento.
                </motion.p>
              </motion.div>

              <motion.div variants={item} className="w-full max-w-md space-y-3">
                {analyzeError && (
                  <ApiErrorAlert 
                    error={analyzeError} 
                    onDismiss={() => setAnalyzeError(null)} 
                  />
                )}
                <form onSubmit={handleQuickAnalysis} className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                  <Input
                    className="max-w-lg flex-1 bg-background/50 border-border focus-visible:ring-primary backdrop-blur-md rounded-xl h-11"
                    placeholder="Ingresa la URL del producto (ej. Amazon)"
                    type="text"
                    name="productUrl"
                    ref={urlInputRef}
                    disabled={isAnalyzing}
                    required
                  />
                  <motion.div whileHover={{ scale: isAnalyzing ? 1 : 1.02 }} whileTap={{ scale: isAnalyzing ? 1 : 0.98 }}>
                    <Button
                      type="submit"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold rounded-xl h-11 px-6 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 w-full sm:w-auto"
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
                            animate={{ x: hovered ? 3 : 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </motion.div>
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
                <p className="text-xs text-center text-muted-foreground/80">
                  Nuestra IA escaneará y estructurará el producto automáticamente paso a paso.
                </p>
              </motion.div>

              <motion.div
                variants={item}
                className="w-full mt-16 text-left"
              >
                <h3 className="text-xs font-bold mb-6 text-center text-muted-foreground uppercase tracking-widest">
                  Simulaciones de Prueba Prehechas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {exampleProducts.map((prod) => (
                    <motion.div
                      key={prod.key}
                      whileHover={{ y: -3 }}
                      onClick={() => handleSelectExampleProduct(prod.key)}
                      className="cursor-pointer p-5 bg-card/40 hover:bg-card/75 backdrop-blur-md border border-border rounded-2xl hover:border-primary/30 transition-all flex flex-col justify-between h-44 shadow-sm hover:shadow-md glow-card-hover"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-2xl">{prod.icon}</span>
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {prod.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-foreground leading-snug">
                          {prod.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {prod.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
                        <div className="flex items-center space-x-1">
                          <span className="text-amber-500 text-sm">★</span>
                          <span className="text-xs font-bold text-foreground">
                            {prod.rating.toFixed(1)} / 5.0
                          </span>
                        </div>
                        <span className="text-xs text-primary font-semibold flex items-center gap-1">
                          Probar demo <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="w-full py-16 md:py-28 border-t border-border/40 backdrop-blur-sm bg-background/20 relative z-10">
          <div className="container px-6 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start"
            >
              <div className="space-y-5 lg:sticky lg:top-24">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-primary/20 bg-primary/5 text-primary w-max">
                  <span>Cómo funciona</span>
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/85">
                  Simulación completa en cinco simples pasos
                </h2>
                <p className="text-muted-foreground md:text-lg leading-relaxed">
                  Desde la ingestión del producto hasta la obtención de retroalimentación procesable mediante el análisis de cohortes de compradores simulados.
                </p>
              </div>
              <div className="grid gap-5">
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
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    viewport={{ once: true }}
                  >
                    <Card className="overflow-hidden border-border/80 bg-card/30 backdrop-blur-md hover:bg-card/50 transition-all duration-300 rounded-2xl glow-card-hover">
                      <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
                        <CardTitle className="text-base font-bold flex items-center gap-2.5">
                          <span className="p-1 rounded-lg bg-background border border-border shadow-sm">
                            {item.icon}
                          </span>
                          <span>{item.title}</span>
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-1">{item.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground/90 leading-relaxed">{item.content}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-background/40 backdrop-blur-md border-t border-border/60 relative z-10">
        <div className="container flex flex-col gap-3 sm:flex-row py-6 px-6 max-w-5xl text-center sm:text-left">
          <p className="text-xs text-muted-foreground">© 2026 reviewsim.ai. Todos los derechos reservados.</p>
          <nav className="sm:ml-auto flex gap-5 justify-center">
            <Link
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              href="#"
            >
              Términos de Servicio
            </Link>
            <Link
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              href="#"
            >
              Privacidad
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

