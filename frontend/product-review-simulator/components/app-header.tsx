"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sparkles } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthModal } from "@/components/auth-modal"
import { cn } from "@/lib/utils"

type AppHeaderProps = {
  /** marketing = anclas del landing; app = rutas de la aplicación */
  variant?: "marketing" | "app"
  onAuthChange?: () => void
  className?: string
}

const marketingLinks = [
  { href: "#features", label: "Producto" },
  { href: "#demos", label: "Demos" },
  { href: "#flujo", label: "Cómo funciona" },
]

const appLinks = [
  { href: "/", label: "Inicio" },
  { href: "/experiments", label: "Experimentos" },
]

export function AppHeader({ variant = "app", onAuthChange, className }: AppHeaderProps) {
  const pathname = usePathname()
  const isMarketing = variant === "marketing"
  const links = isMarketing ? marketingLinks : appLinks

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75",
        className
      )}
    >
      <div className="mx-auto flex h-[3.75rem] max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-primary/25 transition-transform group-hover:scale-[1.03]">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            PreMarket<span className="text-primary"> Lab</span>
          </span>
        </Link>

        {/* Primary nav — desktop */}
        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex"
          aria-label={isMarketing ? "Secciones" : "Navegación"}
        >
          {links.map((link) => {
            const isHash = link.href.startsWith("#")
            const active =
              !isHash &&
              (link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`))

            const className = cn(
              "relative rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )

            if (isHash) {
              return (
                <a key={link.href} href={link.href} className={className}>
                  {link.label}
                </a>
              )
            }

            return (
              <Link key={link.href} href={link.href} className={className} aria-current={active ? "page" : undefined}>
                {link.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-[0.95rem] h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <ThemeToggle />
          <div className="mx-0.5 hidden h-5 w-px bg-border/70 sm:block" aria-hidden />
          <AuthModal
            showExperimentsLink={isMarketing}
            onStateChange={onAuthChange}
          />
        </div>
      </div>

      {/* Mobile nav */}
      <div className="border-t border-border/40 md:hidden">
        <nav
          className="mx-auto flex max-w-6xl gap-0.5 overflow-x-auto px-3 py-1.5 scrollbar-none"
          aria-label="Navegación móvil"
        >
          {links.map((link) => {
            const isHash = link.href.startsWith("#")
            const active =
              !isHash &&
              (link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`))

            const className = cn(
              "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            )

            if (isHash) {
              return (
                <a key={link.href} href={link.href} className={className}>
                  {link.label}
                </a>
              )
            }

            return (
              <Link key={link.href} href={link.href} className={className} aria-current={active ? "page" : undefined}>
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
