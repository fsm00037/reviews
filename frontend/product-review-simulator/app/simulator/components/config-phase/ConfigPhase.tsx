import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Users, UserCircle2, Zap, Settings, Sparkles, Wand2, CheckCircle2, Trash2 } from "lucide-react";
import { CustomRangeSlider } from "@/components/custom-range-slider";
import { DemographicConfig, PersonalityConfig, BotProfile, RecentSession } from "@/lib/types";
import { PresetService, SavedPopulationService, SimulatorService, BotService } from "@/lib/api-services";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
  setBots: (bots: BotProfile[]) => void;
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
  setBots,
  populationPrompt,
  setPopulationPrompt,
  useCustomConfig,
  setUseCustomConfig,
}) => {
  type PresetMeta = { id: number; name: string; description: string; icon: string; tag: string };
  const [presets, setPresets] = useState<PresetMeta[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [loadingPreset, setLoadingPreset] = useState<number | null>(null);
  const [presetLoaded, setPresetLoaded] = useState<number | null>(null);
  const [configTab, setConfigTab] = useState<"preset" | "custom">("preset");

  // Custom User Population states
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string } | null>(null);
  const [userSavedPopulations, setUserSavedPopulations] = useState<any[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDesc, setSaveDesc] = useState("");
  const [savingPop, setSavingPop] = useState(false);

  // Recent sessions populations states
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loadingRecentPop, setLoadingRecentPop] = useState<string | null>(null);

  useEffect(() => {
    PresetService.getPresets().then((data) => {
      if (Array.isArray(data)) setPresets(data);
    }).catch(() => {});

    SimulatorService.getRecentSessions().then((data) => {
      if (Array.isArray(data)) {
        setRecentSessions(data.slice(0, 3));
      }
    }).catch(() => {});

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("review_simulator_user");
      if (stored) {
        try {
          const parsedUser = JSON.parse(stored);
          setCurrentUser(parsedUser);
          SavedPopulationService.getSavedPopulations().then((data) => {
            if (Array.isArray(data)) setUserSavedPopulations(data);
          }).catch(() => {});
        } catch (e) {}
      }
    }
  }, []);

  const handleLoadRecentPopulation = async (sessId: string) => {
    setLoadingRecentPop(sessId);
    try {
      const profiles = await BotService.getSessionReviewers(sessId);
      if (Array.isArray(profiles) && profiles.length > 0) {
        setBots(profiles);
        setPopulationSize(profiles.length);
        // Auto-navigate to profiles phase
        setActiveStep(2);
      } else {
        alert("Esta simulación no tiene perfiles de reseñadores generados.");
      }
    } catch (e) {
      console.error("Error loading recent reviewers:", e);
    } finally {
      setLoadingRecentPop(null);
    }
  };

  const handleLoadPreset = async (id: number) => {
    setLoadingPreset(id);
    try {
      const result = await PresetService.loadPreset(id);
      if (result?.profiles) {
        setBots(result.profiles);
      }
      setPresetLoaded(id);
      setSelectedPreset(id);
      // Auto-navigate to profiles phase
      setActiveStep(2);
    } catch (e) {
      // silently ignore
    } finally {
      setLoadingPreset(null);
    }
  };

  const handleLoadUserPopulation = (pop: any) => {
    setPopulationSize(pop.num_reviewers);
    if (pop.profile_parameters) {
      const params = pop.profile_parameters;
      if (params.demographics) setDemographics(params.demographics);
      if (params.personality) setPersonality(params.personality);
      if (params.population_prompt !== undefined) setPopulationPrompt(params.population_prompt);
      setUseCustomConfig(true);
      setConfigTab("custom");
    }
  };

  const handleSavePopulation = async () => {
    if (!saveName.trim()) return;
    setSavingPop(true);
    try {
      const response = await SavedPopulationService.savePopulation(
        saveName,
        saveDesc,
        populationSize,
        {
          demographics,
          personality,
          population_prompt: populationPrompt
        }
      );
      if (response && response.id) {
        setUserSavedPopulations([
          {
            id: response.id,
            name: saveName,
            description: saveDesc,
            num_reviewers: populationSize,
            profile_parameters: { demographics, personality, population_prompt: populationPrompt }
          },
          ...userSavedPopulations
        ]);
        setIsSaveModalOpen(false);
        setSaveName("");
        setSaveDesc("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingPop(false);
    }
  };

  const handleDeleteUserPopulation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Estás seguro de que quieres eliminar esta población guardada?")) return;
    try {
      await SavedPopulationService.deletePopulation(id);
      setUserSavedPopulations(userSavedPopulations.filter(p => p.id !== id));
      if (selectedPreset === id) {
        setSelectedPreset(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card className="border-purple-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          Configuración de bots
        </CardTitle>
        <CardDescription>Ajusta los parámetros para la generación de perfiles de bots</CardDescription>
      </CardHeader>
      <CardContent className="p-0">

        {/*  Tab Bar  */}
        <div className="flex border-b border-purple-100 dark:border-gray-800">
          {[
            { id: "preset", label: "Poblaciones predeterminadas", icon: <Wand2 className="h-4 w-4" /> },
            { id: "custom", label: "Crear una población", icon: <Settings className="h-4 w-4" /> },
          ].map((tab) => {
            const active = configTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setConfigTab(tab.id as "preset" | "custom")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold transition-all border-b-2 ${
                  active
                    ? "border-purple-500 text-purple-700 dark:text-purple-300 bg-purple-50/40 dark:bg-purple-950/20"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50/20 dark:hover:bg-purple-950/10"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">

            {/*  Tab 1: Poblaciones predeterminadas  */}
            {configTab === "preset" && (
              <motion.div
                key="preset"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {presets.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                    <Wand2 className="h-8 w-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Cargando poblaciones predeterminadas</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Selecciona una población lista para usar. Los 10 perfiles se cargarán al instante y podrás pasar directamente a generar reseñas.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {presets.map((preset) => {
                        const isSelected = selectedPreset === preset.id;
                        const isLoading = loadingPreset === preset.id;
                        return (
                          <motion.div
                            key={preset.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative rounded-xl border-2 p-5 cursor-pointer transition-all ${
                              isSelected
                                ? "border-purple-500 dark:border-purple-500 bg-purple-50/70 dark:bg-purple-950/30 shadow-lg shadow-purple-100/50 dark:shadow-purple-950/30"
                                : "border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/40 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md"
                            }`}
                            onClick={() => !isLoading && handleLoadPreset(preset.id)}
                          >
                            {isSelected && (
                              <div className="absolute top-3 right-3 bg-purple-500 rounded-full p-0.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                              </div>
                            )}
                            <div className="text-3xl mb-3">{preset.icon}</div>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight mb-1.5">{preset.name}</p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mb-3">{preset.description}</p>
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100/70 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                              {preset.tag}
                            </span>
                            {isLoading && (
                              <div className="mt-3 flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                  <Zap className="h-3 w-3" />
                                </motion.div>
                                Cargando perfiles
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    {currentUser && userSavedPopulations.length > 0 && (
                      <div className="mt-8 border-t border-purple-100 dark:border-gray-800 pt-6 text-left">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                          Mis Poblaciones Personalizadas Guardadas
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {userSavedPopulations.map((pop) => (
                            <motion.div
                              key={pop.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="relative rounded-xl border border-purple-200/60 dark:border-gray-800 bg-purple-500/[0.01] dark:bg-purple-950/[0.02] p-5 cursor-pointer hover:border-purple-400 hover:shadow-md transition-all flex flex-col justify-between"
                              onClick={() => handleLoadUserPopulation(pop)}
                            >
                              <div className="absolute top-3 right-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full"
                                  onClick={(e) => handleDeleteUserPopulation(pop.id, e)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <div>
                                <div className="text-2xl mb-2">👤</div>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight mb-1">{pop.name}</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mb-3 line-clamp-2">{pop.description || "Sin descripción"}</p>
                              </div>
                              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100/70 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 w-max">
                                {pop.num_reviewers} reseñadores
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {recentSessions.length > 0 && (
                      <div className="mt-8 border-t border-purple-100 dark:border-gray-800 pt-6 text-left">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                          Poblaciones Usadas Recientemente
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {recentSessions.map((sess) => {
                            const isLoading = loadingRecentPop === sess.session_id;
                            return (
                              <motion.div
                                key={sess.session_id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="relative rounded-xl border border-purple-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/40 p-5 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between"
                                onClick={() => !isLoading && handleLoadRecentPopulation(sess.session_id)}
                              >
                                {isLoading && (
                                  <div className="absolute inset-0 bg-white/80 dark:bg-gray-950/80 rounded-xl flex items-center justify-center z-10">
                                    <Zap className="h-4 w-4 animate-spin text-purple-600" />
                                  </div>
                                )}
                                <div>
                                  <div className="text-2xl mb-2">⏱️</div>
                                  <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Simulación previa</p>
                                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight mt-1 line-clamp-2">{sess.product_name}</p>
                                </div>
                                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 mt-3 rounded-full bg-indigo-100/70 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 w-max">
                                  Reutilizar población
                                </span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-center text-gray-400 dark:text-gray-500 pt-3">
                      Haz clic en una población para cargarla y empezar a simular.
                    </p>
                  </>
                )}
              </motion.div>
            )}

            {/*  Tab 2: Crear una población  */}
            {configTab === "custom" && (
              <motion.div
                key="custom"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Fila superior: Tamaño y Adaptación */}
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
                          Adaptar perfiles al producto
                        </label>
                        <span className="text-xs text-purple-700 dark:text-gray-400 block mt-0.5">
                          Genera perfiles de usuarios que representen al cliente ideal (target) en base a la descripción, categoría y precio del producto.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prompt de población */}
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

                {/* Sliders avanzados (condicional) */}
                <AnimatePresence>
                  {useCustomConfig && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-purple-100 dark:border-gray-800 overflow-hidden"
                    >
                      {/* Demografía */}
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
                          <div className="flex items-center space-x-4 flex-wrap gap-y-2">
                            {(["Low","Medium","High","Mixed"] as const).map((lvl) => (
                              <div key={lvl} className="flex items-center">
                                <input type="radio" id={`edu-${lvl}`} name="educationLevel"
                                  checked={demographics.education_level === lvl}
                                  onChange={() => setDemographics({...demographics, education_level: lvl})}
                                  className="mr-2" />
                                <label htmlFor={`edu-${lvl}`} className="text-sm">
                                  {lvl === "Low" ? "Bajo" : lvl === "Medium" ? "Medio" : lvl === "High" ? "Alto" : "Mixto"}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold mb-2">Género</h4>
                          <div className="flex items-center space-x-4">
                            {([["Male","Masculino"],["Female","Femenino"],["Male&Female","Mixto"]] as const).map(([val, label]) => (
                              <div key={val} className="flex items-center">
                                <input type="radio" id={`gender-${val}`} name="genderRatio"
                                  checked={demographics.gender_ratio === val}
                                  onChange={() => setDemographics({...demographics, gender_ratio: val})}
                                  className="mr-2" />
                                <label htmlFor={`gender-${val}`} className="text-sm">{label}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Personalidad */}
                      <div className="bg-amber-50/50 dark:bg-amber-950/10 p-5 rounded-xl border border-amber-100/50 dark:border-amber-900/10">
                        <h3 className="text-base font-bold mb-4 text-amber-900 dark:text-amber-400 flex items-center gap-2">
                          <Zap className="h-5 w-5 text-amber-500" />
                          Rasgos de Personalidad
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-4">
                            {([
                              ["introvert_extrovert", "Introvertido", "Extrovertido"],
                              ["analytical_creative", "Analítico", "Creativo"],
                              ["busy_free_time", "Ocupado", "Tiempo libre"],
                              ["disorganized_organized", "Desorganizado", "Organizado"],
                            ] as const).map(([key, minL, maxL]) => (
                              <div key={key}>
                                <div className="flex justify-between mb-1 text-xs">
                                  <span className="font-medium text-gray-600 dark:text-gray-400">{minL}</span>
                                  <span className="font-medium text-gray-600 dark:text-gray-400">{maxL}</span>
                                </div>
                                <CustomRangeSlider
                                  label=""
                                  minValue={personality[key][0]}
                                  maxValue={personality[key][1]}
                                  absoluteMin={0}
                                  absoluteMax={100}
                                  onChange={(min, max) => setPersonality({ ...personality, [key]: [min, max] })}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="space-y-4">
                            {([
                              ["independent_cooperative", "Independiente", "Cooperativo"],
                              ["environmentalist", "Poco ecologista", "Ecologista"],
                              ["safe_risky", "Prudente", "Arriesgado"],
                            ] as const).map(([key, minL, maxL]) => (
                              <div key={key}>
                                <div className="flex justify-between mb-1 text-xs">
                                  <span className="font-medium text-gray-600 dark:text-gray-400">{minL}</span>
                                  <span className="font-medium text-gray-600 dark:text-gray-400">{maxL}</span>
                                </div>
                                <CustomRangeSlider
                                  label=""
                                  minValue={personality[key][0]}
                                  maxValue={personality[key][1]}
                                  absoluteMin={0}
                                  absoluteMax={100}
                                  onChange={(min, max) => setPersonality({ ...personality, [key]: [min, max] })}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bot generation progress */}
                {isGeneratingBots && (
                  <div className="mt-2 p-6 bg-purple-500/5 rounded-xl border border-purple-200/50 dark:border-gray-800 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-sm text-purple-900 dark:text-purple-300 flex items-center gap-2">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}>
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
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{bot.location}  {bot.age} años  {bot.gender === 'Male' ? 'Hombre' : bot.gender === 'Female' ? 'Mujer' : 'Otro'}</p>
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
              </motion.div>
            )}
          </AnimatePresence>

          {/*  Navigation  */}
          <div className="flex justify-between mt-8">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setActiveStep(0)}
                variant="outline"
                className="border-purple-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al producto
              </Button>
            </motion.div>

            {configTab === "custom" && (
              <div className="flex gap-3">
                {currentUser && (
                  <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-purple-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors"
                        disabled={isGeneratingBots}
                      >
                        Guardar población
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm bg-white dark:bg-gray-950 border dark:border-gray-800 text-gray-900 dark:text-gray-100 animate-in fade-in-50">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Guardar Población</DialogTitle>
                        <DialogDescription className="text-gray-500 dark:text-gray-400">
                          Guarda la configuración actual para usarla en futuros experimentos.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="pop-name">Nombre de la Población</Label>
                          <Input
                            id="pop-name"
                            placeholder="ej. Jóvenes Tecnólogos"
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            className="bg-white/50 dark:bg-gray-900/50 border-purple-100 dark:border-gray-800 focus-visible:ring-purple-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="pop-desc">Descripción (opcional)</Label>
                          <Input
                            id="pop-desc"
                            placeholder="ej. Rango de edad 20-30, creativos..."
                            value={saveDesc}
                            onChange={(e) => setSaveDesc(e.target.value)}
                            className="bg-white/50 dark:bg-gray-900/50 border-purple-100 dark:border-gray-800 focus-visible:ring-purple-500"
                          />
                        </div>
                        <Button
                          onClick={handleSavePopulation}
                          className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 gap-1.5 mt-2"
                          disabled={savingPop || !saveName.trim()}
                        >
                          {savingPop ? "Guardando..." : "Guardar plantilla"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

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
                        <span className="relative z-10">Generando perfiles...</span>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, ease: "linear" }}
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
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
