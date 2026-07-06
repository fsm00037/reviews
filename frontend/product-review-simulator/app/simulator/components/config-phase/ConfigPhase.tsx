import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Users, UserCircle2, Zap, Settings, Sparkles } from "lucide-react";
import { CustomRangeSlider } from "@/components/custom-range-slider";
import { DemographicConfig, PersonalityConfig, BotProfile } from "@/lib/types";

interface ConfigPhaseProps {
  populationSize: number;
  setPopulationSize: (size: number) => void;
  demographics: DemographicConfig;
  setDemographics: (config: DemographicConfig) => void;
  personality: PersonalityConfig;
  setPersonality: (config: PersonalityConfig) => void;
  adaptToProduct: boolean;
  setAdaptToProduct: (adapt: boolean) => void;
  generateBots: () => Promise<void>;
  setActiveStep: (step: number) => void;
  isGeneratingBots: boolean;
  bots: BotProfile[];
  populationPrompt: string;
  setPopulationPrompt: (prompt: string) => void;
  useCustomConfig: boolean;
  setUseCustomConfig: (useCustom: boolean) => void;
}

export const ConfigPhase: React.FC<ConfigPhaseProps> = ({
  populationSize,
  setPopulationSize,
  demographics,
  setDemographics,
  personality,
  setPersonality,
  adaptToProduct,
  setAdaptToProduct,
  generateBots,
  setActiveStep,
  isGeneratingBots,
  bots,
  populationPrompt,
  setPopulationPrompt,
  useCustomConfig,
  setUseCustomConfig,
}) => {
  return (
    <Card className="border-purple-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          Configuración de bots
        </CardTitle>
        <CardDescription>Ajusta los parámetros para la generación de perfiles de bots</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Fila superior: Tamaño de la población y Adaptación de Producto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-purple-50/30 dark:bg-gray-900/30 p-5 rounded-xl border border-purple-100/50 dark:border-gray-800/50">
            <div>
              <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Tamaño de la población</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">1</span>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{populationSize} bots</span>
                <span className="text-xs text-gray-500">100</span>
              </div>
              <div className="relative py-2">
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={populationSize}
                  onChange={(e) => setPopulationSize(parseInt((e.target as HTMLInputElement).value))}
                  aria-label="Tamaño de la población"
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer population-slider"
                  data-value={populationSize}
                />
                <style dangerouslySetInnerHTML={{
                  __html: `
                    .population-slider {
                      background: linear-gradient(to right, 
                        rgb(99, 102, 241) 0%, 
                        rgb(139, 92, 246) ${((populationSize - 1) / 99) * 50}%, 
                        rgb(236, 72, 153) ${((populationSize - 1) / 99) * 100}%, 
                        rgb(229, 231, 235) ${((populationSize - 1) / 99) * 100}%, 
                        rgb(229, 231, 235) 100%);
                    }
                    .dark .population-slider {
                      background: linear-gradient(to right, 
                        rgb(99, 102, 241) 0%, 
                        rgb(139, 92, 246) ${((populationSize - 1) / 99) * 50}%, 
                        rgb(236, 72, 153) ${((populationSize - 1) / 99) * 100}%, 
                        rgb(55, 65, 81) ${((populationSize - 1) / 99) * 100}%, 
                        rgb(55, 65, 81) 100%);
                    }
                    .population-slider::-webkit-slider-thumb {
                      appearance: none;
                      height: 20px;
                      width: 20px;
                      border-radius: 50%;
                      background: white;
                      border: 2px solid rgb(236, 72, 153);
                      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                      cursor: pointer;
                    }
                    .population-slider::-moz-range-thumb {
                      height: 18px;
                      width: 18px;
                      border-radius: 50%;
                      background: white;
                      border: 2px solid rgb(236, 72, 153);
                      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                      cursor: pointer;
                    }
                    .dark .population-slider::-webkit-slider-thumb {
                      background: rgb(3, 7, 18);
                      border: 2px solid rgb(236, 72, 153);
                    }
                    .dark .population-slider::-moz-range-thumb {
                      background: rgb(3, 7, 18);
                      border: 2px solid rgb(236, 72, 153);
                    }
                  `
                }} />
              </div>
            </div>

            <div className="flex items-center">
              <div className="flex items-center space-x-3 p-4 bg-purple-500/5 rounded-lg border border-purple-200/30 dark:border-gray-800/30 w-full">
                <input
                  type="checkbox"
                  id="adaptToProduct"
                  checked={adaptToProduct}
                  onChange={(e) => setAdaptToProduct(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <div className="flex-1 cursor-pointer" onClick={() => setAdaptToProduct(!adaptToProduct)}>
                  <label htmlFor="adaptToProduct" className="font-bold text-sm text-purple-900 dark:text-purple-300 cursor-pointer block">
                    Adaptar perfiles al producto (Clientes Objetivo)
                  </label>
                  <span className="text-xs text-purple-700 dark:text-gray-400 block mt-0.5">
                    Genera perfiles de usuarios que representen al cliente ideal (target) en base a la descripción, categoría y precio del producto.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque principal: Prompt de población */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <Label htmlFor="populationPrompt" className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
                Describir la población con un Prompt (Recomendado)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`text-xs font-semibold h-8 border-purple-200/50 ${useCustomConfig ? 'text-purple-700 bg-purple-100/50 dark:text-purple-400 dark:bg-purple-900/30 border-purple-300' : 'text-gray-500 hover:text-purple-600 dark:border-gray-800'}`}
                onClick={() => setUseCustomConfig(!useCustomConfig)}
              >
                <Settings className="h-3.5 w-3.5 mr-1" />
                {useCustomConfig ? "Ocultar sliders personalizados" : "Personalización avanzada (Sliders)"}
              </Button>
            </div>
            <Textarea
              id="populationPrompt"
              value={populationPrompt}
              onChange={(e) => setPopulationPrompt(e.target.value)}
              placeholder="Ej: Estudiantes universitarios de entre 18 y 24 años de Madrid y Barcelona, apasionados por la música, que buscan productos duraderos pero de bajo presupuesto..."
              rows={4}
              className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-gray-700 focus-visible:ring-purple-500 min-h-[100px] text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Describe en lenguaje natural los intereses, rasgos de personalidad, edad u origen para guiar la generación de los bots.
            </p>
          </div>

          {/* Opciones Avanzadas de Personalización (Condicional con AnimatePresence) */}
          <AnimatePresence>
            {useCustomConfig && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-purple-100 dark:border-gray-800 overflow-hidden"
              >
                {/* Left Column - Demographics */}
                <div>
                  <h3 className="text-base font-bold mb-4 text-purple-900 dark:text-purple-300 flex items-center gap-2">
                    <UserCircle2 className="h-5 w-5" />
                    Datos Demográficos
                  </h3>

                  <div className="mb-6">
                    <h4 className="text-sm font-semibold mb-2">Edad</h4>
                    <CustomRangeSlider
                      label=""
                      minLabel="min"
                      maxLabel="max"
                      minValue={demographics.age_range[0]}
                      maxValue={demographics.age_range[1]}
                      absoluteMin={12}
                      absoluteMax={80}
                      onChange={(min, max) => setDemographics({ ...demographics, age_range: [min, max] })}
                    />
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-semibold mb-2">Nivel educativo</h4>
                    <div className="flex items-center space-x-4 flex-wrap">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="educationLow"
                          name="educationLevel"
                          checked={demographics.education_level === "Low"}
                          onChange={() => setDemographics({...demographics, education_level: "Low"})}
                          className="mr-2"
                        />
                        <label htmlFor="educationLow" className="text-sm">Bajo</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="educationMedium"
                          name="educationLevel"
                          checked={demographics.education_level === "Medium"}
                          onChange={() => setDemographics({...demographics, education_level: "Medium"})}
                          className="mr-2"
                        />
                        <label htmlFor="educationMedium" className="text-sm">Medio</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="educationHigh"
                          name="educationLevel"
                          checked={demographics.education_level === "High"}
                          onChange={() => setDemographics({...demographics, education_level: "High"})}
                          className="mr-2"
                        />
                        <label htmlFor="educationHigh" className="text-sm">Alto</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="educationMixed"
                          name="educationLevel"
                          checked={demographics.education_level === "Mixed"}
                          onChange={() => setDemographics({...demographics, education_level: "Mixed"})}
                          className="mr-2"
                        />
                        <label htmlFor="educationMixed" className="text-sm">Mixto</label>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-semibold mb-2">Género</h4>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="genderMale"
                            name="genderRatio"
                            checked={demographics.gender_ratio === "Male"}
                            onChange={() => setDemographics({...demographics, gender_ratio: "Male"})}
                            className="mr-2"
                          />
                          <label htmlFor="genderMale" className="text-sm">Masculino</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="genderFemale"
                            name="genderRatio"
                            checked={demographics.gender_ratio === "Female"}
                            onChange={() => setDemographics({...demographics, gender_ratio: "Female"})}
                            className="mr-2"
                          />
                          <label htmlFor="genderFemale" className="text-sm">Femenino</label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="genderBoth"
                            name="genderRatio"
                            checked={demographics.gender_ratio === "Male&Female"}
                            onChange={() => setDemographics({...demographics, gender_ratio: "Male&Female"})}
                            className="mr-2"
                          />
                          <label htmlFor="genderBoth" className="text-sm">Mixto</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Personality */}
                <div className="bg-amber-50/50 dark:bg-amber-950/10 p-5 rounded-xl border border-amber-100/50 dark:border-amber-900/10">
                  <h3 className="text-base font-bold mb-4 text-amber-900 dark:text-amber-400 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Rasgos de Personalidad
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1 text-xs">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Introvertido</span>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Extrovertido</span>
                        </div>
                        <CustomRangeSlider
                          label=""
                          minValue={personality.introvert_extrovert[0]}
                          maxValue={personality.introvert_extrovert[1]}
                          absoluteMin={0}
                          absoluteMax={100}
                          onChange={(min, max) => setPersonality({ ...personality, introvert_extrovert: [min, max] })}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1 text-xs">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Analítico</span>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Creativo</span>
                        </div>
                        <CustomRangeSlider
                          label=""
                          minValue={personality.analytical_creative[0]}
                          maxValue={personality.analytical_creative[1]}
                          absoluteMin={0}
                          absoluteMax={100}
                          onChange={(min, max) => setPersonality({ ...personality, analytical_creative: [min, max] })}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1 text-xs">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Ocupado</span>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Tiempo libre</span>
                        </div>
                        <CustomRangeSlider
                          label=""
                          minValue={personality.busy_free_time[0]}
                          maxValue={personality.busy_free_time[1]}
                          absoluteMin={0}
                          absoluteMax={100}
                          onChange={(min, max) => setPersonality({ ...personality, busy_free_time: [min, max] })}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1 text-xs">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Desorganizado</span>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Organizado</span>
                        </div>
                        <CustomRangeSlider
                          label=""
                          minValue={personality.disorganized_organized[0]}
                          maxValue={personality.disorganized_organized[1]}
                          absoluteMin={0}
                          absoluteMax={100}
                          onChange={(min, max) => setPersonality({ ...personality, disorganized_organized: [min, max] })}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1 text-xs">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Independiente</span>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Cooperativo</span>
                        </div>
                        <CustomRangeSlider
                          label=""
                          minValue={personality.independent_cooperative[0]}
                          maxValue={personality.independent_cooperative[1]}
                          absoluteMin={0}
                          absoluteMax={100}
                          onChange={(min, max) => setPersonality({ ...personality, independent_cooperative: [min, max] })}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1 text-xs">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Poco ecologista</span>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Ecologista</span>
                        </div>
                        <CustomRangeSlider
                          label=""
                          minValue={personality.environmentalist[0]}
                          maxValue={personality.environmentalist[1]}
                          absoluteMin={0}
                          absoluteMax={100}
                          onChange={(min, max) => setPersonality({ ...personality, environmentalist: [min, max] })}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1 text-xs">
                          <span className="font-medium text-gray-600 dark:text-gray-400">Prudente</span>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Arriesgado</span>
                        </div>
                        <CustomRangeSlider
                          label=""
                          minValue={personality.safe_risky[0]}
                          maxValue={personality.safe_risky[1]}
                          absoluteMin={0}
                          absoluteMax={100}
                          onChange={(min, max) => setPersonality({ ...personality, safe_risky: [min, max] })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>

      <CardContent className="p-6 pt-0">
        {isGeneratingBots && (
          <div className="mt-8 p-6 bg-purple-500/5 rounded-xl border border-purple-200/50 dark:border-gray-800 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm text-purple-900 dark:text-purple-300 flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Zap className="h-4 w-4 text-purple-500" />
                </motion.div>
                Generando perfiles ({bots.length} de {populationSize})
              </h4>
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">
                {Math.round((bots.length / populationSize) * 100)}% completado
              </span>
            </div>
            
            <div className="w-full bg-purple-100 dark:bg-gray-800 rounded-full h-2 mb-6 overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full"
                initial={{ width: 0 }}
                animate={{ width: `${(bots.length / populationSize) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            {bots.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
                {bots.map((bot, index) => (
                  <motion.div
                    key={bot.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-white/50 dark:bg-gray-900/50 border border-purple-100/50 dark:border-gray-800/50 rounded-lg flex items-center space-x-3 shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center font-bold text-xs text-purple-600 dark:text-purple-400 shrink-0">
                      {bot.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{bot.name}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{bot.location} • {bot.age} años • {bot.gender === 'Male' ? 'Hombre' : bot.gender === 'Female' ? 'Mujer' : 'Otro'}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-purple-600/70 dark:text-purple-400/70 italic text-center py-2">
                Preparando primer perfil de reseñador...
              </p>
            )}
          </div>
        )}

        <div className="flex justify-between mt-8">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setActiveStep(0)}
              variant="outline"
              className="border-purple-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a información del producto
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={generateBots}
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity relative overflow-hidden"
              disabled={isGeneratingBots}
            >
              {isGeneratingBots ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="mr-2"
                  >
                    <Zap className="h-4 w-4" />
                  </motion.div>
                  <span className="relative z-10">Generando perfiles de bot...</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 2,
                      ease: "linear",
                    }}
                    style={{ opacity: 0.3 }}
                  />
                </>
              ) : (
                <>
                  <UserCircle2 className="mr-2 h-4 w-4" />
                  <span>Generar perfiles de bot</span>
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}; 