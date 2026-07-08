"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogIn, UserPlus, LogOut, User, Sparkles, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface AuthModalProps {
  onStateChange?: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ onStateChange }) => {
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
      // Limpiar también session ID para empezar limpios
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
        body: JSON.stringify({ username, password })
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

  return (
    <div>
      {user ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-semibold">
            <User className="h-3.5 w-3.5" />
            <span>{user.username}</span>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1.5 text-xs font-semibold"
          >
            <LogOut className="h-3.5 w-3.5" />
            Salir
          </Button>
        </div>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity gap-1.5 text-xs font-semibold shadow-md shadow-purple-500/10"
              size="sm"
            >
              <LogIn className="h-3.5 w-3.5" />
              Iniciar Sesión
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm bg-white dark:bg-gray-950 border dark:border-gray-800 text-gray-900 dark:text-gray-100">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                <Sparkles className="h-5 w-5 text-purple-500" />
                {isLogin ? "Bienvenido de nuevo" : "Crea tu cuenta"}
              </DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-gray-400">
                {isLogin
                  ? "Inicia sesión para guardar tus simulaciones y poblaciones."
                  : "Regístrate para comenzar a guardar tus experimentos."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {error && (
                <div className="p-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
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
                  className="bg-white/50 dark:bg-gray-900/50 border-purple-100 dark:border-gray-800 focus-visible:ring-purple-500"
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
                  className="bg-white/50 dark:bg-gray-900/50 border-purple-100 dark:border-gray-800 focus-visible:ring-purple-500"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 gap-1.5 mt-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isLogin ? (
                  <>
                    <LogIn className="h-4 w-4" />
                    Iniciar Sesión
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Registrarse
                  </>
                )}
              </Button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError("")
                    setSuccess("")
                  }}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                >
                  {isLogin
                    ? "¿No tienes una cuenta? Regístrate"
                    : "¿Ya tienes cuenta? Inicia sesión"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
