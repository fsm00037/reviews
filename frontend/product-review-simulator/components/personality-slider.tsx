"use client"

import { Slider } from "@/components/ui/slider"

interface PersonalitySliderProps {
  leftLabel: string
  rightLabel: string
  value: number
  onChange: (value: number) => void
}

export default function PersonalitySlider({ leftLabel, rightLabel, value, onChange }: PersonalitySliderProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{leftLabel}</span>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{rightLabel}</span>
      </div>
      <div className="relative">
        <Slider
          value={[value]}
          min={0}
          max={100}
          step={5}
          onValueChange={(values) => onChange(values[0])}
          className="py-1"
        />
      </div>
      <div className="flex justify-between mt-1">
        <div
          className={`w-2 h-2 rounded-full ${value <= 25 ? "bg-black dark:bg-white" : "bg-gray-300 dark:bg-gray-600"}`}
        />
        <div
          className={`w-2 h-2 rounded-full ${value > 25 && value <= 50 ? "bg-black dark:bg-white" : "bg-gray-300 dark:bg-gray-600"}`}
        />
        <div
          className={`w-2 h-2 rounded-full ${value > 50 && value <= 75 ? "bg-black dark:bg-white" : "bg-gray-300 dark:bg-gray-600"}`}
        />
        <div
          className={`w-2 h-2 rounded-full ${value > 75 ? "bg-black dark:bg-white" : "bg-gray-300 dark:bg-gray-600"}`}
        />
      </div>
    </div>
  )
}

