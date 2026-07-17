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
  positivityBias?: [number, number];
  setPositivityBias?: (v: [number, number]) => void;
  verbosity?: [number, number];
  setVerbosity?: (v: [number, number]) => void;
  detailLevel?: [number, number];
  setDetailLevel?: (v: [number, number]) => void;
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
  positivityBias = [60, 80],
  setPositivityBias,
  verbosity = [40, 70],
  setVerbosity,
  detailLevel = [50, 80],
  setDetailLevel,
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

      // Check if there is a population configuration sent from the experiments page
      const pendingPop = sessionStorage.getItem("review_simulator_load_population");
      if (pendingPop) {
        try {
          const pop = JSON.parse(pendingPop);
          handleLoadUserPopulation(pop);
          sessionStorage.removeItem("review_simulator_load_population");
        } catch (e) {
          console.error("Error loading pending population from experiments page:", e);
        }
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

  const handleLoadUserPopulation = async (pop: any) => {
    setPopulationSize(pop.num_reviewers);
    if (pop.profile_parameters) {
      const params = pop.profile_parameters;
      if (params.demographics) setDemographics(params.demographics);
      if (params.personality) setPersonality(params.personality);
      if (params.population_prompt !== undefined) setPopulationPrompt(params.population_prompt);
      setUseCustomConfig(true);
      setConfigTab("custom");
    }
    // Cargar reseñadores guardados con la población (si existen)
    let profiles: BotProfile[] | null = null;
    if (Array.isArray(pop.reviewers) && pop.reviewers.length > 0) {
      profiles = pop.reviewers;
    } else if (pop.id) {
      try {
        const stored = await SavedPopulationService.getPopulationReviewers(pop.id);
        if (Array.isArray(stored) && stored.length > 0) profiles = stored;
      } catch {
        /* sin perfiles */
      }
    }
    if (profiles?.length) {
      try {
        const loaded = await BotService.loadReviewers(profiles);
        setBots(loaded?.profiles || profiles);
        setPopulationSize((loaded?.profiles || profiles).length);
      } catch {
        setBots(profiles);
        setPopulationSize(profiles.length);
      }
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
          population_prompt: populationPrompt,
          positivity_bias: positivityBias,
          verbosity,
          detail_level: detailLevel,
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
    <Card className="border-border bg-card/60 backdrop-blur-md overflow-hidden rounded-2xl shadow-lg shadow-black/[0.03]">
      <CardHeader className="border-b border-border/60 bg-muted/10 pb-5">
        <CardTitle className="flex items-center gap-2.5 text-lg font-bold">
          <Users className="h-5 w-5 text-primary" />
          Diseña tu población de mercado
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          Parametriza demografía, psicografía y estilo de reseña — o usa un prompt en lenguaje natural
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">

        {/*  Tab Bar  */}
        <div className="flex border-b border-border/60">
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
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                  active
                    ? "border-primary text-foreground bg-primary/[0.03]"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
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
                className="space-y-6"
              >
                {presets.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wand2 className="h-8 w-8 mx-auto mb-3 opacity-40 animate-pulse" />
                    <p className="text-xs">Cargando poblaciones predeterminadas</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Selecciona una población lista para usar. Los 10 perfiles se cargarán al instante y podrás pasar directamente a generar reseñas.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {presets.map((preset) => {
                        const isSelected = selectedPreset === preset.id;
                        const isLoading = loadingPreset === preset.id;
                        return (
                          <motion.div
                            key={preset.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={`relative rounded-2xl border p-5 cursor-pointer transition-all duration-300 glow-card-hover ${
                              isSelected
                                ? "border-primary bg-primary/[0.04] shadow-md shadow-primary/5"
                                : "border-border bg-background/50 hover:border-primary/20 hover:shadow-sm"
                            }`}
                            onClick={() => !isLoading && handleLoadPreset(preset.id)}
                          >
                            {isSelected && (
                              <div className="absolute top-3 right-3 bg-primary rounded-full p-0.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                              </div>
                            )}
                            <div className="text-3xl mb-3">{preset.icon}</div>
                            <p className="text-sm font-bold text-foreground leading-tight mb-1.5">{preset.name}</p>
                            <p className="text-[11px] text-muted-foreground leading-snug mb-3">{preset.description}</p>
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                              {preset.tag}
                            </span>
                            {isLoading && (
                              <div className="mt-3 flex items-center gap-1.5 text-xs text-primary">
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
                      <div className="mt-8 border-t border-border/60 pt-6 text-left">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                          Mis Poblaciones Personalizadas Guardadas
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {userSavedPopulations.map((pop) => (
                            <motion.div
                              key={pop.id}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              className="relative rounded-2xl border border-border bg-background/50 p-5 cursor-pointer hover:border-primary/20 hover:shadow-md transition-all flex flex-col justify-between glow-card-hover"
                              onClick={() => handleLoadUserPopulation(pop)}
                            >
                              <div className="absolute top-3 right-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                  onClick={(e) => handleDeleteUserPopulation(pop.id, e)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <div>
                                <div className="text-2xl mb-2">👤</div>
                                <p className="text-sm font-bold text-foreground leading-tight mb-1">{pop.name}</p>
                                <p className="text-[11px] text-muted-foreground leading-snug mb-3 line-clamp-2">{pop.description || "Sin descripción"}</p>
                              </div>
                              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary w-max">
                                {pop.num_reviewers} reseñadores
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {recentSessions.length > 0 && (
                      <div className="mt-8 border-t border-border/60 pt-6 text-left">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                          Poblaciones Usadas Recientemente
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {recentSessions.map((sess) => {
                            const isLoading = loadingRecentPop === sess.session_id;
                            return (
                              <motion.div
                                key={sess.session_id}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="relative rounded-2xl border border-border bg-background/50 p-5 cursor-pointer hover:border-primary/20 hover:shadow-md transition-all flex flex-col justify-between glow-card-hover"
                                onClick={() => !isLoading && handleLoadRecentPopulation(sess.session_id)}
                              >
                                {isLoading && (
                                  <div className="absolute inset-0 bg-background/80 rounded-2xl flex items-center justify-center z-10">
                                    <Zap className="h-4 w-4 animate-spin text-primary" />
                                  </div>
                                )}
                                <div>
                                  <div className="text-2xl mb-2">⏱️</div>
                                  <p className="text-[9px] font-bold text-primary uppercase tracking-wider">Simulación previa</p>
                                  <p className="text-sm font-bold text-foreground leading-tight mt-1 line-clamp-2">{sess.product_name}</p>
                                </div>
                                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 mt-3 rounded-full bg-primary/10 text-primary w-max">
                                  Reutilizar población
                                </span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-center text-muted-foreground pt-3">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-5 rounded-2xl border border-border">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tamaño de la población</h3>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-muted-foreground/60">1</span>
                      <span className="text-sm font-bold text-primary">{populationSize} bots</span>
                      <span className="text-xs text-muted-foreground/60">100</span>
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
                              rgb(99, 102, 241) ${((populationSize - 1) / 99) * 100}%, 
                              rgb(229, 231, 235) ${((populationSize - 1) / 99) * 100}%, 
                              rgb(229, 231, 235) 100%);
                          }
                          .dark .population-slider {
                            background: linear-gradient(to right, 
                              rgb(99, 102, 241) 0%, 
                              rgb(99, 102, 241) ${((populationSize - 1) / 99) * 100}%, 
                              rgb(39, 39, 42) ${((populationSize - 1) / 99) * 100}%, 
                              rgb(39, 39, 42) 100%);
                          }
                          .population-slider::-webkit-slider-thumb {
                            appearance: none;
                            height: 18px;
                            width: 18px;
                            border-radius: 50%;
                            background: white;
                            border: 2.5px solid rgb(99, 102, 241);
                            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
                            cursor: pointer;
                          }
                          .population-slider::-moz-range-thumb {
                            height: 16px;
                            width: 16px;
                            border-radius: 50%;
                            background: white;
                            border: 2.5px solid rgb(99, 102, 241);
                            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
                            cursor: pointer;
                          }
                          .dark .population-slider::-webkit-slider-thumb {
                            background: rgb(9, 9, 11);
                            border: 2.5px solid rgb(99, 102, 241);
                          }
                          .dark .population-slider::-moz-range-thumb {
                            background: rgb(9, 9, 11);
                            border: 2.5px solid rgb(99, 102, 241);
                          }
                        `
                      }} />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-xl border border-primary/10 w-full">
                      <input
                        type="checkbox"
                        id="adaptToProduct"
                        checked={adaptToProduct}
                        onChange={(e) => setAdaptToProduct(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                      />
                      <div className="flex-1 cursor-pointer" onClick={() => setAdaptToProduct(!adaptToProduct)}>
                        <label htmlFor="adaptToProduct" className="font-bold text-xs uppercase tracking-wider text-foreground cursor-pointer block">
                          Adaptar perfiles al producto
                        </label>
                        <span className="text-[11px] text-muted-foreground block mt-1 leading-snug">
                          Genera perfiles de usuarios que representen al cliente ideal (target) en base a la descripción, categoría y precio del producto.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prompt de población */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <Label htmlFor="populationPrompt" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      Describir la población con un Prompt (Recomendado)
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={`text-[10px] font-semibold h-7 rounded-lg px-2.5 border-border ${useCustomConfig ? 'text-primary bg-primary/10 border-primary/30' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setUseCustomConfig(!useCustomConfig)}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      {useCustomConfig ? "Ocultar sliders personalizados" : "Personalización avanzada (Sliders)"}
                    </Button>
                  </div>
                  <Textarea
                    id="populationPrompt"
                    value={populationPrompt}
                    onChange={(e) => setPopulationPrompt(e.target.value)}
                    placeholder="Ej: Estudiantes universitarios de entre 18 y 24 años de Madrid y Barcelona, apasionados por la música, que buscan productos duraderos pero de bajo presupuesto..."
                    rows={4}
                    className="bg-background/50 border-border focus-visible:ring-primary min-h-[100px] text-xs rounded-xl leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-foreground/80">
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
                      className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-border/60 overflow-hidden"
                    >
                      {/* Demografía */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <UserCircle2 className="h-4 w-4 text-primary" />
                          Datos Demográficos
                        </h3>
                        <div className="mb-4 bg-muted/15 p-4 rounded-xl border border-border/60">
                          <h4 className="text-xs font-bold mb-3">Edad</h4>
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
                        <div className="mb-4 bg-muted/15 p-4 rounded-xl border border-border/60">
                          <h4 className="text-xs font-bold mb-2">Nivel educativo</h4>
                          <div className="flex items-center space-x-4 flex-wrap gap-y-2">
                            {(["Low","Medium","High","Mixed"] as const).map((lvl) => (
                              <div key={lvl} className="flex items-center">
                                <input type="radio" id={`edu-${lvl}`} name="educationLevel"
                                  checked={demographics.education_level === lvl}
                                  onChange={() => setDemographics({...demographics, education_level: lvl})}
                                  className="mr-1.5 h-3.5 w-3.5 accent-primary" />
                                <label htmlFor={`edu-${lvl}`} className="text-xs text-foreground/80 font-medium">
                                  {lvl === "Low" ? "Bajo" : lvl === "Medium" ? "Medio" : lvl === "High" ? "Alto" : "Mixto"}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mb-4 bg-muted/15 p-4 rounded-xl border border-border/60">
                          <h4 className="text-xs font-bold mb-2">Género</h4>
                          <div className="flex items-center space-x-4">
                            {([["Male","Masculino"],["Female","Femenino"],["Male&Female","Mixto"]] as const).map(([val, label]) => (
                              <div key={val} className="flex items-center">
                                <input type="radio" id={`gender-${val}`} name="genderRatio"
                                  checked={demographics.gender_ratio === val}
                                  onChange={() => setDemographics({...demographics, gender_ratio: val})}
                                  className="mr-1.5 h-3.5 w-3.5 accent-primary" />
                                <label htmlFor={`gender-${val}`} className="text-xs text-foreground/80 font-medium">{label}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Personalidad */}
                      <div className="bg-muted/15 p-5 rounded-2xl border border-border/60">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
                          <Zap className="h-4 w-4 text-primary animate-pulse" />
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
                                <div className="flex justify-between mb-1 text-[10px] font-medium text-muted-foreground">
                                  <span>{minL}</span>
                                  <span>{maxL}</span>
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
                              ["price_sensitive_premium", "Sensible al precio", "Prefiere premium"],
                              ["brand_loyal_explorer", "Fiel a marcas", "Explorador"],
                              ["tech_novice_expert", "Novato tech", "Early adopter"],
                              ["skeptic_enthusiast", "Escéptico", "Entusiasta"],
                            ] as const).map(([key, minL, maxL]) => {
                              const range = personality[key] || [0, 100]
                              return (
                              <div key={key}>
                                <div className="flex justify-between mb-1 text-[10px] font-medium text-muted-foreground">
                                  <span>{minL}</span>
                                  <span>{maxL}</span>
                                </div>
                                <CustomRangeSlider
                                  label=""
                                  minValue={range[0]}
                                  maxValue={range[1]}
                                  absoluteMin={0}
                                  absoluteMax={100}
                                  onChange={(min, max) => setPersonality({ ...personality, [key]: [min, max] })}
                                />
                              </div>
                            )})}
                          </div>
                        </div>
                      </div>

                      {/* Estilo de reseña (afecta generación realista) */}
                      {setPositivityBias && setVerbosity && setDetailLevel && (
                        <div className="lg:col-span-2 bg-muted/15 p-5 rounded-2xl border border-border/60">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                            Estilo de reseña de la población
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <div className="flex justify-between mb-1 text-[10px] font-medium text-muted-foreground">
                                <span>Crítico</span>
                                <span>Positivo</span>
                              </div>
                              <CustomRangeSlider
                                label=""
                                minValue={positivityBias[0]}
                                maxValue={positivityBias[1]}
                                absoluteMin={0}
                                absoluteMax={100}
                                onChange={(min, max) => setPositivityBias([min, max])}
                              />
                            </div>
                            <div>
                              <div className="flex justify-between mb-1 text-[10px] font-medium text-muted-foreground">
                                <span>Pocas palabras</span>
                                <span>Hablador</span>
                              </div>
                              <CustomRangeSlider
                                label=""
                                minValue={verbosity[0]}
                                maxValue={verbosity[1]}
                                absoluteMin={0}
                                absoluteMax={100}
                                onChange={(min, max) => setVerbosity([min, max])}
                              />
                              <p className="text-[9px] text-muted-foreground/80 mt-1.5 leading-snug">
                                Verbosidad del reseñador: define si escribe reseñas telegráficas o se extiende.
                              </p>
                            </div>
                            <div>
                              <div className="flex justify-between mb-1 text-[10px] font-medium text-muted-foreground">
                                <span>Superficial</span>
                                <span>Muy detallado</span>
                              </div>
                              <CustomRangeSlider
                                label=""
                                minValue={detailLevel[0]}
                                maxValue={detailLevel[1]}
                                absoluteMin={0}
                                absoluteMax={100}
                                onChange={(min, max) => setDetailLevel([min, max])}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Comportamiento de reseña + renta */}
                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-muted/15 p-4 rounded-xl border border-border/60">
                          <h4 className="text-xs font-bold mb-2">Nivel de renta de la población</h4>
                          <div className="flex flex-wrap gap-3">
                            {(["Mixed", "low", "medium", "high", "very_high"] as const).map((lvl) => (
                              <label key={lvl} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                <input
                                  type="radio"
                                  name="incomeLevel"
                                  checked={(demographics.income_level || "Mixed") === lvl}
                                  onChange={() => setDemographics({ ...demographics, income_level: lvl })}
                                  className="h-3.5 w-3.5 accent-primary"
                                />
                                {lvl === "Mixed"
                                  ? "Mixta"
                                  : lvl === "low"
                                    ? "Baja"
                                    : lvl === "medium"
                                      ? "Media"
                                      : lvl === "high"
                                        ? "Alta"
                                        : "Muy alta"}
                              </label>
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2">
                            Influye en sensibilidad al precio y expectativas de calidad en las reseñas.
                          </p>
                        </div>
                        <div className="bg-muted/15 p-4 rounded-xl border border-border/60">
                          <h4 className="text-xs font-bold mb-2">Regiones (opcional)</h4>
                          <p className="text-[10px] text-muted-foreground mb-2">
                            Separadas por coma. Vacío = ciudades de España al azar.
                          </p>
                          <Input
                            placeholder="Madrid, Barcelona, Valencia"
                            value={(demographics.regions || []).join(", ")}
                            onChange={(e) =>
                              setDemographics({
                                ...demographics,
                                regions: e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                            className="bg-background border-border rounded-xl text-xs h-9"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bot generation progress */}
                {isGeneratingBots && (
                  <div className="mt-2 p-5 bg-primary/5 rounded-2xl border border-primary/10 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3.5">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-2">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}>
                          <Zap className="h-4 w-4 text-primary" />
                        </motion.div>
                        Generando perfiles ({bots.length} de {populationSize})
                      </h4>
                      <span className="text-xs font-bold text-primary">
                        {Math.round((bots.length / populationSize) * 100)}% completado
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 mb-5 overflow-hidden">
                      <motion.div
                        className="bg-primary h-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
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
                            className="p-3 bg-background/50 border border-border rounded-xl flex items-center space-x-3 shadow-sm"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary shrink-0">
                              {bot.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{bot.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{bot.location}  {bot.age} años  {bot.gender === 'Male' ? 'Hombre' : bot.gender === 'Female' ? 'Mujer' : 'Otro'}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-primary/70 italic text-center py-2">
                        Preparando primer perfil de reseñador...
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/*  Navigation  */}
          <div className="flex justify-between mt-8 border-t border-border/60 pt-5">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => setActiveStep(0)}
                variant="outline"
                className="border-border hover:bg-accent rounded-xl text-xs font-semibold px-4 h-10 transition-colors"
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
                        className="border-border hover:bg-accent rounded-xl text-xs font-semibold px-4 h-10 transition-colors"
                        disabled={isGeneratingBots}
                      >
                        Guardar población
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm bg-card border border-border text-foreground rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-base font-bold">Guardar Población</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                          Guarda la configuración actual para usarla en futuros experimentos.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="pop-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombre de la Población</Label>
                          <Input
                            id="pop-name"
                            placeholder="ej. Jóvenes Tecnólogos"
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            className="bg-background border-border focus-visible:ring-primary rounded-xl"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="pop-desc" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descripción (opcional)</Label>
                          <Input
                            id="pop-desc"
                            placeholder="ej. Rango de edad 20-30, creativos..."
                            value={saveDesc}
                            onChange={(e) => setSaveDesc(e.target.value)}
                            className="bg-background border-border focus-visible:ring-primary rounded-xl"
                          />
                        </div>
                        <Button
                          onClick={handleSavePopulation}
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/95 gap-1.5 mt-2 rounded-xl h-10 font-semibold"
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
                    className="bg-primary text-primary-foreground hover:bg-primary/95 transition-all font-semibold rounded-xl px-5 h-10 shadow-sm shadow-primary/10 relative overflow-hidden"
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
                          className="absolute inset-0 bg-indigo-600"
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
