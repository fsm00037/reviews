"use client"

import { motion } from "framer-motion"
import { Check, Rocket } from "lucide-react"

interface RocketProgressBarProps {
  steps: string[]
  currentStep: number
  onStepClick: (step: number) => void
}

export default function RocketProgressBar({ steps, currentStep, onStepClick }: RocketProgressBarProps) {
  return (
    <div className="w-full py-6 px-1 relative">
      {/* Centered line container */}
      <div className="absolute top-9 left-8 right-8 h-0.5 z-0">
        {/* Progress track */}
        <div className="absolute inset-0 bg-border rounded-full" />

        {/* Completed progress line */}
        <motion.div
          className="absolute left-0 top-0 h-full bg-primary rounded-full z-10 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
          initial={{ width: "0%" }}
          animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />

        {/* Animated rocket */}
        <motion.div
          className="absolute top-0 z-30"
          initial={{ left: "0%" }}
          animate={{
            left: `${(currentStep / (steps.length - 1)) * 100}%`,
            rotate: [0, 5, -5, 0],
            y: [-22, -28, -22], // float above the circles
          }}
          transition={{
            left: { duration: 0.4, ease: "easeInOut" },
            rotate: { repeat: Number.POSITIVE_INFINITY, duration: 2, ease: "easeInOut" },
            y: { repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" },
          }}
        >
          <div className="relative -left-3 -top-4">
            <Rocket className="h-6 w-6 text-primary transform rotate-45 filter drop-shadow-[0_0_4px_rgba(99,102,241,0.4)]" />
            <motion.div
              className="absolute top-[8px] right-[24px] w-4.5 h-2 bg-gradient-to-l from-orange-500 via-yellow-400 to-transparent rounded-full opacity-80"
              animate={{
                width: [6, 12, 6],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 0.5,
                ease: "easeInOut",
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Steps indicators */}
      <div className="flex justify-between relative z-20 px-8">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep

          return (
            <div key={index} className="flex flex-col items-center select-none">
              <motion.button
                onClick={() => onStepClick(index)}
                className={`w-6 h-6 rounded-full flex items-center justify-center mb-3 text-[10px] font-bold transition-all duration-300 ring-4
                  ${
                    isCompleted
                      ? "bg-primary border border-primary text-primary-foreground ring-primary/10"
                      : isCurrent
                        ? "bg-background border-2 border-primary text-primary ring-primary/20 shadow-md"
                        : "bg-background border border-border text-muted-foreground ring-transparent hover:border-muted-foreground/50"
                  }`}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <span>{index + 1}</span>}
              </motion.button>
              <span
                className={`text-[11px] font-semibold transition-colors duration-300 ${
                  isCurrent 
                    ? "text-foreground font-bold" 
                    : isCompleted 
                      ? "text-foreground/70 font-medium" 
                      : "text-muted-foreground font-medium"
                }`}
              >
                {step}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}


