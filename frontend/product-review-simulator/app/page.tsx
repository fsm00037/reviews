"use client"

import Link from "next/link"
import { ArrowRight, Sparkles, Box, MessageSquare, LineChart } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SimulatorService } from "@/lib/api-services"
import { ApiErrorAlert } from "@/components/api-error-alert"
import { LoadingSpinner } from "@/components/loading-spinner"
import { APIError } from "@/lib/types"
import { ProductService } from "@/lib/api-services"
import { AppHeader } from "@/components/app-header"

const LandingMiiParadeLazy = dynamic(() => import("@/components/landing-mii-parade"), {
  ssr: false,
  loading: () => (
    <div
      className="pointer-events-none absolute inset-0 z-[1]"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_70%,hsl(var(--primary)/0.07),transparent_65%)]" />
      <div className="absolute left-1/2 top-[58%] h-[42%] w-[78%] -translate-x-1/2 rounded-[100%] bg-primary/[0.05] blur-3xl animate-pulse" />
    </div>
  ),
})

export default function Home() {
  const [hovered, setHovered] = useState(false)
  const router = useRouter()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<APIError | null>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string } | null>(null)

  const exampleProducts = [
    { key: "headphones", name: "Auriculares Pro ANC-X1", category: "Electrónica", rating: 4.7, icon: "🎧" },
    { key: "coffee", name: "Smart Cafetera Precision", category: "Hogar", rating: 3.7, icon: "☕" },
    { key: "smartwatch", name: "FitTrack Watch Elite", category: "Wearables", rating: 4.7, icon: "⌚" },
  ]

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("review_simulator_user")
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored))
      } catch {
        /* ignore */
      }
    }
  }, [])

  // Calentar el chunk 3D en idle (primera visita más fluida)
  useEffect(() => {
    if (typeof window === "undefined") return
    let cancelled = false
    const warm = () => {
      if (!cancelled) void import("@/components/landing-mii-parade")
    }
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(warm, { timeout: 1200 })
      return () => {
        cancelled = true
        w.cancelIdleCallback?.(id)
      }
    }
    const t = window.setTimeout(warm, 50)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    if (!currentUser) return
    SimulatorService.getRecentSessions().catch(() => {})
  }, [currentUser])

  const handleSelectExampleProduct = (key: string) => {
    sessionStorage.setItem("review_simulator_example_key", key)
    router.push("/simulator")
  }

  const handleQuickAnalysis = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInputRef.current?.value) {
      setAnalyzeError({
        status: 400,
        message: "La URL del producto es obligatoria",
        details: "Ingresa la URL de un producto para analizar",
      })
      return
    }

    setIsAnalyzing(true)
    setAnalyzeError(null)

    try {
      const productUrl = urlInputRef.current.value
      sessionStorage.setItem("review_simulator_session_id", crypto.randomUUID())
      await ProductService.analyzeProduct(productUrl)

      let attemptCount = 0
      const maxAttempts = 30
      const pollingInterval = 10000

      const checkProductReady = async (): Promise<boolean> => {
        if (attemptCount >= maxAttempts) {
          throw {
            status: 408,
            message: "Tiempo de espera agotado",
            details: "El análisis no se completó a tiempo. Intenta de nuevo.",
          }
        }
        try {
          const product = await ProductService.getProductInfo()
          if (product?.name?.trim()) return true
        } catch (err) {
          if ((err as APIError).status !== 404) throw err
        }
        attemptCount++
        await new Promise((r) => setTimeout(r, pollingInterval))
        return checkProductReady()
      }

      await checkProductReady()
      router.push("/simulator")
    } catch (err) {
      if ((err as APIError).status !== undefined) {
        setAnalyzeError(err as APIError)
      } else {
        setAnalyzeError({
          status: 500,
          message: `Error: ${(err as Error).message || "Desconocido"}`,
          details: "No se pudo iniciar el análisis",
        })
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  }

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader
        variant="marketing"
        onAuthChange={() => {
          const stored = localStorage.getItem("review_simulator_user")
          setCurrentUser(stored ? JSON.parse(stored) : null)
        }}
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate min-h-[92vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_0%,hsl(var(--primary)/0.12),transparent_60%)]" />
          <div className="absolute inset-0 bg-grid-pattern opacity-50" />

          <LandingMiiParadeLazy variant="hero" />

          <div className="relative z-20 mx-auto flex min-h-[92vh] max-w-6xl flex-col px-5 md:px-8">
            <motion.div
              initial="hidden"
              animate="show"
              variants={stagger}
              className="flex flex-1 flex-col items-center justify-start pt-10 text-center md:pt-14"
            >
              <motion.h1
                variants={fadeUp}
                className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl"
              >
                Tu producto,{" "}
                <span className="bg-gradient-to-r from-indigo-500 via-primary to-violet-500 bg-clip-text text-transparent">
                  antes del mercado
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-4 max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base"
              >
                Crea una población de consumidores en 3D, escucha reseñas realistas y decide si lanzar o iterar.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 w-full max-w-md">
                {analyzeError && (
                  <div className="mb-3">
                    <ApiErrorAlert error={analyzeError} onDismiss={() => setAnalyzeError(null)} />
                  </div>
                )}
                <form
                  onSubmit={handleQuickAnalysis}
                  className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card/95 p-2 shadow-lg shadow-primary/5 backdrop-blur-xl sm:flex-row sm:items-center"
                >
                  <Input
                    className="h-11 flex-1 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
                    placeholder="URL del producto (Amazon, tienda…)"
                    type="url"
                    name="productUrl"
                    ref={urlInputRef}
                    disabled={isAnalyzing}
                    required
                  />
                  <Button
                    type="submit"
                    disabled={isAnalyzing}
                    className="h-11 shrink-0 rounded-xl px-5 font-semibold shadow-md shadow-primary/20"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                  >
                    {isAnalyzing ? (
                      <LoadingSpinner text="Analizando…" size="sm" />
                    ) : (
                      <>
                        Empezar
                        <ArrowRight
                          className={`ml-1.5 h-4 w-4 transition-transform ${hovered ? "translate-x-0.5" : ""}`}
                        />
                      </>
                    )}
                  </Button>
                </form>
                <p className="mt-2.5 text-[11px] text-muted-foreground">
                  Sin tarjeta · Pega un enlace y genera tu población de prueba
                </p>
              </motion.div>
            </motion.div>

            <div className="pointer-events-none min-h-[280px] flex-1 md:min-h-[340px]" />
          </div>
        </section>

        {/* —— Features —— */}
        <section id="features" className="relative z-10 scroll-mt-20 border-t border-border/40 bg-background py-20 md:py-24">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                Producto
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Todo lo que necesitas para validar antes de lanzar
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Una población sintética, reseñas creíbles y un panel de decisión — sin focus groups caros.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Box,
                  title: "Población 3D",
                  text: "Personas sintéticas con cara, peinado y personalidad. Las ves moverse, formarse y reaccionar en escena.",
                  accent: "from-indigo-500/15 to-violet-500/5",
                  iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
                },
                {
                  icon: MessageSquare,
                  title: "Reseñas humanas",
                  text: "Desde pocas palabras hasta habladores. Tono real, pros/cons y sesgos de consumidor creíbles.",
                  accent: "from-fuchsia-500/12 to-pink-500/5",
                  iconBg: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300",
                },
                {
                  icon: LineChart,
                  title: "Market fit",
                  text: "Insights, riesgos y recomendación de lanzamiento antes de invertir en el go-to-market.",
                  accent: "from-cyan-500/12 to-sky-500/5",
                  iconBg: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
                },
              ].map(({ icon: Icon, title, text, accent, iconBg }) => (
                <div
                  key={title}
                  className={`group relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br ${accent} p-6 shadow-sm transition-all hover:border-primary/25 hover:shadow-md md:p-7`}
                >
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/[0.04] blur-2xl transition-opacity group-hover:opacity-100" />
                  <span className={`relative flex h-11 w-11 items-center justify-center rounded-2xl ${iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="relative mt-5 text-base font-semibold tracking-tight text-foreground">{title}</h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* —— Demos —— */}
        <section id="demos" className="relative z-10 scroll-mt-20 border-t border-border/40 bg-card/50 py-20 md:py-24">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-lg">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">Demos</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Prueba una simulación lista
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Entra con un producto de ejemplo y recorre el flujo completo en minutos.
                </p>
              </div>
              <Button asChild variant="outline" className="h-10 shrink-0 rounded-xl border-border/80 text-xs font-semibold">
                <Link href="/simulator">
                  Simulador vacío
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {exampleProducts.map((prod) => (
                <button
                  key={prod.key}
                  type="button"
                  onClick={() => handleSelectExampleProduct(prod.key)}
                  className="group flex flex-col rounded-3xl border border-border/80 bg-card p-6 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-2xl ring-1 ring-border/50">
                      {prod.icon}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {prod.category}
                    </span>
                  </div>
                  <h4 className="mt-5 text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                    {prod.name}
                  </h4>
                  <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <span aria-hidden>★</span> {prod.rating.toFixed(1)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      Abrir demo
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* —— Flujo —— */}
        <section id="flujo" className="relative z-10 scroll-mt-20 border-t border-border/40 bg-background py-20 md:py-24">
          <div className="mx-auto max-w-6xl px-5 md:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">Flujo</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                De la URL a la decisión en minutos
              </h2>
            </div>

            <ol className="relative mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
              {/* Línea conectora en desktop */}
              <div
                className="pointer-events-none absolute left-[12%] right-[12%] top-8 hidden h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent lg:block"
                aria-hidden
              />
              {[
                { n: "01", t: "Producto", d: "Pega una URL o define tu ficha de producto." },
                { n: "02", t: "Población", d: "Parametriza demografía, estilo y verbosidad." },
                { n: "03", t: "Simulación 3D", d: "Mira a tus reseñadores en escena y en formación." },
                { n: "04", t: "Insights", d: "Market fit y mejoras accionables para el lanzamiento." },
              ].map((step) => (
                <li
                  key={step.n}
                  className="relative flex flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-bold tabular-nums text-primary">
                    {step.n}
                  </span>
                  <h3 className="mt-5 text-sm font-semibold text-foreground">{step.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.d}</p>
                </li>
              ))}
            </ol>

            <div className="mt-12 flex justify-center">
              <Button asChild size="lg" className="h-12 rounded-2xl px-8 font-semibold shadow-md shadow-primary/20">
                <Link href="/simulator">
                  Crear mi simulación
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 text-center sm:flex-row sm:text-left md:px-8">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </span>
              <span className="text-sm font-semibold">
                PreMarket<span className="text-primary"> Lab</span>
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              © {new Date().getFullYear()} · Simulación de mercado pre-lanzamiento
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-muted-foreground">
            <a href="#features" className="transition-colors hover:text-foreground">
              Producto
            </a>
            <a href="#demos" className="transition-colors hover:text-foreground">
              Demos
            </a>
            <a href="#flujo" className="transition-colors hover:text-foreground">
              Flujo
            </a>
            <Link href="/simulator" className="font-medium text-primary hover:underline">
              Simulador
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
