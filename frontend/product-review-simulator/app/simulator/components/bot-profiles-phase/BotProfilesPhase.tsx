import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, ArrowRight, MessageSquare, UserCircle2, Zap } from "lucide-react";
import { FanIcon as MaleIcon } from "lucide-react";
import { FanIcon as FemaleIcon } from "lucide-react";
import { BotProfile } from "@/lib/types";

interface BotProfilesPhaseProps {
  bots: BotProfile[];
  generateReviews: () => Promise<void>;
  setActiveStep: (step: number) => void;
  isGeneratingReviews: boolean;
}

export const BotProfilesPhase: React.FC<BotProfilesPhaseProps> = ({
  bots,
  generateReviews,
  setActiveStep,
  isGeneratingReviews,
}) => {
  return (
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
                      <div>
                        <div className="flex justify-between">
                          <span>Independiente</span>
                          <span>Cooperativo</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-1">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full"
                            style={{ width: `${Math.round(bot.personality.independent_cooperative)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between">
                          <span>No ecologista</span>
                          <span>Ecologista</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-1">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full"
                            style={{ width: `${Math.round(bot.personality.environmentalist)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between">
                          <span>Seguro</span>
                          <span>Arriesgado</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-1">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full"
                            style={{ width: `${Math.round(bot.personality.safe_risky)}%` }}
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
  );
}; 