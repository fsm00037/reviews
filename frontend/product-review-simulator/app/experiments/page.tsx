"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { 
  ArrowLeft, 
  GitCompare, 
  Trash2, 
  Sparkles, 
  Star, 
  AlertCircle, 
  Clock, 
  Search, 
  Tag, 
  Coins, 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  X
} from "lucide-react"
import AnimatedBackground from "@/components/animated-background"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthModal } from "@/components/auth-modal"
import { RecentSession } from "@/lib/types"
import { SimulatorService, CompareService } from "@/lib/api-services"

export default function ExperimentsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string } | null>(null)
  const [sessions, setSessions] = useState<RecentSession[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  
  // State for comparison
  const [isComparing, setIsComparing] = useState(false)
  const [comparisonResult, setComparisonResult] = useState<any | null>(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [comparisonError, setComparisonError] = useState("")

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

  const fetchSessions = async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const data = await SimulatorService.getRecentSessions()
      setSessions(data || [])
    } catch (err) {
      console.error("Error fetching sessions:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [currentUser])

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("¿Estás seguro de que deseas eliminar este experimento?")) return
    
    try {
      await fetch(`/api/clean-outputs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": sessionId
        }
      })
      // Remover de la lista local
      setSessions(sessions.filter(s => s.session_id !== sessionId))
      setSelectedSessions(selectedSessions.filter(id => id !== sessionId))
    } catch (err) {
      console.error("Error deleting session:", err)
    }
  }

  const handleSelectSession = (sessionId: string) => {
    if (selectedSessions.includes(sessionId)) {
      setSelectedSessions(selectedSessions.filter(id => id !== sessionId))
    } else {
      if (selectedSessions.length >= 2) {
        // Reemplazar la segunda selección
        setSelectedSessions([selectedSessions[0], sessionId])
      } else {
        setSelectedSessions([...selectedSessions, sessionId])
      }
    }
  }

  const handleSelectRecentSession = (sessionId: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('review_simulator_session_id', sessionId);
      router.push('/simulator');
    }
  }

  const handleCompare = async () => {
    if (selectedSessions.length !== 2) return
    
    setComparisonLoading(true)
    setComparisonError("")
    setIsComparing(true)
    
    try {
      const result = await CompareService.compareSessions(selectedSessions[0], selectedSessions[1])
      setComparisonResult(result)
    } catch (err: any) {
      console.error("Error during comparison:", err)
      setComparisonError(err.message || "Error al generar la comparación")
    } finally {
      setComparisonLoading(false)
    }
  }

  const filteredSessions = sessions.filter(s => 
    s.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-screen">
      <AnimatedBackground />

      <header className="px-4 lg:px-6 h-16 flex items-center backdrop-blur-md bg-white/70 dark:bg-gray-950/70 border-b border-purple-100 dark:border-gray-800 sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="/">
          <div className="mr-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg p-1.5">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            ReviewSim 2025
          </span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link
            className="text-sm font-semibold hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            href="/"
          >
            Inicio
          </Link>
          <ThemeToggle />
          <AuthModal onStateChange={() => {
            const stored = localStorage.getItem("review_simulator_user")
            if (stored) {
              setCurrentUser(JSON.parse(stored))
            } else {
              setCurrentUser(null)
              setSessions([])
            }
          }} />
        </nav>
      </header>

      <main className="flex-1 relative z-10 container mx-auto py-8 px-4">
        {!currentUser ? (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
            <div className="mb-4 bg-purple-100 dark:bg-purple-950/50 p-4 rounded-full border border-purple-200 dark:border-purple-900/50">
              <AlertCircle className="h-10 w-10 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Inicia sesión requerida</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Debes iniciar sesión con tu cuenta para visualizar tus experimentos, guardar poblaciones y comparar productos.
            </p>
            <AuthModal onStateChange={() => window.location.reload()} />
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Link href="/">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-purple-200 dark:border-gray-700 hover:bg-purple-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                  Mis Experimentos
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Administra, visualiza e innova tus productos simulados
                </p>
              </div>
            </div>

            {/* Compare Bar Action */}
            {selectedSessions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl border border-purple-200/50 dark:border-purple-900 bg-purple-500/5 dark:bg-purple-950/20 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                    Comparación Side-by-Side ({selectedSessions.length}/2)
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedSessions.length === 1 
                      ? "Selecciona otra simulación para iniciar la comparación de productos con IA"
                      : "Tienes 2 productos seleccionados para comparar sus feedback con IA"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setSelectedSessions([])}
                    variant="ghost"
                    size="sm"
                    className="text-xs hover:bg-purple-500/10"
                  >
                    Limpiar selección
                  </Button>
                  <Button
                    onClick={handleCompare}
                    disabled={selectedSessions.length !== 2}
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 gap-1.5 text-xs font-semibold"
                    size="sm"
                  >
                    <GitCompare className="h-3.5 w-3.5" />
                    Comparar Productos con IA
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Search and Filters */}
            <div className="mb-6 relative max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre de producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white/70 dark:bg-gray-950/70 border border-purple-100 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white/40 dark:bg-gray-950/40 rounded-xl border border-purple-100 dark:border-gray-800">
                <HelpCircle className="h-10 w-10 text-purple-400 mb-2" />
                <h3 className="font-bold text-lg">No se encontraron experimentos</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mt-1">
                  Aún no has creado simulaciones para esta cuenta o no coinciden con la búsqueda.
                </p>
                <Link href="/simulator" className="mt-4">
                  <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white" size="sm">
                    Crear Nueva Simulación
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSessions.map((session) => {
                  const isSelected = selectedSessions.includes(session.session_id)
                  return (
                    <motion.div
                      key={session.session_id}
                      whileHover={{ y: -3 }}
                      className={`relative flex flex-col justify-between p-5 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border rounded-2xl cursor-pointer hover:shadow-lg transition-all duration-300 ${
                        isSelected 
                          ? "border-purple-500 ring-2 ring-purple-500/10 shadow-purple-500/5 bg-purple-500/5 dark:bg-purple-950/10" 
                          : "border-purple-100 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-900"
                      }`}
                      onClick={() => handleSelectSession(session.session_id)}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Simulación
                          </span>
                          <h3 className="font-bold text-base text-gray-800 dark:text-gray-200 mt-2 line-clamp-2">
                            {session.product_name}
                          </h3>
                          {session.parent_session_id && (
                            <div className="mt-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded w-max">
                              Versión mejorada de: {session.parent_product_name || "Producto original"}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1.5">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(session.created_at).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteSession(session.session_id, e)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full h-8 w-8 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-purple-50 dark:border-gray-800">
                        {session.average_rating ? (
                          <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg">
                            <span className="text-amber-500 font-bold text-xs">★</span>
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                              {session.average_rating.toFixed(1)} / 5
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2.5 py-0.5 rounded-full">
                            Incompleto
                          </span>
                        )}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectRecentSession(session.session_id)
                          }}
                          variant="link"
                          className="p-0 h-auto text-xs text-purple-600 dark:text-purple-400 font-semibold"
                        >
                          Cargar
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Comparison Drawer / Full Overlay modal */}
      <AnimatePresence>
        {isComparing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto p-4 md:p-6 flex items-start justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-950 border dark:border-gray-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative my-8 text-gray-900 dark:text-gray-100"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsComparing(false)
                  setComparisonResult(null)
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>

              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center gap-2 pr-10">
                <GitCompare className="h-6 w-6 text-purple-500" />
                Comparación de Productos con IA
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                Informe comparativo estratégico basado en el análisis de clientes
              </p>

              {comparisonLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    El consultor IA está evaluando las opiniones y métricas de ambos productos...
                  </p>
                </div>
              ) : comparisonError ? (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-red-800 dark:text-red-400 text-sm">Error al comparar</h3>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{comparisonError}</p>
                  </div>
                </div>
              ) : (
                comparisonResult && (
                  <div className="space-y-6">
                    {/* Header products row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Product 1 Card */}
                      <Card className="border-blue-100 dark:border-gray-800 bg-blue-500/[0.02]">
                        <CardHeader className="pb-2">
                          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">PRODUCTO A</span>
                          <CardTitle className="text-lg">{comparisonResult.product1.name}</CardTitle>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-400 font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-900 flex items-center gap-1">
                              <Coins className="h-3.5 w-3.5" />
                              {comparisonResult.product1.price}
                            </span>
                            <span className="text-xs text-gray-400 font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-900 flex items-center gap-1">
                              <Tag className="h-3.5 w-3.5" />
                              {comparisonResult.product1.category}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="flex items-center gap-1.5 bg-amber-500/10 px-2 py-1 rounded-lg w-max mb-4">
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                              {comparisonResult.product1.average_rating ? comparisonResult.product1.average_rating.toFixed(1) : "N/A"} / 5
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3 text-green-500" />
                              Fortalezas
                            </h4>
                            <ul className="text-xs text-gray-600 dark:text-gray-300 list-disc pl-4 space-y-1">
                              {comparisonResult.product1.positive_points.slice(0, 3).map((pt: string, idx: number) => (
                                <li key={idx}>{pt}</li>
                              ))}
                            </ul>
                            
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1 pt-1">
                              <ThumbsDown className="h-3 w-3 text-red-500" />
                              Quejas
                            </h4>
                            <ul className="text-xs text-gray-600 dark:text-gray-300 list-disc pl-4 space-y-1">
                              {comparisonResult.product1.negative_points.slice(0, 3).map((pt: string, idx: number) => (
                                <li key={idx}>{pt}</li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Product 2 Card */}
                      <Card className="border-purple-100 dark:border-gray-800 bg-purple-500/[0.02]">
                        <CardHeader className="pb-2">
                          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">PRODUCTO B</span>
                          <CardTitle className="text-lg">{comparisonResult.product2.name}</CardTitle>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-400 font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-900 flex items-center gap-1">
                              <Coins className="h-3.5 w-3.5" />
                              {comparisonResult.product2.price}
                            </span>
                            <span className="text-xs text-gray-400 font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-900 flex items-center gap-1">
                              <Tag className="h-3.5 w-3.5" />
                              {comparisonResult.product2.category}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="flex items-center gap-1.5 bg-amber-500/10 px-2 py-1 rounded-lg w-max mb-4">
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                              {comparisonResult.product2.average_rating ? comparisonResult.product2.average_rating.toFixed(1) : "N/A"} / 5
                            </span>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3 text-green-500" />
                              Fortalezas
                            </h4>
                            <ul className="text-xs text-gray-600 dark:text-gray-300 list-disc pl-4 space-y-1">
                              {comparisonResult.product2.positive_points.slice(0, 3).map((pt: string, idx: number) => (
                                <li key={idx}>{pt}</li>
                              ))}
                            </ul>

                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1 pt-1">
                              <ThumbsDown className="h-3 w-3 text-red-500" />
                              Quejas
                            </h4>
                            <ul className="text-xs text-gray-600 dark:text-gray-300 list-disc pl-4 space-y-1">
                              {comparisonResult.product2.negative_points.slice(0, 3).map((pt: string, idx: number) => (
                                <li key={idx}>{pt}</li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* AI Comparative Report */}
                    <div className="mt-6 border-t border-purple-100 dark:border-gray-800 pt-6">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-purple-500" />
                        Informe Comparativo Estratégico de IA
                      </h3>
                      <div className="text-sm bg-purple-500/[0.01] dark:bg-purple-950/[0.05] p-5 rounded-2xl border border-purple-100/50 dark:border-gray-800 leading-relaxed text-gray-600 dark:text-gray-300 max-h-[40vh] overflow-y-auto pr-3 whitespace-pre-line">
                        {comparisonResult.comparison_report}
                      </div>
                    </div>
                  </div>
                )
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
