import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, ArrowRight, Users, UserCircle2, Zap } from "lucide-react";
import { CustomRangeSlider } from "@/components/custom-range-slider";
import { DemographicConfig, PersonalityConfig } from "@/lib/types";

interface ConfigPhaseProps {
  populationSize: number;
  setPopulationSize: (size: number) => void;
  demographics: DemographicConfig;
  setDemographics: (config: DemographicConfig) => void;
  personality: PersonalityConfig;
  setPersonality: (config: PersonalityConfig) => void;
  generateBots: () => Promise<void>;
  setActiveStep: (step: number) => void;
  isGeneratingBots: boolean;
}

export const ConfigPhase: React.FC<ConfigPhaseProps> = ({
  populationSize,
  setPopulationSize,
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
          {/* Left Column - Population & Demographics */}
          <div>
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Tamaño de la población</h3>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">1</span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">100</span>
              </div>
              <div className="flex justify-center mb-2">
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{populationSize} bots</span>
              </div>
              <div className="relative py-4">
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
                    <label htmlFor="educationLow">Bajo</label>
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
                    <label htmlFor="educationMedium">Medio</label>
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
                    <label htmlFor="educationHigh">Alto</label>
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
                    <label htmlFor="educationMixed">Mixto</label>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">Género</h4>
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
                      <label htmlFor="genderMale">Masculino</label>
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
                      <label htmlFor="genderFemale">Femenino</label>
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
                      <label htmlFor="genderBoth">Mixto</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Personality */}
          <div className="bg-amber-50 dark:bg-amber-950/30 p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-6">Personalidad</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Left sub-column */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
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

                <div>
                  <div className="flex justify-between mb-2">
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

                <div>
                  <div className="flex justify-between mb-2">
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

                <div>
                  <div className="flex justify-between mb-2">
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

              {/* Right sub-column */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
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

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">No Ecologista</span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ecologista</span>
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
                  <div className="flex justify-between mb-2">
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