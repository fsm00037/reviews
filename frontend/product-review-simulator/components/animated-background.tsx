"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export default function AnimatedBackground() {
  const [positions, setPositions] = useState([
    { x: 10, y: 15, scale: 1.4 },
    { x: 75, y: 25, scale: 1.6 },
    { x: 25, y: 70, scale: 1.5 },
    { x: 80, y: 75, scale: 1.7 },
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setPositions((prev) =>
        prev.map((pos) => ({
          x: Math.max(0, Math.min(100, pos.x + (Math.random() * 16 - 8))),
          y: Math.max(0, Math.min(100, pos.y + (Math.random() * 16 - 8))),
          scale: Math.max(1.1, Math.min(2.0, pos.scale + (Math.random() * 0.3 - 0.15))),
        }))
      )
    }, 6000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-background">
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.12] dark:opacity-[0.08] bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{
          backgroundImage: "url('/tech_background.png')"
        }}
      />

      {/* Glow blobs behind the grid */}
      <div className="absolute inset-0 z-0 opacity-25 dark:opacity-20 transition-opacity duration-1000">
        {positions.map((pos, index) => (
          <motion.div
            key={index}
            animate={{
              x: `${pos.x}vw`,
              y: `${pos.y}vh`,
              scale: pos.scale,
            }}
            transition={{ duration: 10, ease: "easeInOut" }}
            className={`absolute -left-[200px] -top-[200px] w-[500px] h-[500px] rounded-full blur-[100px] mix-blend-screen dark:mix-blend-normal ${
              index % 4 === 0
                ? "bg-indigo-400/30 dark:bg-indigo-900/20"
                : index % 4 === 1
                  ? "bg-purple-400/25 dark:bg-purple-900/15"
                  : index % 4 === 2
                    ? "bg-pink-400/20 dark:bg-pink-900/10"
                    : "bg-cyan-400/25 dark:bg-cyan-900/15"
            }`}
          />
        ))}
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 z-10 bg-grid-pattern opacity-60 dark:opacity-40" />

      {/* Fading radial overlay to make center clearer and edges fade */}
      <div 
        className="absolute inset-0 z-20 pointer-events-none" 
        style={{
          background: "radial-gradient(circle at 50% 50%, transparent 20%, hsl(var(--background)) 90%)"
        }}
      />
    </div>
  )
}


