"use client"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

interface CustomRangeSliderProps {
  label?: string
  minLabel?: string
  maxLabel?: string
  minValue: number
  maxValue: number
  absoluteMin: number
  absoluteMax: number
  onChange: (min: number, max: number) => void
  step?: number
  className?: string
}

export function CustomRangeSlider({
  label,
  minLabel = "min",
  maxLabel = "max",
  minValue,
  maxValue,
  absoluteMin,
  absoluteMax,
  onChange,
  step = 1,
  className,
}: CustomRangeSliderProps) {
  return (
    <div className={cn("mb-6", className)}>
      {label && <h3 className="text-lg font-semibold mb-2">{label}</h3>}
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{minLabel}</span>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{maxLabel}</span>
      </div>

      <div className="relative py-5">
        <SliderPrimitive.Root
          className="relative flex w-full touch-none select-none items-center"
          value={[minValue, maxValue]}
          min={absoluteMin}
          max={absoluteMax}
          step={step}
          onValueChange={(values) => {
            if (values[0] !== minValue || values[1] !== maxValue) {
              onChange(values[0], values[1])
            }
          }}
        >
          <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          </SliderPrimitive.Track>

          {/* Primer tirador (mínimo) */}
          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-indigo-500 bg-white shadow-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-950 dark:border-indigo-400" />

          {/* Segundo tirador (máximo) */}
          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-pink-500 bg-white shadow-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-950 dark:border-pink-400" />
        </SliderPrimitive.Root>
      </div>

      <div className="flex justify-between mt-1">
        <span className="text-sm font-bold">{minValue}</span>
        <span className="text-sm font-bold">{maxValue}</span>
      </div>
    </div>
  )
}

