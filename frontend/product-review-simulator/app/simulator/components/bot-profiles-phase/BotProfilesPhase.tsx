"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Box,
  LayoutGrid,
  MessageSquare,
  UserCircle2,
  Zap,
  Sparkles,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { User as MaleIcon, User as FemaleIcon } from "lucide-react"
import { BotProfile } from "@/lib/types"
import { getBotAvatarUrl } from "@/lib/bot-avatar"
import dynamic from "next/dynamic"

const PopulationScene = dynamic(
  () => import("@/components/population-3d/PopulationScene").then((m) => m.PopulationScene),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] rounded-2xl border border-border bg-muted/20 flex items-center justify-center">
        <p className="text-xs text-muted-foreground animate-pulse">Cargando simulación 3D…</p>
      </div>
    ),
  }
)

interface BotProfilesPhaseProps {
  bots: BotProfile[]
  generateReviews: () => Promise<void>
  setActiveStep: (step: number) => void
  isGeneratingReviews: boolean
  isGeneratingBots?: boolean
  populationSize?: number
}

const incomeLabel: Record<string, string> = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
  very_high: "Muy alto",
}

/** Verbosidad del reseñador: 0 = pocas palabras, 100 = hablador */
function getVerbosity(bot: BotProfile): number {
  const v = bot.review_style?.verbosity
  if (typeof v === "number") return Math.max(0, Math.min(100, v))
  // fallback suave desde extroversión
  const ext = bot.personality?.introvert_extrovert
  return typeof ext === "number" ? ext : 50
}

/** Mismos ejes que los sliders de Configuración → Rasgos de personalidad */
const PERSONALITY_TRAITS = [
  ["introvert_extrovert", "Introvertido", "Extrovertido"],
  ["analytical_creative", "Analítico", "Creativo"],
  ["busy_free_time", "Ocupado", "Tiempo libre"],
  ["disorganized_organized", "Desorganizado", "Organizado"],
  ["independent_cooperative", "Independiente", "Cooperativo"],
  ["environmentalist", "Poco ecologista", "Ecologista"],
  ["safe_risky", "Prudente", "Arriesgado"],
  ["price_sensitive_premium", "Sensible al precio", "Prefiere premium"],
  ["brand_loyal_explorer", "Fiel a marcas", "Explorador"],
  ["tech_novice_expert", "Novato tech", "Early adopter"],
  ["skeptic_enthusiast", "Escéptico", "Entusiasta"],
] as const

/** Mismos ejes que Estilo de reseña de la población en Configuración */
const REVIEW_STYLE_TRAITS = [
  ["positivity", "Crítico", "Positivo"],
  ["verbosity", "Pocas palabras", "Hablador"],
  ["detail_level", "Superficial", "Muy detallado"],
] as const

function getReviewStyleValue(bot: BotProfile, key: (typeof REVIEW_STYLE_TRAITS)[number][0]): number | null {
  const style = bot.review_style
  if (!style) {
    if (key === "verbosity") return getVerbosity(bot)
    return null
  }
  const raw = style[key as keyof typeof style]
  if (typeof raw === "number") return Math.max(0, Math.min(100, raw))
  if (key === "verbosity") return getVerbosity(bot)
  return null
}

function TraitBar({
  minL,
  maxL,
  value,
  thick = false,
}: {
  minL: string
  maxL: string
  value: number
  thick?: boolean
}) {
  const h = thick ? "h-1.5" : "h-1"
  return (
    <div>
      <div className="flex justify-between gap-2">
        <span className="truncate">{minL}</span>
        <span className="truncate text-right">{maxL}</span>
      </div>
      <div className={`w-full bg-muted rounded-full mt-1 ${h}`}>
        <div
          className={`bg-primary rounded-full shadow-[0_0_4px_rgba(99,102,241,0.3)] ${h}`}
          style={{ width: `${Math.round(value)}%` }}
        />
      </div>
    </div>
  )
}

/** Tarjeta completa de perfil (compartida entre modo 3D y tarjetas). */
function BotProfileCard({
  bot,
  className = "",
  highlighted = false,
  /** wide = se adapta al ancho de la página (selección 3D); compact = grid de tarjetas */
  layout = "compact",
}: {
  bot: BotProfile
  className?: string
  highlighted?: boolean
  layout?: "compact" | "wide"
}) {
  const isWide = layout === "wide"
  const bioClamp = isWide ? "line-clamp-none" : "line-clamp-3"

  return (
    <Card
      className={`border-border bg-background/40 transition-all rounded-2xl glow-card-hover flex flex-col ${
        isWide ? "w-full" : "h-full justify-between"
      } ${
        highlighted ? "border-primary/40 ring-2 ring-primary/15 bg-primary/[0.03]" : "hover:border-primary/20"
      } ${className}`}
    >
      <CardHeader className={isWide ? "pb-3 sm:pb-4" : "pb-3"}>
        <div className={`flex items-center gap-3 ${isWide ? "sm:gap-4" : ""}`}>
          <Avatar
            className={`border border-border shadow-sm shrink-0 ${
              isWide ? "h-14 w-14 sm:h-16 sm:w-16" : "h-12 w-12"
            }`}
          >
            <AvatarImage src={getBotAvatarUrl(bot)} alt={bot.name} />
            <AvatarFallback
              className={`${
                bot.gender === "Male"
                  ? "bg-gradient-to-br from-indigo-500 to-indigo-600"
                  : "bg-gradient-to-br from-pink-500 to-purple-600"
              } text-white flex items-center justify-center`}
            >
              {bot.gender === "Male" ? (
                <MaleIcon className={isWide ? "h-7 w-7" : "h-6 w-6"} />
              ) : (
                <FemaleIcon className={isWide ? "h-7 w-7" : "h-6 w-6"} />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle
              className={`font-bold text-foreground ${isWide ? "text-base sm:text-lg" : "text-sm truncate"}`}
            >
              {bot.name}
            </CardTitle>
            <CardDescription
              className={`text-muted-foreground mt-0.5 ${
                isWide ? "text-xs sm:text-sm" : "text-[11px] truncate"
              }`}
            >
              {bot.age} años · {bot.gender === "Male" ? "Hombre" : bot.gender === "Female" ? "Mujer" : "Otro"} ·{" "}
              {bot.location}
            </CardDescription>
            {isWide && (
              <p className="text-[10px] sm:text-[11px] font-bold text-primary uppercase tracking-wider mt-1">
                {bot.education_level}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent
        className={`pt-0 flex-1 flex flex-col ${
          isWide ? "gap-4 sm:gap-5" : "space-y-4 justify-between"
        }`}
      >
        {/* Cuerpo: en wide, 2 columnas en md+ */}
        <div
          className={
            isWide
              ? "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8"
              : "contents"
          }
        >
          <div className={isWide ? "min-w-0 space-y-3" : ""}>
            {!isWide && (
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5">
                {bot.education_level}
              </p>
            )}
            <p
              className={`text-xs text-muted-foreground leading-relaxed mb-3 ${bioClamp} ${
                isWide ? "sm:text-sm" : ""
              }`}
            >
              {bot.bio}
            </p>
            {bot.consumer?.occupation && (
              <p className={`text-[10px] text-muted-foreground mb-2 ${isWide ? "sm:text-xs" : ""}`}>
                <span className="font-semibold text-foreground/80">{bot.consumer.occupation}</span>
                {bot.consumer.income_level && (
                  <> · Renta {incomeLabel[bot.consumer.income_level] || bot.consumer.income_level}</>
                )}
              </p>
            )}

            {(bot.consumer?.interests?.length || bot.appearance?.clothing_style) && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {bot.appearance?.clothing_style && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted border border-border">
                    <Sparkles className="h-3 w-3" />
                    {bot.appearance.clothing_style}
                  </span>
                )}
                {bot.consumer?.interests?.slice(0, isWide ? 10 : 6).map((interest) => (
                  <span
                    key={interest}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}

            {bot.backstory && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="link"
                    className="text-primary hover:text-primary/80 p-0 h-auto font-semibold text-[11px] mb-1 flex items-center gap-1"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Ver historia de fondo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[min(32rem,calc(100vw-2rem))] bg-card border border-border text-foreground rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold">Historia de fondo: {bot.name}</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Detalles sobre la experiencia, intereses y motivaciones del usuario.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 text-xs text-muted-foreground leading-relaxed max-h-[50vh] overflow-y-auto pr-2">
                    {bot.backstory}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div
            className={
              isWide
                ? "min-w-0 space-y-4 sm:space-y-5"
                : "space-y-2.5 pt-3.5 border-t border-border/40"
            }
          >
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Estilo de reseña
              </h4>
              <div
                className={`gap-2.5 text-[10px] font-medium text-muted-foreground ${
                  isWide ? "grid grid-cols-1 sm:grid-cols-3 gap-x-4 sm:text-[11px]" : "grid grid-cols-1 space-y-2"
                }`}
              >
                {REVIEW_STYLE_TRAITS.map(([key, minL, maxL]) => {
                  const val = getReviewStyleValue(bot, key)
                  if (val === null) return null
                  return <TraitBar key={key} minL={minL} maxL={maxL} value={val} thick={isWide} />
                })}
              </div>
            </div>

            <div
              className={
                isWide
                  ? "space-y-2.5 pt-3 border-t border-border/40"
                  : "space-y-2.5 pt-3.5 border-t border-border/40"
              }
            >
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Rasgos de personalidad
              </h4>
              <div
                className={`gap-2 text-[10px] font-medium text-muted-foreground ${
                  isWide
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2.5 sm:text-[11px]"
                    : "grid grid-cols-1 gap-2"
                }`}
              >
                {PERSONALITY_TRAITS.map(([key, minL, maxL]) => {
                  const val = bot.personality?.[key as keyof typeof bot.personality]
                  if (val === undefined || val === null) return null
                  return (
                    <TraitBar key={key} minL={minL} maxL={maxL} value={Number(val)} thick={isWide} />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const BotProfilesPhase: React.FC<BotProfilesPhaseProps> = ({
  bots,
  generateReviews,
  setActiveStep,
  isGeneratingReviews,
  isGeneratingBots = false,
  populationSize = 0,
}) => {
  const [viewMode, setViewMode] = useState<"3d" | "cards">("3d")
  const [selected, setSelected] = useState<BotProfile | null>(null)

  return (
    <Card className="border-border bg-card/60 backdrop-blur-md overflow-hidden rounded-2xl shadow-lg shadow-black/[0.03]">
      <CardHeader className="border-b border-border/60 bg-muted/10 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2.5 text-lg font-bold">
              <UserCircle2 className="h-5 w-5 text-primary" />
              Población de reseñadores
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Simulación física de tu mercado de prueba. Explora perfiles antes de generar reseñas.
            </CardDescription>
          </div>
          <div className="flex rounded-xl border border-border p-0.5 bg-muted/30 self-start">
            <button
              type="button"
              onClick={() => setViewMode("3d")}
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "3d" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Box className="h-3.5 w-3.5" />
              Simulación 3D
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "cards" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Tarjetas
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isGeneratingBots && populationSize > 0 && (
          <div className="mb-6 p-5 bg-primary/5 rounded-2xl border border-primary/10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-primary animate-pulse" />
                Materializando población en tiempo real…
              </span>
              <span className="text-xs font-bold text-foreground">
                {bots.length} de {populationSize} completados
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="bg-primary h-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${(bots.length / populationSize) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {bots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="mb-4 bg-primary/10 p-3 rounded-full"
            >
              <Zap className="h-8 w-8 text-primary" />
            </motion.div>
            <h3 className="font-bold text-base text-foreground">Inicializando simulación de perfiles</h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Conectando con el agente creador de usuarios para generar el primer perfil…
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {bots.length > 0 && viewMode === "3d" && (
            <motion.div
              key="3d"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <PopulationScene
                bots={bots}
                selectedId={selected?.id ?? null}
                onSelect={setSelected}
                height={480}
                layout="paseo"
              />

              {selected && (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full min-w-0"
                >
                  <BotProfileCard bot={selected} highlighted layout="wide" />
                </motion.div>
              )}

              {!selected && (
                <p className="text-[11px] text-center text-muted-foreground">
                  Haz clic en una persona en la escena 3D para inspeccionar su perfil de consumidor.
                </p>
              )}
            </motion.div>
          )}

          {bots.length > 0 && viewMode === "cards" && (
            <motion.div
              key="cards"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {bots.map((bot, index) => (
                <motion.div
                  key={bot.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <BotProfileCard bot={bot} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between mt-8 border-t border-border/60 pt-5">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => setActiveStep(1)}
              variant="outline"
              className="border-border hover:bg-accent rounded-xl text-xs font-semibold px-4 h-10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Configuración
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={generateReviews}
              disabled={isGeneratingReviews || isGeneratingBots || bots.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/95 font-semibold rounded-xl px-5 h-10 shadow-sm"
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
                  Generando reseñas…
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Testear producto con esta población
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}
