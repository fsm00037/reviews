import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, ArrowRight, BarChart3, MessageSquare, Star, ThumbsUp, Zap, Sparkles } from "lucide-react";
import { FanIcon as MaleIcon } from "lucide-react";
import { FanIcon as FemaleIcon } from "lucide-react";
import { Product, BotProfile, Review } from "@/lib/types";

interface ReviewsPhaseProps {
  product: Product;
  bots: BotProfile[];
  reviews: Review[];
  generateAnalysis: () => Promise<void>;
  setActiveStep: (step: number) => void;
  isGeneratingAnalysis: boolean;
}

export const ReviewsPhase: React.FC<ReviewsPhaseProps> = ({
  product,
  bots,
  reviews,
  generateAnalysis,
  setActiveStep,
  isGeneratingAnalysis,
}) => {
  const [showProductDetails, setShowProductDetails] = useState(false);

  return (
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
          
          
          <div>
            <h3 className="text-xl font-bold mb-1">{product.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{product.description}</p>
            <p className="text-lg font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              {product.price}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Categoría: {product.category}</p>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
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
                );
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
            const bot = bots.find((b) => b.id === review.bot_id);
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
                <p className="text-sm text-gray-600 dark:text-gray-300">{review.content}</p>

              </motion.div>
            );
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
  );
}; 