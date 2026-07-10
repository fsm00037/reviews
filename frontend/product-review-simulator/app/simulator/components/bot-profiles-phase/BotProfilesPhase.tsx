import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, ArrowRight, BookOpen, MessageSquare, UserCircle2, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User as MaleIcon, User as FemaleIcon } from "lucide-react";
import { BotProfile } from "@/lib/types";

interface BotProfilesPhaseProps {
  bots: BotProfile[];
  generateReviews: () => Promise<void>;
  setActiveStep: (step: number) => void;
  isGeneratingReviews: boolean;
  isGeneratingBots?: boolean;
  populationSize?: number;
}

export const BotProfilesPhase: React.FC<BotProfilesPhaseProps> = ({
  bots,
  generateReviews,
  setActiveStep,
  isGeneratingReviews,
  isGeneratingBots = false,
  populationSize = 0,
}) => {
  return (
    <Card className="border-border bg-card/60 backdrop-blur-md overflow-hidden rounded-2xl shadow-lg shadow-black/[0.03]">
      <CardHeader className="border-b border-border/60 bg-muted/10 pb-5">
        <CardTitle className="flex items-center gap-2.5 text-lg font-bold">
          <UserCircle2 className="h-5 w-5 text-primary" />
          Perfiles de bot
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">Revisa los perfiles de bot generados antes de crear las reseñas</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {isGeneratingBots && populationSize > 0 && (
          <div className="mb-6 p-5 bg-primary/5 rounded-2xl border border-primary/10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-primary animate-pulse" />
                Creando población de reseñadores en tiempo real...
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
              Conectando con el agente creador de usuarios para generar el primer perfil...
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((bot, index) => (
            <motion.div
              key={bot.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full border-border bg-background/40 hover:border-primary/20 transition-all rounded-2xl glow-card-hover flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-border shadow-sm shrink-0">
                      <AvatarImage src={bot.avatar?.includes('dicebear') ? bot.avatar : `https://api.dicebear.com/10.x/croodles-neutral/svg?mouthVariant=variant01,variant02,variant03,variant04,variant05,variant06,variant07,variant09,variant10,variant11,variant12,variant13,variant14,variant15,variant16,variant17,variant18&seed=${encodeURIComponent(bot.name)}`} alt={bot.name} />
                      <AvatarFallback
                        className={`${bot.gender === "Male" ? "bg-gradient-to-br from-indigo-500 to-indigo-600" : "bg-gradient-to-br from-pink-500 to-purple-600"} text-white flex items-center justify-center`}
                      >
                        {bot.gender === "Male" ? (
                          <MaleIcon className="h-6 w-6" />
                        ) : (
                          <FemaleIcon className="h-6 w-6" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-bold text-foreground truncate">{bot.name}</CardTitle>
                      <CardDescription className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {bot.age} años • {bot.gender === "Male" ? "Hombre" : "Mujer"} • {bot.location}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5">{bot.education_level}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-3">{bot.bio}</p>

                    {bot.backstory && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="link"
                            className="text-primary hover:text-primary/80 p-0 h-auto font-semibold text-[11px] mb-3 flex items-center gap-1"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            Ver historia de fondo
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md md:max-w-lg bg-card border border-border text-foreground rounded-2xl">
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

                  <div className="space-y-2.5 pt-3.5 border-t border-border/40">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Rasgos de personalidad
                    </h4>
                    <div className="grid grid-cols-1 gap-2 text-[10px] font-medium text-muted-foreground">
                      <div>
                        <div className="flex justify-between">
                          <span>Introvertido</span>
                          <span>Extrovertido</span>
                        </div>
                        <div className="w-full bg-muted h-1 rounded-full mt-1">
                          <div
                            className="bg-primary h-1 rounded-full shadow-[0_0_4px_rgba(99,102,241,0.3)]"
                            style={{ width: `${Math.round(bot.personality.introvert_extrovert)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between">
                          <span>Analítico</span>
                          <span>Creativo</span>
                        </div>
                        <div className="w-full bg-muted h-1 rounded-full mt-1">
                          <div
                            className="bg-primary h-1 rounded-full shadow-[0_0_4px_rgba(99,102,241,0.3)]"
                            style={{ width: `${Math.round(bot.personality.analytical_creative)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between">
                          <span>Ocupado</span>
                          <span>Tiempo libre</span>
                        </div>
                        <div className="w-full bg-muted h-1 rounded-full mt-1">
                          <div
                            className="bg-primary h-1 rounded-full shadow-[0_0_4px_rgba(99,102,241,0.3)]"
                            style={{ width: `${Math.round(bot.personality.busy_free_time)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between">
                          <span>Desorganizado</span>
                          <span>Organizado</span>
                        </div>
                        <div className="w-full bg-muted h-1 rounded-full mt-1">
                          <div
                            className="bg-primary h-1 rounded-full shadow-[0_0_4px_rgba(99,102,241,0.3)]"
                            style={{ width: `${Math.round(bot.personality.disorganized_organized)}%` }}
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

        <div className="flex justify-between mt-8 border-t border-border/60 pt-5">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => setActiveStep(1)}
              variant="outline"
              className="border-border hover:bg-accent rounded-xl text-xs font-semibold px-4 h-10 transition-colors"
              disabled={isGeneratingBots}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a configuración
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: (isGeneratingReviews || isGeneratingBots) ? 1 : 1.02 }} whileTap={{ scale: (isGeneratingReviews || isGeneratingBots) ? 1 : 0.98 }}>
            <Button
              onClick={generateReviews}
              className="bg-primary text-primary-foreground hover:bg-primary/95 transition-all font-semibold rounded-xl px-5 h-10 shadow-sm shadow-primary/10"
              disabled={isGeneratingReviews || isGeneratingBots}
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
              ) : isGeneratingBots ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="mr-2"
                  >
                    <Zap className="h-4 w-4" />
                  </motion.div>
                  Generando perfiles ({bots.length}/{populationSize})...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Generar reseñas</span>
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