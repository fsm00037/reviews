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
  Zap,
  Link2,
  Package,
  Loader2,
  LayoutGrid,
  Network,
  FlaskConical,
  ArrowRight,
} from "lucide-react"
import { AuthModal } from "@/components/auth-modal"
import { AppHeader } from "@/components/app-header"
import { RecentSession, DemographicConfig, PersonalityConfig } from "@/lib/types"
import { SimulatorService, CompareService, ProductService, SavedPopulationService, BotService, getSessionId } from "@/lib/api-services"
import { MarkdownReport } from "@/components/markdown-report"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getBotAvatarUrl } from "@/lib/bot-avatar"
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
      <div className="absolute left-0 top-[28px] w-6 md:w-8 h-px bg-border" />
      
      {/* Linea conectora vertical (se dibuja si no es el ultimo hijo) */}
      {!isLastChild && (
        <div className="absolute left-0 top-[28px] w-px h-full bg-border" />
      )}

      {/* Tarjeta del nodo */}
      <div className="flex items-center gap-4 my-2 min-w-0">
        <div
          onClick={() => onSelect(node.session_id)}
          className={`flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between p-4 bg-card/65 backdrop-blur-sm border rounded-2xl cursor-pointer hover:shadow-md transition-all duration-300 ${
            isSelected
              ? "border-primary ring-2 ring-primary/10 shadow-primary/5 bg-primary/5"
              : isMatch
              ? "border-yellow-400 dark:border-yellow-600 bg-yellow-500/[0.02]"
              : "border-border hover:border-primary/30"
          }`}
        >
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                node.parent_session_id 
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50" 
                  : "text-primary bg-primary/10"
              }`}>
                {node.parent_session_id ? "Mejora" : "Original (v1)"}
              </span>
              {node.average_rating && (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                  ★ {node.average_rating.toFixed(1)}
                </span>
              )}
            </div>

            <h4 className="font-bold text-sm text-foreground mt-1.5 truncate">
              {node.product_name}
            </h4>

            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
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
              className="h-7 w-7 border-border text-foreground hover:bg-accent rounded-lg"
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
              className="text-xs font-semibold px-2.5 py-1 h-7 border-border text-foreground hover:bg-accent rounded-lg"
            >
              Cargar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => onDelete(node.session_id, e)}
              className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full h-7 w-7"
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
          <div className="absolute left-0 top-0 bottom-[28px] w-px bg-border" />
          
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
    <div className="mb-5 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
      {/* Fila del nodo raiz */}
      <div className="flex min-w-0 items-center gap-4">
        <div
          onClick={() => handleSelectSession(node.session_id)}
          className={`flex min-w-0 flex-1 cursor-pointer flex-col justify-between rounded-xl border bg-card/90 p-4 transition-all duration-300 md:flex-row md:items-center ${
            isSelected
              ? "border-primary/40 bg-primary/[0.04] ring-2 ring-primary/15"
              : isMatch
              ? "border-amber-400/50 bg-amber-500/[0.03]"
              : "border-border/70 hover:border-primary/30"
          }`}
        >
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Raiz (Original)
              </span>
              {node.average_rating && (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                  ★ {node.average_rating.toFixed(1)}
                </span>
              )}
            </div>
            <h3 className="font-bold text-base text-foreground mt-1.5 truncate">
              {node.product_name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
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
              className="h-8 w-8 border-border text-foreground hover:bg-accent rounded-lg"
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
              className="text-xs font-semibold px-3 py-1.5 h-8 border-border text-foreground hover:bg-accent rounded-lg"
            >
              Cargar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => handleDeleteSession(node.session_id, e)}
              className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full h-8 w-8"
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
          <div className="absolute left-[12px] top-0 bottom-[28px] w-px bg-border" />
          
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

const eduLabel = (level?: string) => {
  if (level === "Low") return "Baja"
  if (level === "Medium") return "Media"
  if (level === "High") return "Alta"
  return "Mixta"
}

const genderLabel = (ratio?: string) => {
  if (ratio === "Male") return "Hombres"
  if (ratio === "Female") return "Mujeres"
  return "Mixto"
}

const PopulationCard = ({
  pop,
  onDelete,
  onUse,
  onViewReviewers,
}: {
  pop: any
  onDelete: (id: number, e: React.MouseEvent) => void
  onUse: (pop: any) => void
  onViewReviewers: (pop: any) => void
}) => {
  const demographics = pop.profile_parameters?.demographics
  const populationPrompt = pop.profile_parameters?.population_prompt
  const resolvedAge = pop.profile_parameters?.resolved_age_range
  const ageLo = resolvedAge?.[0] ?? demographics?.age_range?.[0]
  const ageHi = resolvedAge?.[1] ?? demographics?.age_range?.[1]
  const previewBots: any[] = Array.isArray(pop.reviewers) ? pop.reviewers.slice(0, 5) : []
  const extraBots = Math.max(0, (pop.num_reviewers || 0) - previewBots.length)
  const created = pop.created_at
    ? new Date(pop.created_at).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm shadow-black/[0.03] transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/8"
    >
      {/* Header visual */}
      <div className="relative h-[88px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/90 via-primary/85 to-violet-600/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_20%_20%,rgba(255,255,255,0.22),transparent_55%)]" />
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 left-1/3 h-24 w-24 rounded-full bg-violet-300/20 blur-2xl" />

        <div className="relative flex h-full items-start justify-between p-4">
          <div className="flex flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm">
              <Users className="h-3 w-3" />
              Población
            </span>
            {/* Stack de avatares preview */}
            <div className="flex items-center">
              {previewBots.length > 0 ? (
                <div className="flex -space-x-2.5">
                  {previewBots.map((bot, i) => (
                    <Avatar
                      key={bot.id ?? i}
                      className="h-8 w-8 border-2 border-white/40 shadow-sm ring-0"
                      style={{ zIndex: previewBots.length - i }}
                    >
                      <AvatarImage src={getBotAvatarUrl(bot)} alt={bot.name || ""} />
                      <AvatarFallback className="bg-white/20 text-[9px] font-bold text-white">
                        {(bot.name || "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {extraBots > 0 && (
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 text-[10px] font-bold text-white backdrop-blur-sm">
                      +{extraBots}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex h-8 items-center gap-1.5 rounded-full bg-white/15 px-2.5 text-[11px] font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm">
                  <UserCircle2 className="h-3.5 w-3.5" />
                  {pop.num_reviewers ?? 0} reseñadores
                </div>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => onDelete(pop.id, e)}
            className="h-8 w-8 shrink-0 rounded-xl bg-white/10 text-white/90 opacity-80 ring-1 ring-white/15 backdrop-blur-sm hover:bg-red-500/90 hover:text-white hover:opacity-100 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 pt-3.5">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[15px] font-semibold tracking-tight text-foreground">
              {pop.name}
            </h3>
            <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-bold tabular-nums text-primary">
              {pop.num_reviewers}
              <span className="ml-0.5 font-semibold text-primary/70">bots</span>
            </span>
          </div>
          <p className="mt-1 line-clamp-2 min-h-[2.25rem] text-xs leading-relaxed text-muted-foreground">
            {pop.description?.trim() || "Sin descripción"}
          </p>
        </div>

        {/* Stats row */}
        <div className="mt-3.5 grid grid-cols-3 gap-1.5">
          <div className="rounded-xl border border-border/60 bg-muted/30 px-2 py-2 text-center">
            <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
              Edad
            </p>
            <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-foreground">
              {ageLo != null || ageHi != null ? `${ageLo ?? "?"}–${ageHi ?? "?"}` : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/30 px-2 py-2 text-center">
            <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
              Educación
            </p>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-foreground">
              {eduLabel(demographics?.education_level)}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/30 px-2 py-2 text-center">
            <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
              Género
            </p>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-foreground">
              {genderLabel(demographics?.gender_ratio)}
            </p>
          </div>
        </div>

        {populationPrompt && (
          <div className="mt-3 rounded-xl border border-border/50 bg-gradient-to-br from-primary/[0.05] to-violet-500/[0.04] px-3 py-2.5">
            <div className="mb-1 flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-primary/90">
                Prompt de población
              </span>
            </div>
            <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
              {populationPrompt}
            </p>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-auto flex flex-col gap-3 border-t border-border/50 pt-3.5 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {created || "—"}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onViewReviewers(pop)
              }}
              className="h-8 flex-1 rounded-xl border-border/80 text-xs font-semibold sm:flex-none"
            >
              Reseñadores
            </Button>
            <Button
              size="sm"
              onClick={() => onUse(pop)}
              className="h-8 flex-1 gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-xs font-semibold text-white shadow-sm shadow-primary/25 sm:flex-none"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Usar
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

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
  const [viewingPop, setViewingPop] = useState<any | null>(null)
  const [loadingBotsForPopId, setLoadingBotsForPopId] = useState<number | null>(null)
  const [activeReviewersList, setActiveReviewersList] = useState<any[]>([])
  
  // Real-time generation states & refs
  const [tempGeneratedBots, setTempGeneratedBots] = useState<any[]>([])
  const eventSourceRef = useRef<EventSource | null>(null);

  // Modal: Usar población en simulador (elegir producto)
  const [useSimPop, setUseSimPop] = useState<any | null>(null)
  const [useSimMode, setUseSimMode] = useState<"new" | "existing">("new")
  const [useSimProductUrl, setUseSimProductUrl] = useState("")
  const [useSimSessionId, setUseSimSessionId] = useState<string | null>(null)
  const [useSimLoading, setUseSimLoading] = useState(false)
  const [useSimError, setUseSimError] = useState<string | null>(null)
  const [useSimStatus, setUseSimStatus] = useState("")

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
    setUseSimPop(pop)
    setUseSimMode("new")
    setUseSimProductUrl("")
    setUseSimSessionId(null)
    setUseSimError(null)
    setUseSimStatus("")
    setUseSimLoading(false)
  }

  /** Ejecuta trabajo de API en una sesión temporal y restaura la anterior (evita mezclar poblaciones). */
  const withTempSession = async <T,>(fn: () => Promise<T>): Promise<T> => {
    const prev =
      typeof window !== "undefined"
        ? sessionStorage.getItem("review_simulator_session_id")
        : null
    const tempId = crypto.randomUUID()
    sessionStorage.setItem("review_simulator_session_id", tempId)
    try {
      return await fn()
    } finally {
      if (prev) sessionStorage.setItem("review_simulator_session_id", prev)
      else sessionStorage.removeItem("review_simulator_session_id")
    }
  }

  /**
   * Genera perfiles SOLO para esta población en una sesión aislada.
   * No reutiliza reseñadores del simulador ni de otra población.
   */
  const generateReviewersForPopulation = async (
    pop: any,
    onProgress?: (profiles: any[]) => void
  ): Promise<any[]> => {
    const targetCount = pop.num_reviewers || 10
    const formattedDemographics = {
      ...pop.profile_parameters?.demographics,
      gender_ratio: pop.profile_parameters?.demographics?.gender_ratio,
      education_level: pop.profile_parameters?.demographics?.education_level,
    }

    return withTempSession(async () => {
      const popPrompt = pop.profile_parameters?.population_prompt
      const popManual = !!pop.profile_parameters?.use_custom_config
      await BotService.generateBots(
        targetCount,
        [targetCount, targetCount],
        pop.profile_parameters?.positivity_bias || [0, 100],
        pop.profile_parameters?.verbosity || [0, 100],
        pop.profile_parameters?.detail_level || [0, 100],
        formattedDemographics,
        pop.profile_parameters?.personality,
        false,
        undefined,
        popPrompt,
        popManual || !popPrompt
      )

      let profiles: any[] = []
      let generationStarted = false
      const maxAttempts = 80
      const intervalMs = 2000

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const statusInfo = await SimulatorService.getPhaseStatus("phase2")
        if (statusInfo.status === "pending" || statusInfo.status === "running") {
          generationStarted = true
        }
        if (statusInfo.status === "failed") {
          throw new Error(statusInfo.error || "Falló la generación de perfiles")
        }

        try {
          const res = await BotService.getReviewerProfiles()
          if (Array.isArray(res)) {
            // Tras limpiar al iniciar phase2, la lista vacía o parcial es de ESTA generación
            if (generationStarted || res.length === 0) {
              profiles = res
              if (res.length > 0) onProgress?.(res)
            }
          }
        } catch (e: any) {
          if (e?.status === 404) {
            // Sesión limpia / aún sin perfiles → la generación ya arrancó
            generationStarted = true
            profiles = []
          } else if (e?.status !== 404) {
            console.warn("[Población] poll perfiles:", e?.message || e)
          }
        }

        // Solo aceptar "completed" si vimos la generación activa (no un completed viejo de otra sesión: sesión es nueva)
        if (statusInfo.status === "completed" && (generationStarted || attempt > 0)) {
          if (profiles.length > 0) break
          // completed pero vacío: reintentar lectura
          try {
            const res = await BotService.getReviewerProfiles()
            if (Array.isArray(res) && res.length > 0) {
              profiles = res
              break
            }
          } catch {
            /* */
          }
        }
        if (generationStarted && profiles.length >= targetCount) break

        await new Promise((r) => setTimeout(r, intervalMs))
      }

      if (!profiles.length) {
        throw new Error("No se generaron reseñadores a tiempo. Inténtalo de nuevo.")
      }
      return profiles
    })
  }

  /** Carga reseñadores guardados de la población (DB); regenera solo si no hay. */
  const loadStoredPopulationReviewers = async (pop: any): Promise<any[] | null> => {
    // Siempre revalidar desde API cuando hay id (evita cache/lista local desfasada)
    if (pop?.id != null) {
      try {
        const stored = await SavedPopulationService.getPopulationReviewers(pop.id)
        if (Array.isArray(stored) && stored.length > 0) return stored
      } catch {
        /* sin guardados */
      }
    }
    if (Array.isArray(pop.reviewers) && pop.reviewers.length > 0) return pop.reviewers
    if (cachedPopReviewers[pop.id]?.length) return cachedPopReviewers[pop.id]
    return null
  }

  /** Resuelve los reseñadores de una población (DB / regenerar aislado). */
  const resolvePopulationReviewers = async (pop: any): Promise<any[]> => {
    const stored = await loadStoredPopulationReviewers(pop)
    if (stored?.length) {
      setCachedPopReviewers((prev) => ({ ...prev, [pop.id]: stored }))
      return stored
    }
    const profiles = await generateReviewersForPopulation(pop)
    setCachedPopReviewers((prev) => ({ ...prev, [pop.id]: profiles }))
    try {
      await SavedPopulationService.updatePopulationReviewers(pop.id, profiles)
      setSavedPopulations((prev) =>
        prev.map((p) => (p.id === pop.id ? { ...p, reviewers: profiles } : p))
      )
    } catch {
      /* opcional */
    }
    return profiles
  }

  const startFreshSession = () => {
    const id = crypto.randomUUID()
    sessionStorage.setItem("review_simulator_session_id", id)
    return id
  }

  const writeSimulatorBootstrap = (pop: any, reviewers: any[]) => {
    sessionStorage.setItem(
      "review_simulator_bootstrap",
      JSON.stringify({
        population: {
          id: pop.id,
          name: pop.name,
          num_reviewers: pop.num_reviewers,
          profile_parameters: pop.profile_parameters,
        },
        reviewers,
        goToStep: 2,
      })
    )
    // Compat con ConfigPhase (parámetros de población)
    sessionStorage.setItem("review_simulator_load_population", JSON.stringify(pop))
  }

  const confirmUseInSimulator = async () => {
    if (!useSimPop) return
    setUseSimError(null)
    setUseSimLoading(true)

    try {
      if (useSimMode === "new") {
        const url = useSimProductUrl.trim()
        if (!url || !/^https?:\/\//i.test(url)) {
          setUseSimError("Introduce un enlace de producto válido (http/https).")
          setUseSimLoading(false)
          return
        }
      } else if (!useSimSessionId) {
        setUseSimError("Selecciona un producto ya creado.")
        setUseSimLoading(false)
        return
      }

      setUseSimStatus("Preparando reseñadores de la población…")
      const reviewers = await resolvePopulationReviewers(useSimPop)

      // Nueva sesión limpia para no mezclar experimentos
      startFreshSession()

      if (useSimMode === "new") {
        setUseSimStatus("Analizando producto desde el enlace…")
        await ProductService.analyzeProduct(useSimProductUrl.trim())
        // phase1 es asíncrona: esperar a que el producto esté listo
        let productReady = false
        for (let i = 0; i < 90; i++) {
          const st = await SimulatorService.getPhaseStatus("phase1")
          if (st.status === "failed") {
            throw new Error(st.error || "Error al analizar el producto")
          }
          if (st.status === "completed") {
            productReady = true
            break
          }
          setUseSimStatus(`Analizando producto… (${i + 1})`)
          await new Promise((r) => setTimeout(r, 2000))
        }
        if (!productReady) {
          throw new Error("El análisis del producto tardó demasiado. Prueba de nuevo.")
        }
        // Asegurar que el producto es legible
        await ProductService.getProductInfo()
      } else {
        setUseSimStatus("Cargando producto del experimento…")
        const product = await ProductService.getSessionProduct(useSimSessionId!)
        await ProductService.updateProduct(product)
      }

      setUseSimStatus("Cargando población en el simulador…")
      await BotService.loadReviewers(reviewers)
      writeSimulatorBootstrap(useSimPop, reviewers)

      setUseSimPop(null)
      router.push("/simulator")
    } catch (err: any) {
      console.error("Usar en simulador:", err)
      setUseSimError(err?.message || "No se pudo preparar el simulador. Inténtalo de nuevo.")
    } finally {
      setUseSimLoading(false)
      setUseSimStatus("")
    }
  }

  const handleViewReviewers = async (pop: any, opts?: { forceRegenerate?: boolean }) => {
    setViewingPopName(pop.name)
    setViewingPop(pop)
    setIsReviewersModalOpen(true)
    setActiveReviewersList([])
    setLoadingBotsForPopId(pop.id)

    try {
      // 1) Solo reseñadores de ESTA población (API por pop_id) — salvo regenerar a la fuerza
      if (!opts?.forceRegenerate) {
        const stored = await loadStoredPopulationReviewers(pop)
        if (stored?.length) {
          setCachedPopReviewers((prev) => ({ ...prev, [pop.id]: stored }))
          setActiveReviewersList(stored)
          return
        }
      } else {
        // Invalidar cache local de esta población
        setCachedPopReviewers((prev) => {
          const next = { ...prev }
          delete next[pop.id]
          return next
        })
      }

      // 2) Generar en sesión temporal (no contamina simulador ni otras poblaciones)
      const profiles = await generateReviewersForPopulation(pop, (partial) => {
        setActiveReviewersList(partial)
      })

      setCachedPopReviewers((prev) => ({ ...prev, [pop.id]: profiles }))
      setActiveReviewersList(profiles)

      try {
        await SavedPopulationService.updatePopulationReviewers(pop.id, profiles)
        setSavedPopulations((prev) =>
          prev.map((p) => (p.id === pop.id ? { ...p, reviewers: profiles } : p))
        )
        setViewingPop((prev: any) => (prev?.id === pop.id ? { ...prev, reviewers: profiles } : prev))
      } catch (e) {
        console.warn("No se pudieron cachear reseñadores en la población", e)
      }
    } catch (err: any) {
      console.error("Error generating preview bots:", err)
      alert(err?.message || "Error al generar los reseñadores")
      if (!opts?.forceRegenerate) setIsReviewersModalOpen(false)
    } finally {
      setLoadingBotsForPopId(null)
    }
  }

  const handleCreatePopulation = async () => {
    if (!createName.trim()) return;
    setIsSavingPop(true);
    setTempGeneratedBots([]);

    // Sesión dedicada a esta creación (no mezclar con simulador u otras poblaciones)
    startFreshSession();
    
    let sseSource: EventSource | null = null;
    let isConnected = false;
    let finished = false;
    let fallbackScheduled = false;
    let generationStarted = false;
    let latestProfiles: any[] = [];
    // Config resuelta por el agente (si modo prompt) — se guarda con la población
    let resolvedProfileParameters: any = {
      demographics: createDemographics,
      personality: createPersonality,
      population_prompt: createUseCustomConfig ? undefined : createPopulationPrompt,
      use_custom_config: createUseCustomConfig,
    };
    
    // Fallback polling for profile generation (same as simulator)
    let attemptCount = 0;
    const maxAttempts = 100;
    const pollingInterval = 3000;
    
    const scheduleFallbackRetry = () => {
      if (finished) return;
      attemptCount++;
      setTimeout(checkBotProfilesFallback, pollingInterval);
    };

    const checkBotProfilesFallback = async () => {
      if (finished) return;
      if (attemptCount >= maxAttempts) {
        finished = true;
        setIsSavingPop(false);
        alert("Tiempo de espera agotado al generar perfiles");
        return;
      }
      try {
        // 1) Estado de la fase (no lanza 404 mientras genera)
        const statusInfo = await SimulatorService.getPhaseStatus('phase2');
        if (statusInfo.status === 'pending' || statusInfo.status === 'running') {
          generationStarted = true;
        }

        if (statusInfo.status === 'failed') {
          finished = true;
          setIsSavingPop(false);
          alert(
            statusInfo.error
              ? `Error al generar perfiles: ${String(statusInfo.error).slice(0, 200)}`
              : "Error al generar perfiles"
          );
          return;
        }

        // 2) Perfiles: 404 = aún no listos (esperado mientras pending/running)
        let profiles: any[] = [];
        try {
          const res = await BotService.getReviewerProfiles();
          if (Array.isArray(res)) profiles = res;
        } catch (profileErr: any) {
          const st = profileErr?.status;
          // 404 = generación en curso; no es un error de UI
          if (st === 404) {
            generationStarted = true;
          } else {
            console.warn(
              '[Fallback Polling] perfiles:',
              profileErr?.message || profileErr?.status || 'error'
            );
          }
        }

        if (profiles.length > 0) {
          latestProfiles = profiles;
          setTempGeneratedBots(profiles);
        }

        const done =
          generationStarted &&
          (statusInfo.status === 'completed' || profiles.length >= createPopulationSize);
        if (done && profiles.length > 0) {
          finished = true;
          sseSource?.close();
          // Intentar recuperar config del agente desde el último mensaje SSE no siempre
          // está disponible en polling; se conserva resolvedProfileParameters si ya llegó.
          await savePopulationData(profiles);
          return;
        }

        // idle / pending / running → seguir esperando
        scheduleFallbackRetry();
      } catch (err: any) {
        // Fallo de red o del endpoint de status: reintentar sin spamear overlay
        console.warn(
          '[Fallback Polling] reintento:',
          err?.message || err?.status || 'desconocido'
        );
        scheduleFallbackRetry();
      }
    };

    const startFallback = () => {
      if (finished || isConnected || fallbackScheduled) return;
      fallbackScheduled = true;
      console.log('[SSE Fallback] Activando polling de respaldo para perfiles...');
      setTimeout(checkBotProfilesFallback, 1000);
    };

    const savePopulationData = async (profilesFromGen?: any[]) => {
      try {
        // Perfiles de ESTA generación (no de otra sesión/población)
        let reviewers: any[] = Array.isArray(profilesFromGen) ? profilesFromGen : [];
        if (!reviewers.length && latestProfiles.length) {
          reviewers = latestProfiles;
        }
        if (!reviewers.length) {
          try {
            const res = await BotService.getReviewerProfiles();
            if (Array.isArray(res)) reviewers = res;
          } catch {
            /* ignore */
          }
        }

        const response = await SavedPopulationService.savePopulation(
          createName,
          createDescription,
          createPopulationSize,
          {
            ...resolvedProfileParameters,
            demographics:
              resolvedProfileParameters?.demographics || createDemographics,
            personality:
              resolvedProfileParameters?.personality || createPersonality,
            population_prompt: createUseCustomConfig
              ? undefined
              : createPopulationPrompt || resolvedProfileParameters?.population_prompt,
            use_custom_config: createUseCustomConfig,
            agent_configured_from_prompt:
              !!resolvedProfileParameters?.agent_configured_from_prompt,
            resolved_age_range: resolvedProfileParameters?.resolved_age_range,
            agent_config_rationale:
              resolvedProfileParameters?.agent_config_rationale ||
              resolvedProfileParameters?.resolved_age_rationale,
            positivity_bias: resolvedProfileParameters?.positivity_bias,
            verbosity: resolvedProfileParameters?.verbosity,
            detail_level: resolvedProfileParameters?.detail_level,
          },
          reviewers
        );
        if (response && response.id) {
          if (reviewers.length) {
            setCachedPopReviewers(prev => ({ ...prev, [response.id]: reviewers }));
          }
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
          setTempGeneratedBots([]);
          setIsCreateModalOpen(false);
        } else {
          alert("No se pudo guardar la población. ¿Has iniciado sesión?");
        }
      } catch (err: any) {
        console.error("Error saving population:", err?.message || err);
        const msg =
          err?.status === 401
            ? "Debes iniciar sesión para guardar una población"
            : err?.message || "Error al guardar la población";
        alert(msg);
      } finally {
        setIsSavingPop(false);
      }
    };

    try {
      // Connect to SSE first
      sseSource = connectSSE(
        async (message) => {
          isConnected = true;
          if (finished) return;
          if (message.type === 'profile_generated') {
            generationStarted = true;
            const newBot = message.data;
            setTempGeneratedBots((prev) => {
              const filtered = prev.filter((b) => b.id !== newBot.id);
              const next = [...filtered, newBot].sort((a, b) => a.id - b.id);
              latestProfiles = next;
              return next;
            });
          } else if (message.type === 'phase2_completed') {
            console.log('[SSE] Phase 2 completed', message.data);
            finished = true;
            sseSource?.close();
            if (message.data?.profile_parameters) {
              resolvedProfileParameters = message.data.profile_parameters;
            }
            let finalProfiles = latestProfiles;
            try {
              const res = await BotService.getReviewerProfiles();
              if (Array.isArray(res) && res.length > 0) finalProfiles = res;
            } catch {
              /* usar latestProfiles */
            }
            await savePopulationData(finalProfiles);
          } else if (message.type === 'phase2_failed') {
            console.error('[SSE] Phase 2 failed:', message.data?.error);
            finished = true;
            setIsSavingPop(false);
            alert(
              message.data?.error
                ? `Error al generar perfiles: ${String(message.data.error).slice(0, 200)}`
                : "Error al generar perfiles"
            );
            sseSource?.close();
          }
        },
        () => {
          // SSE a menudo se cae; el 404 de /reviewers es normal mientras genera
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
        createUseCustomConfig ? undefined : createPopulationPrompt,
        createUseCustomConfig
      );

      // Si SSE no conecta en ~4s, activar polling de todas formas
      setTimeout(() => {
        if (!finished && !isConnected) startFallback();
      }, 4000);
    } catch (err: any) {
      console.error("Error initiating bot generation:", err?.message || err);
      finished = true;
      setIsSavingPop(false);
      sseSource?.close();
      alert(err?.message || "Error al iniciar la generación de perfiles");
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

  const completedCount = sessions.filter((s) => s.average_rating != null).length

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/30 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,hsl(var(--primary)/0.1),transparent_55%)]" />
      </div>

      <AppHeader
        variant="app"
        onAuthChange={() => {
          const stored = localStorage.getItem("review_simulator_user")
          if (stored) {
            setCurrentUser(JSON.parse(stored))
          } else {
            setCurrentUser(null)
            setSessions([])
          }
        }}
      />

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-8 md:py-10">
        {!currentUser ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-border/70 bg-card/80 px-6 py-14 text-center shadow-sm backdrop-blur-sm"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
              <FlaskConical className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">Inicia sesión</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Accede para ver tus simulaciones, poblaciones guardadas y comparaciones con IA.
            </p>
            <div className="mt-6">
              <AuthModal onStateChange={() => window.location.reload()} />
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Encabezado de página (claro y separado del nav) */}
            <section className="space-y-5">
              <div className="flex items-center gap-3">
                <Link href="/">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-xl border-border/70"
                    aria-label="Volver al inicio"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="min-w-0">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
                    Experimentos
                  </h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Simulaciones, linajes y poblaciones reutilizables
                  </p>
                </div>
              </div>

              {/* Stats: fila dedicada, misma altura, legible */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-2xl border border-border/60 bg-card/90 px-3 py-3 shadow-sm sm:px-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FlaskConical className="hidden h-3.5 w-3.5 sm:block" />
                    <p className="text-[10px] font-medium uppercase tracking-wider">Simulaciones</p>
                  </div>
                  <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
                    {sessions.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/90 px-3 py-3 shadow-sm sm:px-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="hidden h-3.5 w-3.5 sm:block" />
                    <p className="text-[10px] font-medium uppercase tracking-wider">Completas</p>
                  </div>
                  <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
                    {completedCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/90 px-3 py-3 shadow-sm sm:px-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="hidden h-3.5 w-3.5 sm:block" />
                    <p className="text-[10px] font-medium uppercase tracking-wider">Poblaciones</p>
                  </div>
                  <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
                    {savedPopulations.length}
                  </p>
                </div>
              </div>
            </section>

            {/* Tabs de contenido */}
            <div className="flex w-full max-w-md rounded-2xl border border-border/60 bg-muted/40 p-1 shadow-sm">
              {(
                [
                  { id: "experiments" as const, label: "Simulaciones", icon: FlaskConical },
                  { id: "populations" as const, label: "Poblaciones", icon: Users },
                ]
              ).map((tab) => {
                const active = activeTab === tab.id
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : ""}`} />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {activeTab === "experiments" && (
              <div className="space-y-5">
                {selectedSessions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-primary">
                        Comparar productos · {selectedSessions.length}/2
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {selectedSessions.length === 1
                          ? "Elige otra simulación para comparar con IA."
                          : "Listo: lanza la comparación side-by-side."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => setSelectedSessions([])}
                        variant="ghost"
                        size="sm"
                        className="h-9 rounded-xl text-xs"
                      >
                        Limpiar
                      </Button>
                      <Button
                        onClick={handleCompare}
                        disabled={selectedSessions.length !== 2}
                        size="sm"
                        className="h-9 gap-1.5 rounded-xl text-xs font-semibold shadow-sm shadow-primary/15"
                      >
                        <GitCompare className="h-3.5 w-3.5" />
                        Comparar con IA
                      </Button>
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                    <Input
                      type="search"
                      placeholder="Buscar producto…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-10 rounded-xl border-border/70 bg-card/80 pl-9 text-sm shadow-sm"
                    />
                  </div>
                  <div className="inline-flex shrink-0 rounded-xl border border-border/60 bg-card/80 p-0.5 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                        viewMode === "grid"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      Cuadrícula
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("tree")}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                        viewMode === "tree"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Network className="h-3.5 w-3.5" />
                      Linaje
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-24">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-xs text-muted-foreground">Cargando experimentos…</p>
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/80 bg-card/40 px-6 py-16 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                      <HelpCircle className="h-6 w-6 text-muted-foreground/60" />
                    </div>
                    <h3 className="text-sm font-semibold">Sin experimentos</h3>
                    <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                      {searchQuery
                        ? "Ningún resultado coincide con la búsqueda."
                        : "Crea una simulación para ver aquí el historial y el linaje de productos."}
                    </p>
                    <Button asChild size="sm" className="mt-5 h-9 rounded-xl text-xs font-semibold">
                      <Link href="/simulator">
                        Ir al simulador
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredSessions.map((session, index) => {
                      const isSelected = selectedSessions.includes(session.session_id)
                      return (
                        <motion.div
                          key={session.session_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.04, 0.24) }}
                          whileHover={{ y: -2 }}
                          onClick={() => handleSelectSession(session.session_id)}
                          className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card/90 shadow-sm shadow-black/[0.02] transition-all ${
                            isSelected
                              ? "border-primary/40 ring-2 ring-primary/15 shadow-primary/10"
                              : "border-border/70 hover:border-primary/25 hover:shadow-md hover:shadow-primary/5"
                          }`}
                        >
                          <div className="relative h-28 w-full overflow-hidden bg-muted/50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={session.product_image || "/placeholder.svg"}
                              alt=""
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              onError={(e) => {
                                const el = e.currentTarget
                                if (!el.src.endsWith("/placeholder.svg")) {
                                  el.src = "/placeholder.svg"
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-90" />
                            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                              <span className="rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
                                {session.parent_session_id ? "Mejora" : "Original"}
                              </span>
                              {session.average_rating != null ? (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 backdrop-blur-sm">
                                  ★ {session.average_rating.toFixed(1)}
                                </span>
                              ) : (
                                <span className="rounded-full bg-muted/90 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground backdrop-blur-sm">
                                  En curso
                                </span>
                              )}
                            </div>
                            {isSelected && (
                              <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                                <CheckCircle className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </div>

                          <div className="flex flex-1 flex-col p-4">
                            <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-foreground">
                              {session.product_name || "Producto sin nombre"}
                            </h3>
                            {session.parent_product_name && (
                              <p className="mt-1 truncate text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                ← {session.parent_product_name}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Clock className="h-3 w-3 shrink-0" />
                              {new Date(session.created_at).toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>

                            <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/50 pt-3.5 mt-4">
                              <div className="flex gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Duplicar"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDuplicateSession(session.session_id, e)
                                  }}
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Eliminar"
                                  onClick={(e) => handleDeleteSession(session.session_id, e)}
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSelectRecentSession(session.session_id)
                                }}
                                className="h-8 gap-1 rounded-xl px-3 text-xs font-semibold"
                              >
                                Cargar
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "populations" && (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight">Poblaciones guardadas</h2>
                    <p className="text-xs text-muted-foreground">
                      Reutiliza grupos de reseñadores en nuevas simulaciones.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-9 gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-xs font-semibold text-white shadow-sm shadow-primary/20"
                  >
                    <Plus className="h-4 w-4" />
                    Crear población
                  </Button>
                </div>

                {loadingPopulations ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-24">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-xs text-muted-foreground">Cargando poblaciones…</p>
                  </div>
                ) : savedPopulations.length === 0 ? (
                  <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/80 bg-card/40 px-6 py-16 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold">Aún no hay poblaciones</h3>
                    <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                      Crea una población con demografía y personalidad personalizadas para reutilizarla.
                    </p>
                    <Button
                      onClick={() => setIsCreateModalOpen(true)}
                      size="sm"
                      className="mt-5 h-9 rounded-xl text-xs font-semibold"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Crear población
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

                  {/* List of generated bots with avatars */}
                  {tempGeneratedBots.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl max-h-56 overflow-y-auto pr-2 pb-2">
                      {tempGeneratedBots.map((bot, index) => (
                        <motion.div
                          key={bot.id || index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/50 dark:border-purple-900/20 rounded-xl flex items-center space-x-3 shadow-sm text-left"
                        >
                          <Avatar className="h-10 w-10 shrink-0 border border-purple-200/60 dark:border-purple-800/40 shadow-sm">
                            <AvatarImage src={getBotAvatarUrl(bot)} alt={bot.name} />
                            <AvatarFallback
                              className={`text-white text-xs font-bold ${
                                bot.gender === "Male"
                                  ? "bg-gradient-to-br from-indigo-500 to-indigo-600"
                                  : "bg-gradient-to-br from-pink-500 to-purple-600"
                              }`}
                            >
                              {(bot.name || "??").substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
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
                        <Label htmlFor="create-prompt" className="text-sm font-bold text-foreground flex items-center gap-2">
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
                      {!createUseCustomConfig && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Con el modo prompt, un agente configura automáticamente demografía, rangos de personalidad
                          y estilo de reseña a partir de tu descripción. Activa los sliders solo si quieres fijarlos a mano.
                        </p>
                      )}
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
                          <Avatar className="h-11 w-11 shrink-0 border border-purple-200/50 dark:border-gray-700 shadow-sm">
                            <AvatarImage src={getBotAvatarUrl(bot)} alt={bot.name} />
                            <AvatarFallback
                              className={`text-white text-xs font-bold ${
                                bot.gender === "Male"
                                  ? "bg-gradient-to-br from-indigo-500 to-indigo-600"
                                  : "bg-gradient-to-br from-pink-500 to-purple-600"
                              }`}
                            >
                              {(bot.name || "??").substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
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

              {/* Close / Regenerar */}
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-purple-100 dark:border-gray-800">
                {viewingPop && (
                  <Button
                    variant="outline"
                    disabled={loadingBotsForPopId !== null}
                    onClick={() => handleViewReviewers(viewingPop, { forceRegenerate: true })}
                    className="rounded-xl text-xs font-semibold"
                  >
                    {loadingBotsForPopId !== null ? "Generando…" : "Regenerar reseñadores"}
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setIsReviewersModalOpen(false)
                    setViewingPop(null)
                  }}
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl font-bold px-6 shadow-md hover:shadow-lg transition-all"
                >
                  Cerrar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Usar población en simulador — elegir producto */}
      <AnimatePresence>
        {useSimPop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto p-4 md:p-6 flex items-start justify-center"
            onClick={() => !useSimLoading && setUseSimPop(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-950 border dark:border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative my-8 text-gray-900 dark:text-gray-100"
            >
              <Button
                variant="ghost"
                size="icon"
                disabled={useSimLoading}
                onClick={() => setUseSimPop(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>

              <h2 className="text-xl font-bold pr-10 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Usar en simulador
              </h2>
              <p className="text-xs text-muted-foreground mt-1 mb-5">
                Población <span className="font-semibold text-foreground">{useSimPop.name}</span>
                {" · "}
                {useSimPop.num_reviewers} reseñadores. Elige con qué producto simular.
              </p>

              {/* Tabs: nuevo / existente */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/50 border border-border mb-5">
                <button
                  type="button"
                  disabled={useSimLoading}
                  onClick={() => setUseSimMode("new")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                    useSimMode === "new"
                      ? "bg-background shadow-sm text-foreground border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Producto nuevo
                </button>
                <button
                  type="button"
                  disabled={useSimLoading}
                  onClick={() => setUseSimMode("existing")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                    useSimMode === "existing"
                      ? "bg-background shadow-sm text-foreground border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Package className="h-3.5 w-3.5" />
                  Ya creado
                </button>
              </div>

              {useSimMode === "new" ? (
                <div className="space-y-2 text-left">
                  <Label htmlFor="use-sim-url" className="text-xs font-semibold">
                    Enlace del producto
                  </Label>
                  <Input
                    id="use-sim-url"
                    type="url"
                    disabled={useSimLoading}
                    placeholder="https://www.amazon.es/… o URL de tienda"
                    value={useSimProductUrl}
                    onChange={(e) => setUseSimProductUrl(e.target.value)}
                    className="rounded-xl"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Analizaremos la ficha y abriremos el simulador con esta población lista.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 text-left">
                  <Label className="text-xs font-semibold">Experimentos con producto</Label>
                  {sessions.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-6 text-center border border-dashed rounded-xl">
                      No hay experimentos guardados. Usa «Producto nuevo» o crea uno en el simulador.
                    </p>
                  ) : (
                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                      {sessions.map((s) => {
                        const selected = useSimSessionId === s.session_id
                        return (
                          <button
                            key={s.session_id}
                            type="button"
                            disabled={useSimLoading}
                            onClick={() => setUseSimSessionId(s.session_id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                              selected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border hover:border-primary/30 bg-card/50"
                            }`}
                          >
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={s.product_image || "/placeholder.svg"}
                                alt=""
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  const el = e.currentTarget
                                  if (!el.src.endsWith("/placeholder.svg")) {
                                    el.src = "/placeholder.svg"
                                  }
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold truncate">
                                {s.product_name || "Producto sin nombre"}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {s.created_at
                                  ? new Date(s.created_at).toLocaleDateString("es-ES", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "—"}
                                {s.average_rating != null && (
                                  <span className="ml-1.5">· ★ {Number(s.average_rating).toFixed(1)}</span>
                                )}
                              </p>
                            </div>
                            {selected && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {useSimError && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{useSimError}</span>
                </div>
              )}

              {useSimLoading && useSimStatus && (
                <div className="mt-4 flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {useSimStatus}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  disabled={useSimLoading}
                  onClick={() => setUseSimPop(null)}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  disabled={useSimLoading}
                  onClick={confirmUseInSimulator}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold gap-1.5"
                >
                  {useSimLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Preparando…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Abrir simulador
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
