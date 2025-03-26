"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export default function AnimatedBackground() {
  const [positions, setPositions] = useState([
    { x: -10, y: -10, scale: 1.2 },
    { x: 80, y: 20, scale: 1.5 },
    { x: 30, y: 70, scale: 1.3 },
    { x: 70, y: 80, scale: 1.4 },
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setPositions(
        positions.map((pos) => ({
          x: Math.max(0, Math.min(90, pos.x + (Math.random() * 10 - 5))),
          y: Math.max(0, Math.min(90, pos.y + (Math.random() * 10 - 5))),
          scale: Math.max(1, Math.min(1.8, pos.scale + (Math.random() * 0.2 - 0.1))),
        })),
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [positions])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {positions.map((pos, index) => (
        <motion.div
          key={index}
          initial={{ x: `${pos.x}%`, y: `${pos.y}%`, scale: pos.scale, opacity: 0.5 }}
          animate={{
            x: `${pos.x}%`,
            y: `${pos.y}%`,
            scale: pos.scale,
            opacity: 0.5,
          }}
          transition={{ duration: 8, ease: "easeInOut" }}
          className={`absolute w-[500px] h-[500px] rounded-full blur-3xl ${
            index % 4 === 0
              ? "bg-purple-400 dark:bg-purple-700"
              : index % 4 === 1
                ? "bg-indigo-400 dark:bg-indigo-700"
                : index % 4 === 2
                  ? "bg-pink-400 dark:bg-pink-700"
                  : "bg-blue-400 dark:bg-blue-700"
          } opacity-20`}
        />
      ))}
    </div>
  )
}

