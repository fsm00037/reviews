"use client"

import { Slider } from "@/components/ui/slider"

interface RangeSliderProps {
  label: string
  minLabel?: string
  maxLabel?: string
  minValue: number
  maxValue: number
  absoluteMin: number
  absoluteMax: number
  onChange: (min: number, max: number) => void
}

export default function RangeSlider({
  label,
  minLabel = "min",
  maxLabel = "max",
  minValue,
  maxValue,
  absoluteMin,
  absoluteMax,
  onChange,
}: RangeSliderProps) {
  return (
    <div className="mb-6">
      {label && <h3 className="text-lg font-semibold mb-2">{label}</h3>}
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{minLabel}</span>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{maxLabel}</span>
      </div>

      <div className="relative py-5">
        <div className="absolute top-1/2 transform -translate-y-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />

        <Slider
          value={[minValue, maxValue]}
          min={absoluteMin}
          max={absoluteMax}
          step={1}
          onValueChange={(values) => {
            if (values[0] !== minValue || values[1] !== maxValue) {
              onChange(values[0], values[1])
            }
          }}
          className="py-0"
          thumbClassName="h-5 w-5 bg-white border-2 border-purple-500 dark:border-purple-400"
        />
      </div>

      <div className="flex justify-between mt-1">
        <span className="text-sm font-bold">{minValue}</span>
        <span className="text-sm font-bold">{maxValue}</span>
      </div>
    </div>
  )
}

