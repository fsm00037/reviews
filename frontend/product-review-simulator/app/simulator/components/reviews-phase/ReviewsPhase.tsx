import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, ArrowRight, BarChart3, MessageSquare, Star, Zap, Sparkles } from "lucide-react";
import { User as MaleIcon, User as FemaleIcon } from "lucide-react";
import { Product, BotProfile, Review } from "@/lib/types";
import { getBotAvatarUrl } from "@/lib/bot-avatar";

interface ReviewsPhaseProps {
  product: Product;
  bots: BotProfile[];
  reviews: Review[];
  generateAnalysis: () => Promise<void>;
  setActiveStep: (step: number) => void;
  isGeneratingAnalysis: boolean;
  isGeneratingReviews?: boolean;
  populationSize?: number;
}

export const ReviewsPhase: React.FC<ReviewsPhaseProps> = ({
  product,
  bots,
  reviews,
  generateAnalysis,
  setActiveStep,
  isGeneratingAnalysis,
  isGeneratingReviews = false,
  populationSize = 0,
}) => {
  const [showProductDetails, setShowProductDetails] = useState(false);

  return (
    <Card className="border-border bg-card/60 backdrop-blur-md overflow-hidden rounded-2xl shadow-lg shadow-black/[0.03]">
      <CardHeader className="border-b border-border/60 bg-muted/10 pb-5">
        <CardTitle className="flex items-center gap-2.5 text-lg font-bold">
          <MessageSquare className="h-5 w-5 text-primary" />
          Reseñas generadas
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">Reseñas generadas por los perfiles de bot según tu configuración</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b border-border/60">
          <div>
            <h3 className="text-lg font-extrabold mb-1">{product.name}</h3>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{product.description}</p>
            <div className="flex items-center gap-3.5 mb-3">
              <span className="text-base font-bold text-foreground bg-muted/40 px-3 py-1 rounded-lg border border-border">
                {product.price}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">Categoría: {product.category}</span>
            </div>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const averageRating = reviews.length > 0 
                  ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
                  : 0;
                return (
                  <motion.div
                    key={star}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: star * 0.05, type: "spring" }}
                  >
                    <Star
                      className={`h-4.5 w-4.5 ${star <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-border"}`}
                    />
                  </motion.div>
                );
              })}
              <span className="ml-2 text-xs font-bold text-foreground">
                {reviews.length > 0
                  ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                  : "0.0"}{" "}
                de 5
              </span>
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({reviews.length} reseñas)
              </span>
            </div>
            
            {/* Botón para mostrar detalles */}
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-[11px] font-semibold h-8 rounded-lg border-border hover:bg-accent"
              onClick={() => setShowProductDetails(prevState => !prevState)}
            >
              {showProductDetails ? 'Ocultar detalles' : 'Ver detalles del producto'}
            </Button>
          </div>
        </div>

        {isGeneratingReviews && populationSize > 0 && (
          <div className="mb-6 p-5 bg-primary/5 rounded-2xl border border-primary/10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-primary animate-pulse" />
                Redactando reseñas en tiempo real...
              </span>
              <span className="text-xs font-bold text-foreground">
                {reviews.length} de {populationSize} completadas
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="bg-primary h-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${(reviews.length / populationSize) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {reviews.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="mb-4 bg-primary/10 p-3 rounded-full"
            >
              <Zap className="h-8 w-8 text-primary" />
            </motion.div>
            <h3 className="font-bold text-base text-foreground">Redactando reseñas de usuarios</h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Los agentes críticos de producto están evaluando las características del producto según sus perfiles...
            </p>
          </div>
        )}
        
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
                <div className="bg-muted/15 p-4 rounded-xl border border-border/60">
                  <h4 className="text-xs font-bold mb-3 text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Características principales
                  </h4>
                  
                  {product.main_features && product.main_features.length > 0 ? (
                    <div className="space-y-2">
                      {product.main_features.map((feature, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center border-b border-border/40 pb-2 last:border-0 last:pb-0">
                          <div className="font-semibold text-xs text-foreground/80">
                            {feature.feature}:
                          </div>
                          <div className="col-span-2 text-xs text-muted-foreground">
                            {feature.value || feature.description || ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic">
                      No hay características disponibles. Se añadirán al obtener información del producto.
                    </div>
                  )}
                </div>
                
                {/* Especificaciones técnicas */}
                <div className="bg-muted/15 p-4 rounded-xl border border-border/60">
                  <h4 className="text-xs font-bold mb-3 text-foreground flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-primary animate-pulse" />
                    Especificaciones técnicas
                  </h4>
                  
                  {product.technical_specs && product.technical_specs.length > 0 ? (
                    <div className="space-y-2">
                      {product.technical_specs.map((spec, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center border-b border-border/40 pb-2 last:border-0 last:pb-0">
                          <div className="font-semibold text-xs text-foreground/80">
                            {spec.spec}
                          </div>
                          <div className="col-span-2 text-xs text-muted-foreground">
                            {spec.value || spec.description || ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic">
                      No hay especificaciones técnicas disponibles. Se añadirán al obtener información del producto.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {reviews.map((review, index) => {
            const bot = bots.find((b) => b.id === review.bot_id);
            return (
              <motion.div
                key={review.id}
                className="p-4 rounded-xl border border-border bg-background/30 shadow-sm transition-all"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7 border border-border shadow-sm shrink-0">
                      <AvatarImage src={getBotAvatarUrl(bot)} alt={bot?.name} />
                      <AvatarFallback
                        className={`${bot?.gender === "Male" ? "bg-gradient-to-br from-indigo-500 to-indigo-600" : "bg-gradient-to-br from-pink-500 to-purple-600"} text-white flex items-center justify-center`}
                      >
                        {bot?.gender === "Male" ? (
                          <MaleIcon className="h-4 w-4" />
                        ) : (
                          <FemaleIcon className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-xs text-foreground">{bot?.name}</span>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-border"}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="font-bold text-xs text-foreground">{review.title}</h4>
                  {review.usage_duration && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      Uso: {review.usage_duration}
                    </span>
                  )}
                  {review.verified_purchase && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Compra verificada
                    </span>
                  )}
                  {review.would_recommend === true && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      Recomienda
                    </span>
                  )}
                  {review.would_recommend === false && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">
                      No recomienda
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{review.content}</p>
                {(review.pros?.length || review.cons?.length) ? (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {review.pros && review.pros.length > 0 && (
                      <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-2.5">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Pros</p>
                        <ul className="space-y-0.5">
                          {review.pros.map((p, i) => (
                            <li key={i} className="text-[11px] text-muted-foreground leading-snug">+ {p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {review.cons && review.cons.length > 0 && (
                      <div className="rounded-lg bg-red-500/5 border border-red-500/15 p-2.5">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-red-500 mb-1">Contras</p>
                        <ul className="space-y-0.5">
                          {review.cons.map((c, i) => (
                            <li key={i} className="text-[11px] text-muted-foreground leading-snug">− {c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-between mt-8 border-t border-border/60 pt-5">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => setActiveStep(2)}
              variant="outline"
              className="border-border hover:bg-accent rounded-xl text-xs font-semibold px-4 h-10 transition-colors"
              disabled={isGeneratingReviews}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a perfiles
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: (isGeneratingAnalysis || isGeneratingReviews) ? 1 : 1.02 }} whileTap={{ scale: (isGeneratingAnalysis || isGeneratingReviews) ? 1 : 0.98 }}>
            <Button
              onClick={generateAnalysis}
              className="bg-primary text-primary-foreground hover:bg-primary/95 transition-all font-semibold rounded-xl px-5 h-10 shadow-sm shadow-primary/10"
              disabled={isGeneratingAnalysis || isGeneratingReviews}
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
              ) : isGeneratingReviews ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="mr-2"
                  >
                    <Zap className="h-4 w-4" />
                  </motion.div>
                  Generando reseñas ({reviews.length}/{populationSize})...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Generar dashboard</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
};