import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Users, UserCircle2, Zap } from "lucide-react";
import { CustomRangeSlider } from "@/components/custom-range-slider";
import { DemographicConfig, PersonalityConfig } from "@/lib/types";

interface ConfigPhaseProps {
  populationRange: [number, number];
  setPopulationRange: (range: [number, number]) => void;
  positivityBias: [number, number];
  setPositivityBias: (range: [number, number]) => void;
  verbosity: [number, number];
  setVerbosity: (range: [number, number]) => void;
  detailLevel: [number, number];
  setDetailLevel: (range: [number, number]) => void;
  demographics: DemographicConfig;
  setDemographics: (config: DemographicConfig) => void;
  personality: PersonalityConfig;
  setPersonality: (config: PersonalityConfig) => void;
  generateBots: () => Promise<void>;
  setActiveStep: (step: number) => void;
  isGeneratingBots: boolean;
}

export const ConfigPhase: React.FC<ConfigPhaseProps> = ({
  populationRange,
  setPopulationRange,
  positivityBias,
  setPositivityBias,
  verbosity,
  setVerbosity,
  detailLevel,
  setDetailLevel,
  demographics,
  setDemographics,
  personality,
  setPersonality,
  generateBots,
  setActiveStep,
  isGeneratingBots,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Demographics */}
          <div>
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Tamaño de la población</h3>
              <CustomRangeSlider
                label=""
                minLabel="min"
                maxLabel="max"
                minValue={populationRange[0]}
                maxValue={populationRange[1]}
                absoluteMin={1}
                absoluteMax={100}
                onChange={(min, max) => setPopulationRange([min, max])}
              />
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Demografía</h3>

              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">Edad</h4>
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
                <h4 className="text-lg font-semibold mb-2">Nivel educativo</h4>
                <CustomRangeSlider
                  label=""
                  minLabel="min"
                  maxLabel="max"
                  minValue={demographics.education_range[0]}
                  maxValue={demographics.education_range[1]}
                  absoluteMin={8}
                  absoluteMax={22}
                  onChange={(min, max) => setDemographics({ ...demographics, education_range: [min, max] })}
                />
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">Género</h4>
                <div className="flex gap-4 mt-4">
                  <Button
                    onClick={() => setDemographics({ ...demographics, gender_ratio: 100 })}
                    className={`flex-1 ${demographics.gender_ratio === 100 ? "bg-green-500 hover:bg-green-600" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}
                  >
                    M
                  </Button>
                  <Button
                    onClick={() => setDemographics({ ...demographics, gender_ratio: 50 })}
                    className={`flex-1 ${demographics.gender_ratio === 50 ? "bg-gradient-to-r from-green-500 to-orange-500 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}
                  >
                    M/F
                  </Button>
                  <Button
                    onClick={() => setDemographics({ ...demographics, gender_ratio: 0 })}
                    className={`flex-1 ${demographics.gender_ratio === 0 ? "bg-orange-500 hover:bg-orange-600" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}
                  >
                    F
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Review Settings */}
          <div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Configuración de reseñas</h3>
              
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">Sesgo de positividad</h4>
                <CustomRangeSlider
                  label=""
                  minValue={positivityBias[0]}
                  maxValue={positivityBias[1]}
                  absoluteMin={0}
                  absoluteMax={100}
                  onChange={(min, max) => setPositivityBias([min, max])}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Valores más altos generan reseñas más positivas
                </p>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">Verbosidad</h4>
                <CustomRangeSlider
                  label=""
                  minValue={verbosity[0]}
                  maxValue={verbosity[1]}
                  absoluteMin={0}
                  absoluteMax={100}
                  onChange={(min, max) => setVerbosity([min, max])}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Controla la longitud y detalle de las reseñas
                </p>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">Nivel de detalle del producto</h4>
                <CustomRangeSlider
                  label=""
                  minValue={detailLevel[0]}
                  maxValue={detailLevel[1]}
                  absoluteMin={0}
                  absoluteMax={100}
                  onChange={(min, max) => setDetailLevel([min, max])}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Cuánta información específica del producto incluir en las reseñas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de personalidad */}
        <div className="mt-8 bg-amber-50 dark:bg-amber-950/30 p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-6">Personalidad</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-6">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Introvertido</span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Extrovertido</span>
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

              <div className="mb-6">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Analítico</span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Creativo</span>
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

              <div className="mb-6">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ocupado</span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tiempo libre</span>
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

              <div className="mb-6 md:mb-0">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Desorganizado</span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Organizado</span>
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

            <div>
              <div className="mb-6">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Independiente</span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Cooperativo</span>
                </div>
                <CustomRangeSlider
                  label=""
                  minValue={personality.independent_cooperative[0]}
                  maxValue={personality.independent_cooperative[1]}
                  absoluteMin={0}
                  absoluteMax={100}
                  onChange={(min, max) =>
                    setPersonality({ ...personality, independent_cooperative: [min, max] })
                  }
                />
              </div>

              <div className="mb-6">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ecologista</span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">No ecologista</span>
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

              <div className="mb-6">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Seguro</span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Arriesgado</span>
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