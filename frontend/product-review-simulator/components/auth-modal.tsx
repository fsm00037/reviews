"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogIn, UserPlus, LogOut, User, Sparkles, Loader2, FlaskConical } from "lucide-react"

interface AuthModalProps {
  onStateChange?: () => void
  /** Incluye acceso a Experimentos en el bloque de usuario (landing, etc.) */
  showExperimentsLink?: boolean
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onStateChange,
  showExperimentsLink = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [user, setUser] = useState<{ id: number; username: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("review_simulator_user")
      if (stored) {
        try {
          setUser(JSON.parse(stored))
        } catch (e) {
          console.error("Error reading user storage:", e)
        }
      }
    }
  }, [])

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("review_simulator_user")
      sessionStorage.removeItem("review_simulator_session_id")
      setUser(null)
      if (onStateChange) onStateChange()
      window.location.reload()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register"

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Algo salió mal")
      }

      if (isLogin) {
        setUser(data.user)
        localStorage.setItem("review_simulator_user", JSON.stringify(data.user))
        setSuccess("Sesión iniciada con éxito")
        setTimeout(() => {
          setIsOpen(false)
          if (onStateChange) onStateChange()
          window.location.reload()
        }, 1000)
      } else {
        setSuccess("Registro exitoso. Ahora puedes iniciar sesión.")
        setIsLogin(true)
        setPassword("")
      }
    } catch (err: any) {
      setError(err.message || "Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const initials = (user?.username || "?").slice(0, 2).toUpperCase()

  // —— Usuario autenticado ——
  if (user) {
    return (
      <div
        className="flex items-center gap-1 sm:gap-2"
        role="group"
        aria-label={`Cuenta de ${user.username}`}
      >
        {showExperimentsLink && (
          <Link
            href="/experiments"
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-2.5"
            title="Experimentos"
          >
            <FlaskConical className="h-3.5 w-3.5 sm:hidden" />
            <span className="hidden sm:inline">Experimentos</span>
          </Link>
        )}

        <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-card py-0.5 pl-0.5 pr-0.5 shadow-sm sm:gap-2 sm:pr-1">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-semibold text-white"
            aria-hidden
          >
            {initials}
          </span>
          <span className="hidden max-w-[7rem] truncate text-[12px] font-medium text-foreground sm:inline lg:max-w-[10rem]">
            {user.username}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // —— Invitado ——
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 rounded-full px-3 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <User className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Iniciar sesión</span>
          <span className="sm:hidden">Entrar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isLogin
              ? "Inicia sesión para guardar simulaciones y poblaciones."
              : "Regístrate para empezar a guardar tus experimentos."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">
              {success}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="username">Nombre de usuario</Label>
            <Input
              id="username"
              type="text"
              placeholder="ej. felipe_dev"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-xl"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl"
              required
            />
          </div>

          <Button
            type="submit"
            className="mt-2 w-full gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn className="h-4 w-4" />
                Iniciar sesión
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Registrarse
              </>
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError("")
                setSuccess("")
              }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
