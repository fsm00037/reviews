"use client"

import { motion } from "framer-motion"
import { Rocket, CheckCircle2 } from "lucide-react"

interface RocketProgressBarProps {
  steps: string[]
  currentStep: number
  onStepClick: (step: number) => void
}

export default function RocketProgressBar({ steps, currentStep, onStepClick }: RocketProgressBarProps) {
  return (
    <div className="w-full py-4 px-2 relative">
      {/* Progress line */}
      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 transform -translate-y-1/2 rounded-full z-0" />

      {/* Completed progress */}
      <motion.div
        className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transform -translate-y-1/2 rounded-full z-10"
        initial={{ width: "0%" }}
        animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />

      {/* Steps */}
      <div className="flex justify-between relative z-20">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep

          return (
            <div key={index} className="flex flex-col items-center">
              <motion.button
                onClick={() => onStepClick(index)}
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2
                  ${
                    isCompleted
                      ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
                      : isCurrent
                        ? "bg-white dark:bg-gray-800 border-2 border-purple-500 text-purple-500"
                        : "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-400"
                  }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <span className="font-bold">{index + 1}</span>}
              </motion.button>
              <span
                className={`text-xs font-medium ${isCurrent ? "text-purple-600 dark:text-purple-400" : "text-gray-500 dark:text-gray-400"}`}
              >
                {step}
              </span>
            </div>
          )
        })}
      </div>

      {/* Animated rocket */}
      <motion.div
        className="absolute top-1/2 transform -translate-y-1/2 z-30"
        initial={{ left: "0%" }}
        animate={{
          left: `${(currentStep / (steps.length - 1)) * 100}%`,
          rotate: [0, 5, -5, 0],
          y: [0, -5, 0],
        }}
        transition={{
          left: { duration: 0.5, ease: "easeInOut" },
          rotate: { repeat: Number.POSITIVE_INFINITY, duration: 2, ease: "easeInOut" },
          y: { repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" },
        }}
      >
        <div className="relative -left-6 -top-8">
          <Rocket className="h-8 w-8 text-purple-600 dark:text-purple-400 transform rotate-90" />
          <motion.div
            className="absolute bottom-0 left-1/2 w-4 h-8 bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent rounded-full opacity-80 transform -translate-x-1/2 translate-y-1/2"
            animate={{
              height: [6, 12, 6],
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
  )
}

