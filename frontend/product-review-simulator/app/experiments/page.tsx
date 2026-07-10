"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { 
  ArrowLeft, 
  GitCompare, 
  Trash2, 
  Sparkles, 
  Star, 
  AlertCircle, 
  Clock, 
  Search, 
  Tag, 
  Coins, 
  BookOpen, 
  ThumbsUp, 
  ThumbsDown, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  X,
  Copy,
  Users,
  Plus,
  UserCircle2,
  Settings,
  Zap
} from "lucide-react"
import AnimatedBackground from "@/components/animated-background"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthModal } from "@/components/auth-modal"
import { RecentSession, DemographicConfig, PersonalityConfig } from "@/lib/types"
import { SimulatorService, CompareService, ProductService, SavedPopulationService, BotService, getSessionId } from "@/lib/api-services"
import { MarkdownReport } from "@/components/markdown-report"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CustomRangeSlider } from "@/components/custom-range-slider"

interface TreeNode extends RecentSession {
  children: TreeNode[];
}

const buildTrees = (flatSessions: RecentSession[]): TreeNode[] => {
  const map: { [id: string]: TreeNode } = {};
  flatSessions.forEach(s => {
    map[s.session_id] = { ...s, children: [] };
  });

  const roots: TreeNode[] = [];
  flatSessions.forEach(s => {
    const node = map[s.session_id];
    if (s.parent_session_id && map[s.parent_session_id]) {
      map[s.parent_session_id].children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortByDate = (a: TreeNode, b: TreeNode) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  roots.sort(sortByDate);
  const sortChildren = (node: TreeNode) => {
    node.children.sort(sortByDate);
    node.children.forEach(sortChildren);
  };
  roots.forEach(sortChildren);

  return roots;
};

const nodeMatchesOrHasDescendantMatch = (node: TreeNode, query: string): boolean => {
  if (!query) return true;
  const matchesSelf = node.product_name.toLowerCase().includes(query.toLowerCase());
  const matchesChild = node.children.some(child => nodeMatchesOrHasDescendantMatch(child, query));
  return matchesSelf || matchesChild;
};

const filterTrees = (trees: TreeNode[], query: string): TreeNode[] => {
  if (!query) return trees;
  return trees
    .filter(node => nodeMatchesOrHasDescendantMatch(node, query))
    .map(node => ({
      ...node,
      children: filterTrees(node.children, query)
    }));
};

const TreeNodeComponent = ({
  node,
  isSelected,
  onSelect,
  onDelete,
  onLoad,
  onDuplicate,
  isLastChild,
  searchQuery
}: {
  node: TreeNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onLoad: (id: string) => void;
  onDuplicate: (id: string, e: React.MouseEvent) => void;
  isLastChild: boolean;
  searchQuery: string;
}) => {
  const hasChildren = node.children.length > 0;
  const isMatch = searchQuery ? node.product_name.toLowerCase().includes(searchQuery.toLowerCase()) : false;

  return (
    <div className="flex flex-col relative pl-6 md:pl-8">
      {/* Linea conectora horizontal a este nodo */}
      <div className="absolute left-0 top-[28px] w-6 md:w-8 h-px bg-purple-200 dark:bg-gray-800" />
      
      {/* Linea conectora vertical (se dibuja si no es el ultimo hijo) */}
      {!isLastChild && (
        <div className="absolute left-0 top-[28px] w-px h-full bg-purple-200 dark:bg-gray-800" />
      )}

      {/* Tarjeta del nodo */}
      <div className="flex items-center gap-4 my-2 min-w-0">
        <div
          onClick={() => onSelect(node.session_id)}
          className={`flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/85 dark:bg-gray-950/85 backdrop-blur-sm border rounded-xl cursor-pointer hover:shadow-md transition-all duration-300 ${
            isSelected
              ? "border-purple-500 ring-2 ring-purple-500/10 shadow-purple-500/5 bg-purple-500/5 dark:bg-purple-950/10"
              : isMatch
              ? "border-yellow-400 dark:border-yellow-600 bg-yellow-500/[0.02]"
              : "border-purple-100 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-900"
          }`}
        >
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                node.parent_session_id 
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50" 
                  : "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/50"
              }`}>
                {node.parent_session_id ? "Mejora" : "Original (v1)"}
              </span>
              {node.average_rating && (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                  ★ {node.average_rating.toFixed(1)}
                </span>
              )}
            </div>

            <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mt-1.5 truncate">
              {node.product_name}
            </h4>

            <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(node.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              </span>
              {node.parent_product_name && (
                <span className="text-emerald-600 dark:text-emerald-400 truncate max-w-[150px]" title={`Hijo de: ${node.parent_product_name}`}>
                  ← {node.parent_product_name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 md:mt-0 self-end md:self-auto">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(node.session_id, e);
              }}
              size="icon"
              variant="outline"
              title="Duplicar Experimento"
              className="h-7 w-7 border-purple-200/50 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-900"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onLoad(node.session_id);
              }}
              size="sm"
              variant="outline"
              className="text-xs font-semibold px-2.5 py-1 h-7 border-purple-200/50 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-800"
            >
              Cargar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => onDelete(node.session_id, e)}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full h-7 w-7"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Renderizado de hijos recursivo */}
      {hasChildren && (
        <div className="relative flex flex-col">
          {/* Linea vertical para conectar con los hijos */}
          <div className="absolute left-0 top-0 bottom-[28px] w-px bg-purple-200 dark:bg-gray-800" />
          
          {node.children.map((child, index) => (
            <TreeNodeComponent
              key={child.session_id}
              node={child}
              isSelected={isSelected}
              onSelect={onSelect}
              onDelete={onDelete}
              onLoad={onLoad}
              onDuplicate={onDuplicate}
              isLastChild={index === node.children.length - 1}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TreeRoot = ({
  node,
  selectedSessions,
  handleSelectSession,
  handleDeleteSession,
  handleSelectRecentSession,
  handleDuplicateSession,
  searchQuery
}: {
  node: TreeNode;
  selectedSessions: string[];
  handleSelectSession: (id: string) => void;
  handleDeleteSession: (id: string, e: React.MouseEvent) => void;
  handleSelectRecentSession: (id: string) => void;
  handleDuplicateSession: (id: string, e: React.MouseEvent) => void;
  searchQuery: string;
}) => {
  const isSelected = selectedSessions.includes(node.session_id);
  const isMatch = searchQuery ? node.product_name.toLowerCase().includes(searchQuery.toLowerCase()) : false;

  return (
    <div className="mb-6 p-4 rounded-2xl border border-purple-100/50 dark:border-gray-800 bg-white/40 dark:bg-gray-950/40 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
      {/* Fila del nodo raiz */}
      <div className="flex items-center gap-4 min-w-0">
        <div
          onClick={() => handleSelectSession(node.session_id)}
          className={`flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/90 dark:bg-gray-950/90 border rounded-xl cursor-pointer hover:shadow-sm transition-all duration-300 ${
            isSelected
              ? "border-purple-500 ring-2 ring-purple-500/10 shadow-purple-500/5 bg-purple-500/5 dark:bg-purple-950/10"
              : isMatch
              ? "border-yellow-400 dark:border-yellow-600 bg-yellow-500/[0.02]"
              : "border-purple-100/70 dark:border-gray-800/80 hover:border-purple-300"
          }`}
        >
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Raiz (Original)
              </span>
              {node.average_rating && (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                  ★ {node.average_rating.toFixed(1)}
                </span>
              )}
            </div>
            <h3 className="font-bold text-base text-gray-800 dark:text-gray-200 mt-1.5 truncate">
              {node.product_name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Creado el {new Date(node.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 md:mt-0 self-end md:self-auto">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleDuplicateSession(node.session_id, e);
              }}
              size="icon"
              variant="outline"
              title="Duplicar Experimento"
              className="h-8 w-8 border-purple-200/50 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-900"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectRecentSession(node.session_id);
              }}
              size="sm"
              variant="outline"
              className="text-xs font-semibold px-3 py-1.5 h-8 border-purple-200/50 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-900"
            >
              Cargar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => handleDeleteSession(node.session_id, e)}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Contenedor de hijos */}
      {node.children.length > 0 && (
        <div className="relative mt-2 flex flex-col">
          {/* Linea vertical para conectar raiz con el primer nivel de hijos */}
          <div className="absolute left-[12px] top-0 bottom-[28px] w-px bg-purple-200 dark:bg-gray-800" />
          
          {node.children.map((child, index) => (
            <TreeNodeComponent
              key={child.session_id}
              node={child}
              isSelected={selectedSessions.includes(child.session_id)}
              onSelect={handleSelectSession}
              onDelete={handleDeleteSession}
              onLoad={handleSelectRecentSession}
              onDuplicate={handleDuplicateSession}
              isLastChild={index === node.children.length - 1}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PopulationCard = ({
  pop,
  onDelete,
  onUse,
  onViewReviewers
}: {
  pop: any;
  onDelete: (id: number, e: React.MouseEvent) => void;
  onUse: (pop: any) => void;
  onViewReviewers: (pop: any) => void;
}) => {
  const demographics = pop.profile_parameters?.demographics;
  const personality = pop.profile_parameters?.personality;
  const populationPrompt = pop.profile_parameters?.population_prompt;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="relative flex flex-col justify-between p-6 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border border-purple-100 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-900 rounded-2xl hover:shadow-lg transition-all duration-300"
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Población
            </span>
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/50 px-2 py-0.5 rounded-full">
              {pop.num_reviewers} Bots
            </span>
          </div>
          <h3 className="font-bold text-base text-gray-800 dark:text-gray-200 mt-2 truncate">
            {pop.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 min-h-[32px]">
            {pop.description || "Sin descripción"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => onDelete(pop.id, e)}
          className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full h-8 w-8 flex-shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Demographics / Parameters Summary */}
      {demographics && (
        <div className="mt-4 pt-4 border-t border-purple-50 dark:border-gray-800/80 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] font-medium bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
              Edad: {demographics.age_range?.[0]} - {demographics.age_range?.[1]} años
            </span>
            <span className="text-[10px] font-medium bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
              Educación: {
                demographics.education_level === "Mixed" ? "Mixta" :
                demographics.education_level === "Low" ? "Baja" :
                demographics.education_level === "Medium" ? "Media" : "Alta"
              }
            </span>
            <span className="text-[10px] font-medium bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
              Género: {
                demographics.gender_ratio === "Male&Female" ? "Mixto" :
                demographics.gender_ratio === "Male" ? "Hombres" : "Mujeres"
              }
            </span>
          </div>
        </div>
      )}

      {/* Prompt / Custom personality info */}
      {populationPrompt && (
        <div className="mt-3 bg-purple-500/5 dark:bg-purple-950/20 rounded-xl p-2.5 border border-purple-500/10">
          <span className="text-[9px] font-bold uppercase tracking-wider text-purple-500 block mb-1">
            Prompt de Población
          </span>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 italic line-clamp-2 leading-relaxed">
            "{populationPrompt}"
          </p>
        </div>
      )}

      {/* Footer / Action */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-purple-50 dark:border-gray-800 gap-2">
        <span className="text-[10px] text-gray-400">
          Creada el {new Date(pop.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onViewReviewers(pop);
            }}
            className="border-purple-200 dark:border-gray-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 text-xs font-semibold px-3 py-1.5 h-8 rounded-xl transition-colors"
          >
            Ver Reseñadores
          </Button>
          <Button
            onClick={() => onUse(pop)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white gap-1.5 text-xs font-semibold px-4 py-1.5 h-8 rounded-xl shadow-sm hover:shadow transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Usar en Simulador
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default function ExperimentsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string } | null>(null)
  const [sessions, setSessions] = useState<RecentSession[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "tree">("tree")

  // Custom states for saved populations
  const [activeTab, setActiveTab] = useState<"experiments" | "populations">("experiments")
  const [savedPopulations, setSavedPopulations] = useState<any[]>([])
  const [loadingPopulations, setLoadingPopulations] = useState(false)

  // States for creation modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createDescription, setCreateDescription] = useState("")
  const [createPopulationSize, setCreatePopulationSize] = useState<number>(10)
  const [createDemographics, setCreateDemographics] = useState<DemographicConfig>({
    age_range: [25, 45],
    education_level: "Mixed",
    gender_ratio: "Male&Female",
  })
  const [createPersonality, setCreatePersonality] = useState<PersonalityConfig>({
    introvert_extrovert: [0, 100],
    analytical_creative: [0, 100],
    busy_free_time: [0, 100],
    disorganized_organized: [0, 100],
    independent_cooperative: [0, 100],
    environmentalist: [0, 100],
    safe_risky: [0, 100],
  })
  const [createPopulationPrompt, setCreatePopulationPrompt] = useState<string>("")
  const [createUseCustomConfig, setCreateUseCustomConfig] = useState<boolean>(false)
  const [isSavingPop, setIsSavingPop] = useState(false)

  // Caching states and visibility for population reviewers viewer
  const [cachedPopReviewers, setCachedPopReviewers] = useState<{[popId: number]: any[]}>({})
  const [isReviewersModalOpen, setIsReviewersModalOpen] = useState(false)
  const [viewingPopName, setViewingPopName] = useState("")
  const [loadingBotsForPopId, setLoadingBotsForPopId] = useState<number | null>(null)
  const [activeReviewersList, setActiveReviewersList] = useState<any[]>([])
  
  // Real-time generation states & refs
  const [tempGeneratedBots, setTempGeneratedBots] = useState<any[]>([])
  const eventSourceRef = useRef<EventSource | null>(null);

  // SSE helper (connectSSE)
  const connectSSE = (
    onMessage: (message: { type: string; data: any }) => void,
    onError: () => void
  ): EventSource | null => {
    if (typeof window === 'undefined') return null;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sessionId = getSessionId();
    const API_URL_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const sseUrl = `${API_URL_BASE}/api/events/${sessionId}`;
    
    console.log(`[SSE] Conectando a canal de eventos de creación: ${sseUrl}`);
    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'ping' || message.type === 'connected') {
          return;
        }
        onMessage(message);
      } catch (err) {
        console.error('[SSE] Error al parsear mensaje:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('[SSE] Error o desconexión en canal de eventos de creación:', err);
      eventSource.close();
      if (eventSourceRef.current === eventSource) {
        eventSourceRef.current = null;
      }
      onError();
    };

    return eventSource;
  };
  
  // State for comparison
  const [isComparing, setIsComparing] = useState(false)
  const [comparisonResult, setComparisonResult] = useState<any | null>(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [comparisonError, setComparisonError] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("review_simulator_user")
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored))
        } catch (e) {}
      }
    }
  }, [])

  const fetchSessions = async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const data = await SimulatorService.getRecentSessions()
      setSessions(data || [])
    } catch (err) {
      console.error("Error fetching sessions:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPopulations = async () => {
    if (!currentUser) return
    setLoadingPopulations(true)
    try {
      const data = await SavedPopulationService.getSavedPopulations()
      setSavedPopulations(data || [])
    } catch (err) {
      console.error("Error fetching populations:", err)
    } finally {
      setLoadingPopulations(false)
    }
  }

  useEffect(() => {
    fetchSessions()
    fetchPopulations()
  }, [currentUser])

  const handleDeletePopulation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("¿Estás seguro de que deseas eliminar esta población guardada?")) return
    
    try {
      await SavedPopulationService.deletePopulation(id)
      setSavedPopulations(savedPopulations.filter(p => p.id !== id))
    } catch (err) {
      console.error("Error deleting population:", err)
      alert("Error al eliminar la población")
    }
  }

  const handleUsePopulation = (pop: any) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('review_simulator_load_population', JSON.stringify(pop))
      router.push('/simulator')
    }
  }

  const handleViewReviewers = async (pop: any) => {
    setViewingPopName(pop.name);
    setIsReviewersModalOpen(true);
    
    // Check cache first
    if (cachedPopReviewers[pop.id]) {
      setActiveReviewersList(cachedPopReviewers[pop.id]);
      return;
    }
    
    setLoadingBotsForPopId(pop.id);
    setActiveReviewersList([]);
    try {
      const formattedDemographics = {
        ...pop.profile_parameters.demographics,
        gender_ratio: pop.profile_parameters.demographics.gender_ratio,
        education_level: pop.profile_parameters.demographics.education_level
      };
      
      const response = await BotService.generateBots(
        pop.num_reviewers,
        [pop.num_reviewers, pop.num_reviewers],
        [0, 100],
        [0, 100],
        [0, 100],
        formattedDemographics,
        pop.profile_parameters.personality,
        false,
        undefined,
        pop.profile_parameters.population_prompt
      );
      
      if (response && response.profiles) {
        setCachedPopReviewers(prev => ({
          ...prev,
          [pop.id]: response.profiles
        }));
        setActiveReviewersList(response.profiles);
      }
    } catch (err) {
      console.error("Error generating preview bots:", err);
      alert("Error al generar los reseñadores");
      setIsReviewersModalOpen(false);
    } finally {
      setLoadingBotsForPopId(null);
    }
  };

  const handleCreatePopulation = async () => {
    if (!createName.trim()) return;
    setIsSavingPop(true);
    setTempGeneratedBots([]);
    
    let sseSource: EventSource | null = null;
    let isConnected = false;
    
    // Fallback polling for profile generation (same as simulator)
    let attemptCount = 0;
    const maxAttempts = 100;
    const pollingInterval = 3000;
    
    const checkBotProfilesFallback = async () => {
      if (attemptCount >= maxAttempts) {
        setIsSavingPop(false);
        alert("Tiempo de espera agotado al generar perfiles");
        return;
      }
      try {
        const statusInfo = await SimulatorService.getPhaseStatus('phase2');
        const profiles = await BotService.getReviewerProfiles();
        
        if (profiles && Array.isArray(profiles)) {
          if (profiles.length > 0) {
            setTempGeneratedBots(profiles);
          }
          if (statusInfo.status === 'completed' || profiles.length === createPopulationSize) {
            // Completed! Proceed to save the population
            await savePopulationData();
            return;
          } else if (statusInfo.status === 'failed') {
            setIsSavingPop(false);
            alert("Error al generar perfiles");
            return;
          } else {
            attemptCount++;
            setTimeout(checkBotProfilesFallback, pollingInterval);
          }
        }
      } catch (err) {
        console.error('[Fallback Polling] Error:', err);
        attemptCount++;
        setTimeout(checkBotProfilesFallback, pollingInterval);
      }
    };

    const startFallback = () => {
      if (isConnected) return;
      setTimeout(checkBotProfilesFallback, 1000);
    };

    const savePopulationData = async () => {
      try {
        const response = await SavedPopulationService.savePopulation(
          createName,
          createDescription,
          createPopulationSize,
          {
            demographics: createDemographics,
            personality: createPersonality,
            population_prompt: createPopulationPrompt
          }
        );
        if (response && response.id) {
          fetchPopulations();
          // Reset states
          setCreateName("");
          setCreateDescription("");
          setCreatePopulationSize(10);
          setCreateDemographics({
            age_range: [25, 45],
            education_level: "Mixed",
            gender_ratio: "Male&Female",
          });
          setCreatePersonality({
            introvert_extrovert: [0, 100],
            analytical_creative: [0, 100],
            busy_free_time: [0, 100],
            disorganized_organized: [0, 100],
            independent_cooperative: [0, 100],
            environmentalist: [0, 100],
            safe_risky: [0, 100],
          });
          setCreatePopulationPrompt("");
          setCreateUseCustomConfig(false);
          setIsCreateModalOpen(false);
        }
      } catch (err) {
        console.error("Error saving population:", err);
        alert("Error al guardar la población");
      } finally {
        setIsSavingPop(false);
      }
    };

    try {
      // Connect to SSE first
      sseSource = connectSSE(
        async (message) => {
          isConnected = true;
          if (message.type === 'profile_generated') {
            const newBot = message.data;
            setTempGeneratedBots((prev) => {
              const filtered = prev.filter((b) => b.id !== newBot.id);
              return [...filtered, newBot].sort((a, b) => a.id - b.id);
            });
          } else if (message.type === 'phase2_completed') {
            console.log('[SSE] Phase 2 completed');
            sseSource?.close();
            await savePopulationData();
          } else if (message.type === 'phase2_failed') {
            console.error('[SSE] Phase 2 failed:', message.data.error);
            setIsSavingPop(false);
            alert("Error al generar perfiles");
            sseSource?.close();
          }
        },
        () => {
          startFallback();
        }
      );

      // Launch phase 2 in background
      const formattedDemographics = {
        ...createDemographics,
        gender_ratio: createDemographics.gender_ratio,
        education_level: createDemographics.education_level
      };

      await BotService.generateBots(
        createPopulationSize,
        [createPopulationSize, createPopulationSize],
        [0, 100],
        [0, 100],
        [0, 100],
        formattedDemographics,
        createPersonality,
        false,
        undefined,
        createPopulationPrompt
      );
    } catch (err) {
      console.error("Error initiating bot generation:", err);
      setIsSavingPop(false);
      sseSource?.close();
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("¿Estás seguro de que deseas eliminar este experimento?")) return
    
    try {
      await fetch(`/api/clean-outputs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": sessionId
        }
      })
      // Remover de la lista local
      setSessions(sessions.filter(s => s.session_id !== sessionId))
      setSelectedSessions(selectedSessions.filter(id => id !== sessionId))
    } catch (err) {
      console.error("Error deleting session:", err)
    }
  }

  const handleDuplicateSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await ProductService.duplicateProduct(sessionId)
      if (res && res.session_id) {
        fetchSessions()
      }
    } catch (err) {
      console.error("Error duplicating session:", err)
      alert("Error al duplicar el experimento")
    }
  }

  const handleSelectSession = (sessionId: string) => {
    if (selectedSessions.includes(sessionId)) {
      setSelectedSessions(selectedSessions.filter(id => id !== sessionId))
    } else {
      if (selectedSessions.length >= 2) {
        // Reemplazar la segunda selección
        setSelectedSessions([selectedSessions[0], sessionId])
      } else {
        setSelectedSessions([...selectedSessions, sessionId])
      }
    }
  }

  const handleSelectRecentSession = (sessionId: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('review_simulator_session_id', sessionId);
      router.push('/simulator');
    }
  }

  const handleCompare = async () => {
    if (selectedSessions.length !== 2) return
    
    setComparisonLoading(true)
    setComparisonError("")
    setIsComparing(true)
    
    try {
      // Paso 1: iniciar la comparación en background y obtener job_id
      const { job_id } = await CompareService.startComparison(selectedSessions[0], selectedSessions[1])
      
      // Paso 2: sondeo hasta que el resultado esté listo (máx. 3 min)
      let attempts = 0
      const maxAttempts = 72 // 72 × 2.5s = 3 min
      
      const poll = async (): Promise<void> => {
        if (attempts >= maxAttempts) {
          setComparisonError("La comparación tardó demasiado. Inténtalo de nuevo.")
          setComparisonLoading(false)
          return
        }
        attempts++
        try {
          const result = await CompareService.getComparisonResult(job_id)
          if (result.status === "pending") {
            // Sigue esperando
            setTimeout(poll, 2500)
          } else if (result.status === "error") {
            setComparisonError(result.error || "Error al generar la comparación")
            setComparisonLoading(false)
          } else {
            setComparisonResult(result)
            setComparisonLoading(false)
          }
        } catch (pollErr: any) {
          // 404 puede ser transitorio; seguir sondeando
          if (pollErr.status === 404) {
            setTimeout(poll, 2500)
          } else {
            setComparisonError(pollErr.message || "Error al obtener el resultado de la comparación")
            setComparisonLoading(false)
          }
        }
      }
      
      setTimeout(poll, 2500) // Esperar un poco antes del primer sondeo
      
    } catch (err: any) {
      console.error("Error starting comparison:", err)
      setComparisonError(err.message || "Error al iniciar la comparación")
      setComparisonLoading(false)
    }
  }

  const filteredSessions = sessions.filter(s => 
    s.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-screen">
      <AnimatedBackground />

      <header className="px-4 lg:px-6 h-16 flex items-center backdrop-blur-md bg-white/70 dark:bg-gray-950/70 border-b border-purple-100 dark:border-gray-800 sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="/">
          <div className="mr-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg p-1.5">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            ReviewSim 2025
          </span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link
            className="text-sm font-semibold hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            href="/"
          >
            Inicio
          </Link>
          <ThemeToggle />
          <AuthModal onStateChange={() => {
            const stored = localStorage.getItem("review_simulator_user")
            if (stored) {
              setCurrentUser(JSON.parse(stored))
            } else {
              setCurrentUser(null)
              setSessions([])
            }
          }} />
        </nav>
      </header>

      <main className="flex-1 relative z-10 container mx-auto py-8 px-4">
        {!currentUser ? (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
            <div className="mb-4 bg-purple-100 dark:bg-purple-950/50 p-4 rounded-full border border-purple-200 dark:border-purple-900/50">
              <AlertCircle className="h-10 w-10 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Inicia sesión requerida</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Debes iniciar sesión con tu cuenta para visualizar tus experimentos, guardar poblaciones y comparar productos.
            </p>
            <AuthModal onStateChange={() => window.location.reload()} />
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Link href="/">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-purple-200 dark:border-gray-700 hover:bg-purple-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                  Mis Experimentos
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Administra, visualiza e innova tus productos simulados
                </p>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-purple-100 dark:border-gray-800 mb-8 mt-6">
              {[
                { id: "experiments", label: "Mis Simulaciones", icon: <TrendingUp className="h-4 w-4" /> },
                { id: "populations", label: "Poblaciones Guardadas", icon: <Users className="h-4 w-4" /> },
              ].map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as "experiments" | "populations")}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                      active
                        ? "border-purple-500 text-purple-700 dark:text-purple-300 bg-purple-50/20 dark:bg-purple-950/10 font-bold"
                        : "border-transparent text-gray-500 hover:text-purple-600 dark:hover:text-purple-300"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "experiments" && (
              <>
                {/* Compare Bar Action */}
                {selectedSessions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl border border-purple-200/50 dark:border-purple-900 bg-purple-500/5 dark:bg-purple-950/20 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                        Comparación Side-by-Side ({selectedSessions.length}/2)
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedSessions.length === 1 
                          ? "Selecciona otra simulación para iniciar la comparación de productos con IA"
                          : "Tienes 2 productos seleccionados para comparar sus feedback con IA"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setSelectedSessions([])}
                        variant="ghost"
                        size="sm"
                        className="text-xs hover:bg-purple-500/10"
                      >
                        Limpiar selección
                      </Button>
                      <Button
                        onClick={handleCompare}
                        disabled={selectedSessions.length !== 2}
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 gap-1.5 text-xs font-semibold"
                        size="sm"
                      >
                        <GitCompare className="h-3.5 w-3.5" />
                        Comparar Productos con IA
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-6">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre de producto..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-white/70 dark:bg-gray-950/70 border border-purple-100 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-purple-500/5 border border-purple-200/30 dark:border-purple-900/30 p-1 rounded-xl shrink-0">
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="text-xs font-semibold px-3 py-1.5 h-auto rounded-lg"
                    >
                      Vista Cuadrícula
                    </Button>
                    <Button
                      variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('tree')}
                      className="text-xs font-semibold px-3 py-1.5 h-auto rounded-lg gap-1.5"
                    >
                      <TrendingUp className="h-3.5 w-3.5 rotate-90" />
                      Vista Árbol (Linaje)
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-white/40 dark:bg-gray-950/40 rounded-xl border border-purple-100 dark:border-gray-800">
                    <HelpCircle className="h-10 w-10 text-purple-400 mb-2" />
                    <h3 className="font-bold text-lg">No se encontraron experimentos</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mt-1">
                      Aún no has creado simulaciones para esta cuenta o no coinciden con la búsqueda.
                    </p>
                    <Link href="/simulator" className="mt-4">
                      <Button className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white" size="sm">
                        Crear Nueva Simulación
                      </Button>
                    </Link>
                  </div>
                ) : viewMode === "tree" ? (
                  <div className="space-y-4">
                    {filterTrees(buildTrees(sessions), searchQuery).map((tree) => (
                      <TreeRoot
                        key={tree.session_id}
                        node={tree}
                        selectedSessions={selectedSessions}
                        handleSelectSession={handleSelectSession}
                        handleDeleteSession={handleDeleteSession}
                        handleSelectRecentSession={handleSelectRecentSession}
                        handleDuplicateSession={handleDuplicateSession}
                        searchQuery={searchQuery}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSessions.map((session) => {
                      const isSelected = selectedSessions.includes(session.session_id)
                      return (
                        <motion.div
                          key={session.session_id}
                          whileHover={{ y: -3 }}
                          className={`relative flex flex-col justify-between p-5 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border rounded-2xl cursor-pointer hover:shadow-lg transition-all duration-300 ${
                            isSelected 
                              ? "border-purple-500 ring-2 ring-purple-500/10 shadow-purple-500/5 bg-purple-500/5 dark:bg-purple-950/10" 
                              : "border-purple-100 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-900"
                          }`}
                          onClick={() => handleSelectSession(session.session_id)}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Simulación
                              </span>
                              <h3 className="font-bold text-base text-gray-800 dark:text-gray-200 mt-2 line-clamp-2">
                                {session.product_name}
                              </h3>
                              {session.parent_session_id && (
                                <div className="mt-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded max-w-full truncate" title={`Versión mejorada de: ${session.parent_product_name || "Producto original"}`}>
                                  Versión mejorada de: {session.parent_product_name || "Producto original"}
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1.5">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {new Date(session.created_at).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateSession(session.session_id, e);
                                }}
                                className="text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-full h-8 w-8 flex-shrink-0"
                                title="Duplicar Experimento"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleDeleteSession(session.session_id, e)}
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full h-8 w-8 flex-shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-6 pt-4 border-t border-purple-50 dark:border-gray-800">
                            {session.average_rating ? (
                              <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg">
                                <span className="text-amber-500 font-bold text-xs">★</span>
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                                  {session.average_rating.toFixed(1)} / 5
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2.5 py-0.5 rounded-full">
                                Incompleto
                              </span>
                            )}
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectRecentSession(session.session_id)
                              }}
                              variant="link"
                              className="p-0 h-auto text-xs text-purple-600 dark:text-purple-400 font-semibold"
                            >
                              Cargar
                            </Button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === "populations" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                    Mis Poblaciones Guardadas
                  </h2>
                  <Button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white gap-2 font-semibold px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Crear Población
                  </Button>
                </div>

                {loadingPopulations ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                  </div>
                ) : savedPopulations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-white/40 dark:bg-gray-950/40 rounded-xl border border-purple-100 dark:border-gray-800">
                    <Users className="h-10 w-10 text-purple-400 mb-2" />
                    <h3 className="font-bold text-lg">No tienes poblaciones guardadas</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mt-1">
                      Puedes guardar configuraciones de población personalizadas desde el simulador de reseñas para reutilizarlas en el futuro.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                    {savedPopulations.map((pop) => (
                      <PopulationCard
                        key={pop.id}
                        pop={pop}
                        onDelete={handleDeletePopulation}
                        onUse={handleUsePopulation}
                        onViewReviewers={handleViewReviewers}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Comparison Drawer / Full Overlay modal */}
      <AnimatePresence>
        {isComparing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto p-4 md:p-6 flex items-start justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-950 border dark:border-gray-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative my-8 text-gray-900 dark:text-gray-100"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsComparing(false)
                  setComparisonResult(null)
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>

              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center gap-2 pr-10">
                <GitCompare className="h-6 w-6 text-purple-500" />
                Comparación de Productos con IA
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                Informe comparativo estratégico basado en el análisis de clientes
              </p>

              {comparisonLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    El consultor IA está evaluando las opiniones y métricas de ambos productos...
                  </p>
                </div>
              ) : comparisonError ? (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-red-800 dark:text-red-400 text-sm">Error al comparar</h3>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{comparisonError}</p>
                  </div>
                </div>
              ) : (
                comparisonResult && (
                  <div className="space-y-6">
                    {/* ── Tabla comparativa ── */}
                    <div className="overflow-hidden rounded-2xl border border-purple-100 dark:border-gray-800">
                      {/* Cabecera */}
                      <div className="grid grid-cols-[1fr_1fr_1fr] text-center">
                        <div className="bg-gray-50 dark:bg-gray-900 p-3 border-b border-r border-purple-100 dark:border-gray-800" />
                        <div className="bg-blue-500/10 dark:bg-blue-950/30 p-3 border-b border-r border-purple-100 dark:border-gray-800">
                          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-0.5">Producto A</span>
                          <span className="font-bold text-sm text-gray-800 dark:text-gray-100 leading-tight line-clamp-2">{comparisonResult.product1.name}</span>
                        </div>
                        <div className="bg-purple-500/10 dark:bg-purple-950/30 p-3 border-b border-purple-100 dark:border-gray-800">
                          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest block mb-0.5">Producto B</span>
                          <span className="font-bold text-sm text-gray-800 dark:text-gray-100 leading-tight line-clamp-2">{comparisonResult.product2.name}</span>
                        </div>
                      </div>

                      {/* Fila: Precio */}
                      <div className="grid grid-cols-[1fr_1fr_1fr] text-sm border-b border-purple-100 dark:border-gray-800">
                        <div className="p-3 bg-gray-50/60 dark:bg-gray-900/40 border-r border-purple-100 dark:border-gray-800 flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                          <Coins className="h-3.5 w-3.5 flex-shrink-0" /> Precio
                        </div>
                        <div className="p-3 border-r border-purple-100 dark:border-gray-800 text-center text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {comparisonResult.product1.price || "—"}
                        </div>
                        <div className="p-3 text-center text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {comparisonResult.product2.price || "—"}
                        </div>
                      </div>

                      {/* Fila: Categoría */}
                      <div className="grid grid-cols-[1fr_1fr_1fr] text-sm border-b border-purple-100 dark:border-gray-800">
                        <div className="p-3 bg-gray-50/60 dark:bg-gray-900/40 border-r border-purple-100 dark:border-gray-800 flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                          <Tag className="h-3.5 w-3.5 flex-shrink-0" /> Categoría
                        </div>
                        <div className="p-3 border-r border-purple-100 dark:border-gray-800 text-center text-xs text-gray-700 dark:text-gray-300">
                          {comparisonResult.product1.category || "—"}
                        </div>
                        <div className="p-3 text-center text-xs text-gray-700 dark:text-gray-300">
                          {comparisonResult.product2.category || "—"}
                        </div>
                      </div>

                      {/* Fila: Valoración */}
                      <div className="grid grid-cols-[1fr_1fr_1fr] text-sm border-b border-purple-100 dark:border-gray-800">
                        <div className="p-3 bg-gray-50/60 dark:bg-gray-900/40 border-r border-purple-100 dark:border-gray-800 flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                          <Star className="h-3.5 w-3.5 flex-shrink-0" /> Valoración
                        </div>
                        <div className="p-3 border-r border-purple-100 dark:border-gray-800 flex items-center justify-center gap-1">
                          <span className="text-amber-500 font-bold text-sm">★</span>
                          <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                            {comparisonResult.product1.average_rating ? comparisonResult.product1.average_rating.toFixed(1) : "N/A"}
                          </span>
                          <span className="text-xs text-gray-400">/5</span>
                        </div>
                        <div className="p-3 flex items-center justify-center gap-1">
                          <span className="text-amber-500 font-bold text-sm">★</span>
                          <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                            {comparisonResult.product2.average_rating ? comparisonResult.product2.average_rating.toFixed(1) : "N/A"}
                          </span>
                          <span className="text-xs text-gray-400">/5</span>
                        </div>
                      </div>

                      {/* Fila: Fortalezas */}
                      <div className="grid grid-cols-[1fr_1fr_1fr] text-sm border-b border-purple-100 dark:border-gray-800">
                        <div className="p-3 bg-gray-50/60 dark:bg-gray-900/40 border-r border-purple-100 dark:border-gray-800 flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                          <ThumbsUp className="h-3.5 w-3.5 flex-shrink-0 text-green-500" /> Fortalezas
                        </div>
                        <div className="p-3 border-r border-purple-100 dark:border-gray-800 bg-green-500/[0.02]">
                          <ul className="space-y-1.5">
                            {(comparisonResult.product1.positive_points || []).slice(0, 4).map((pt: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-3 bg-green-500/[0.02]">
                          <ul className="space-y-1.5">
                            {(comparisonResult.product2.positive_points || []).slice(0, 4).map((pt: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Fila: Quejas */}
                      <div className="grid grid-cols-[1fr_1fr_1fr] text-sm">
                        <div className="p-3 bg-gray-50/60 dark:bg-gray-900/40 border-r border-purple-100 dark:border-gray-800 flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                          <ThumbsDown className="h-3.5 w-3.5 flex-shrink-0 text-red-500" /> Quejas
                        </div>
                        <div className="p-3 border-r border-purple-100 dark:border-gray-800 bg-red-500/[0.02]">
                          <ul className="space-y-1.5">
                            {(comparisonResult.product1.negative_points || []).slice(0, 4).map((pt: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                                <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-3 bg-red-500/[0.02]">
                          <ul className="space-y-1.5">
                            {(comparisonResult.product2.negative_points || []).slice(0, 4).map((pt: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                                <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* AI Comparative Report */}
                    <div className="border-t border-purple-100 dark:border-gray-800 pt-5">
                      <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <BookOpen className="h-4 w-4 text-purple-500" />
                        Informe Estratégico de IA
                      </h3>
                      <div className="bg-gradient-to-br from-purple-500/[0.02] to-indigo-500/[0.02] dark:from-purple-950/10 dark:to-indigo-950/10 p-5 rounded-2xl border border-purple-100/60 dark:border-gray-800 max-h-[40vh] overflow-y-auto">
                        <MarkdownReport text={comparisonResult.comparison_report} />
                      </div>
                    </div>
                  </div>
                )
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Population Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto p-4 md:p-6 flex items-start justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-950 border dark:border-gray-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl relative my-8 text-gray-900 dark:text-gray-100 font-sans"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>

              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center gap-2 pr-10 text-left">
                <Users className="h-6 w-6 text-purple-500" />
                Crear Nueva Población
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 text-left">
                Configura los datos demográficos y rasgos de personalidad para esta población de bots.
              </p>

              {isSavingPop ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="relative mb-6">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500" />
                    <Zap className="h-6 w-6 text-purple-500 absolute top-5 left-5 animate-pulse" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Creando Población de Bots</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mb-6 text-center">
                    Conectando con el generador de perfiles para crear a los {createPopulationSize} bots con IA...
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full max-w-md bg-purple-100 dark:bg-gray-800 rounded-full h-2.5 mb-6 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(tempGeneratedBots.length / createPopulationSize) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-6">
                    Generados: {tempGeneratedBots.length} de {createPopulationSize} bots ({Math.round((tempGeneratedBots.length / createPopulationSize) * 100)}%)
                  </span>

                  {/* List of generated bots */}
                  {tempGeneratedBots.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl max-h-48 overflow-y-auto pr-2 pb-2">
                      {tempGeneratedBots.map((bot, index) => (
                        <motion.div
                          key={bot.id || index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/50 dark:border-purple-900/20 rounded-xl flex items-center space-x-3 shadow-sm text-left"
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
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                    {/* Form Fields: Name and Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 text-left">
                        <Label htmlFor="create-name" className="text-sm font-bold text-gray-700 dark:text-gray-300">Nombre de la Población</Label>
                        <Input
                          id="create-name"
                          value={createName}
                          onChange={(e) => setCreateName(e.target.value)}
                          placeholder="Ej: Jóvenes Tecnófilos"
                          className="bg-white/70 dark:bg-gray-800/70 border-purple-100 dark:border-gray-800 focus-visible:ring-purple-500 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2 text-left">
                        <Label htmlFor="create-description" className="text-sm font-bold text-gray-700 dark:text-gray-300">Descripción</Label>
                        <Input
                          id="create-description"
                          value={createDescription}
                          onChange={(e) => setCreateDescription(e.target.value)}
                          placeholder="Ej: Estudiantes interesados en tecnología..."
                          className="bg-white/70 dark:bg-gray-800/70 border-purple-100 dark:border-gray-800 focus-visible:ring-purple-500 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Size */}
                    <div className="bg-purple-50/30 dark:bg-gray-900/30 p-5 rounded-xl border border-purple-100/50 dark:border-gray-800/50 text-left">
                      <Label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Tamaño de la población</Label>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500">1</span>
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{createPopulationSize} bots</span>
                        <span className="text-xs text-gray-500">100</span>
                      </div>
                      <div className="relative py-2">
                        <input
                          type="range"
                          min={1}
                          max={100}
                          value={createPopulationSize}
                          onChange={(e) => setCreatePopulationSize(parseInt(e.target.value))}
                          className="w-full h-1.5 rounded-full appearance-none cursor-pointer create-population-slider"
                        />
                        <style dangerouslySetInnerHTML={{
                          __html: `
                            .create-population-slider {
                              background: linear-gradient(to right, 
                                rgb(99, 102, 241) 0%, 
                                rgb(139, 92, 246) ${((createPopulationSize - 1) / 99) * 50}%, 
                                rgb(236, 72, 153) ${((createPopulationSize - 1) / 99) * 100}%, 
                                rgb(229, 231, 235) ${((createPopulationSize - 1) / 99) * 100}%, 
                                rgb(229, 231, 235) 100%);
                            }
                            .dark .create-population-slider {
                              background: linear-gradient(to right, 
                                rgb(99, 102, 241) 0%, 
                                rgb(139, 92, 246) ${((createPopulationSize - 1) / 99) * 50}%, 
                                rgb(236, 72, 153) ${((createPopulationSize - 1) / 99) * 100}%, 
                                rgb(55, 65, 81) ${((createPopulationSize - 1) / 99) * 100}%, 
                                rgb(55, 65, 81) 100%);
                            }
                            .create-population-slider::-webkit-slider-thumb {
                              appearance: none;
                              height: 20px;
                              width: 20px;
                              border-radius: 50%;
                              background: white;
                              border: 2px solid rgb(236, 72, 153);
                              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                              cursor: pointer;
                            }
                            .create-population-slider::-moz-range-thumb {
                              height: 18px;
                              width: 18px;
                              border-radius: 50%;
                              background: white;
                              border: 2px solid rgb(236, 72, 153);
                              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                              cursor: pointer;
                            }
                            .dark .create-population-slider::-webkit-slider-thumb {
                              background: rgb(3, 7, 18);
                              border: 2px solid rgb(236, 72, 153);
                            }
                            .dark .create-population-slider::-moz-range-thumb {
                              background: rgb(3, 7, 18);
                              border: 2px solid rgb(236, 72, 153);
                            }
                          `
                        }} />
                      </div>
                    </div>

                    {/* Prompt */}
                    <div className="space-y-3 text-left">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <Label htmlFor="create-prompt" className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
                          Describir la población con un Prompt (Recomendado)
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={`text-xs font-semibold h-8 border-purple-200/50 rounded-xl ${createUseCustomConfig ? 'text-purple-700 bg-purple-100/50 dark:text-purple-400 dark:bg-purple-900/30 border-purple-300' : 'text-gray-500 hover:text-purple-600 dark:border-gray-800'}`}
                          onClick={() => setCreateUseCustomConfig(!createUseCustomConfig)}
                        >
                          <Settings className="h-3.5 w-3.5 mr-1" />
                          {createUseCustomConfig ? "Ocultar sliders personalizados" : "Personalización avanzada (Sliders)"}
                        </Button>
                      </div>
                      <Textarea
                        id="create-prompt"
                        value={createPopulationPrompt}
                        onChange={(e) => setCreatePopulationPrompt(e.target.value)}
                        placeholder="Ej: Estudiantes universitarios de entre 18 y 24 años de Madrid y Barcelona, apasionados por la música, que buscan productos duraderos..."
                        rows={3}
                        className="bg-white/70 dark:bg-gray-800/70 border-purple-200 dark:border-gray-700 focus-visible:ring-purple-500 min-h-[80px] text-sm rounded-xl"
                      />
                    </div>

                    {/* Advanced Sliders */}
                    <AnimatePresence>
                      {createUseCustomConfig && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-purple-100 dark:border-gray-800 overflow-hidden text-left"
                        >
                          {/* Demography */}
                          <div>
                            <h3 className="text-base font-bold mb-4 text-purple-900 dark:text-purple-300 flex items-center gap-2">
                              <Users className="h-5 w-5 text-purple-500" />
                              Datos Demográficos
                            </h3>
                            <div className="mb-6">
                              <h4 className="text-sm font-semibold mb-2">Edad</h4>
                              <CustomRangeSlider
                                label=""
                                minLabel="min"
                                maxLabel="max"
                                minValue={createDemographics.age_range[0]}
                                maxValue={createDemographics.age_range[1]}
                                absoluteMin={12}
                                absoluteMax={80}
                                onChange={(min, max) => setCreateDemographics({ ...createDemographics, age_range: [min, max] })}
                              />
                            </div>
                            <div className="mb-6">
                              <h4 className="text-sm font-semibold mb-2">Nivel educativo</h4>
                              <div className="flex items-center space-x-4 flex-wrap gap-y-2">
                                {(["Low","Medium","High","Mixed"] as const).map((lvl) => (
                                  <div key={lvl} className="flex items-center">
                                    <input type="radio" id={`create-edu-${lvl}`} name="createEducationLevel"
                                      checked={createDemographics.education_level === lvl}
                                      onChange={() => setCreateDemographics({...createDemographics, education_level: lvl})}
                                      className="mr-2 h-4 w-4 accent-purple-500" />
                                    <label htmlFor={`create-edu-${lvl}`} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
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
                                    <input type="radio" id={`create-gender-${val}`} name="createGenderRatio"
                                      checked={createDemographics.gender_ratio === val}
                                      onChange={() => setCreateDemographics({...createDemographics, gender_ratio: val})}
                                      className="mr-2 h-4 w-4 accent-purple-500" />
                                    <label htmlFor={`create-gender-${val}`} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">{label}</label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Personality */}
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
                                      minValue={createPersonality[key][0]}
                                      maxValue={createPersonality[key][1]}
                                      absoluteMin={0}
                                      absoluteMax={100}
                                      onChange={(min, max) => setCreatePersonality({ ...createPersonality, [key]: [min, max] })}
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
                                      minValue={createPersonality[key][0]}
                                      maxValue={createPersonality[key][1]}
                                      absoluteMin={0}
                                      absoluteMax={100}
                                      onChange={(min, max) => setCreatePersonality({ ...createPersonality, [key]: [min, max] })}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-purple-100 dark:border-gray-800">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="rounded-xl border-purple-200/50 hover:bg-purple-50 dark:border-gray-800"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreatePopulation}
                      disabled={isSavingPop || !createName.trim()}
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl font-bold px-6 shadow-md hover:shadow-lg transition-all"
                    >
                      {isSavingPop ? "Guardando..." : "Guardar Población"}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Reviewers Modal */}
      <AnimatePresence>
        {isReviewersModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto p-4 md:p-6 flex items-start justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-950 border dark:border-gray-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative my-8 text-gray-900 dark:text-gray-100 font-sans"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsReviewersModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>

              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center gap-2 pr-10 text-left">
                <UserCircle2 className="h-6 w-6 text-purple-500" />
                Reseñadores: {viewingPopName}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 text-left">
                Perfiles de reseñadores simulados creados con Inteligencia Artificial.
              </p>

              {loadingBotsForPopId !== null ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="relative mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
                    <Zap className="h-5 w-5 text-purple-500 absolute top-3.5 left-3.5 animate-pulse" />
                  </div>
                  <h3 className="font-bold text-base text-gray-800 dark:text-gray-200">Generando perfiles en tiempo real con IA</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                    El agente de creación de usuarios está modelando personalidades, nombres e historias de fondo. Esto puede tomar unos segundos...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2 pb-2">
                  {activeReviewersList.map((bot, index) => (
                    <motion.div
                      key={bot.id || index}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white/95 dark:bg-gray-900/60 border border-purple-100 dark:border-gray-850 hover:shadow-md transition-shadow rounded-2xl p-5 flex flex-col justify-between h-full text-left"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-full overflow-hidden border border-purple-250/30 dark:border-gray-700 bg-purple-50/50 dark:bg-purple-950/20 shrink-0 flex items-center justify-center">
                            <img 
                              src={`https://api.dicebear.com/10.x/croodles-neutral/svg?mouthVariant=variant01,variant02,variant03,variant04,variant05,variant06,variant07,variant09,variant10,variant11,variant12,variant13,variant14,variant15,variant16,variant17,variant18&seed=${encodeURIComponent(bot.name)}`} 
                              alt={bot.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-805 dark:text-gray-150 text-sm leading-snug">{bot.name}</h3>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                              {bot.age} años • {bot.gender === "Male" ? "Hombre" : bot.gender === "Female" ? "Mujer" : "Mixto"} • {bot.location}
                            </p>
                          </div>
                        </div>

                        <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-2 bg-indigo-50/50 dark:bg-indigo-950/20 px-2 py-0.5 rounded w-max">
                          Educación: {
                            bot.education_level === "High" ? "Alta" :
                            bot.education_level === "Medium" ? "Media" :
                            bot.education_level === "Low" ? "Baja" : "Mixta"
                          }
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed italic line-clamp-3">
                          "{bot.bio}"
                        </p>

                        {bot.backstory && (
                          <div className="mt-2 pt-2 border-t border-purple-50/50 dark:border-gray-800/50">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 block mb-0.5">Historia de fondo</span>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                              {bot.backstory}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Personality traits mini-sliders */}
                      <div className="mt-4 pt-3 border-t border-purple-50 dark:border-gray-800/80 space-y-2">
                        <h4 className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          Rasgos de personalidad
                        </h4>
                        <div className="space-y-1.5 text-[9px] text-gray-600 dark:text-gray-400">
                          {[
                            ["Introvertido/Extrovertido", bot.personality?.introvert_extrovert],
                            ["Analítico/Creativo", bot.personality?.analytical_creative],
                            ["Prudente/Arriesgado", bot.personality?.safe_risky],
                          ].map(([label, val]) => (
                            <div key={label} className="space-y-0.5">
                              <div className="flex justify-between">
                                <span>{label}</span>
                                <span className="font-bold">{Math.round(val || 0)}%</span>
                              </div>
                              <div className="w-full bg-gray-100 dark:bg-gray-800 h-1 rounded-full overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full" 
                                  style={{ width: `${val || 0}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end mt-6 pt-4 border-t border-purple-100 dark:border-gray-800">
                <Button
                  onClick={() => setIsReviewersModalOpen(false)}
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl font-bold px-6 shadow-md hover:shadow-lg transition-all"
                >
                  Cerrar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
