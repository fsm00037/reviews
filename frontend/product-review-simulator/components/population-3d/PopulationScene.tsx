"use client"

import React, { useState, Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Text, ContactShadows, Environment } from "@react-three/drei"
import * as THREE from "three"
import type { BotProfile } from "@/lib/types"
import { personalityPosition } from "@/lib/appearance-utils"
import { MiiCharacter } from "./MiiCharacter"

interface PopulationSceneProps {
  bots: BotProfile[]
  selectedId?: number | null
  onSelect?: (bot: BotProfile | null) => void
  className?: string
  height?: number | string
  layout?: "paseo" | "personality" | "circle" | "grid"
}

type SceneLayout = "paseo" | "personality" | "circle" | "grid"

function layoutPosition(
  bot: BotProfile,
  index: number,
  total: number,
  layout: SceneLayout
): [number, number, number] {
  if (layout === "circle") {
    const n = Math.max(total, 1)
    const r = Math.max(2.6, Math.min(5.4, 1.1 + n * 0.32))
    const a = (index / n) * Math.PI * 2 - Math.PI / 2
    return [Math.cos(a) * r, 0, Math.sin(a) * r]
  }
  if (layout === "grid") {
    const cols = Math.ceil(Math.sqrt(Math.max(total, 1)))
    const rows = Math.ceil(total / cols)
    const spacing = Math.max(1.55, Math.min(2.1, 1.35 + total * 0.02))
    const col = index % cols
    const row = Math.floor(index / cols)
    const x = (col - (cols - 1) / 2) * spacing
    const z = (row - (rows - 1) / 2) * spacing
    return [x, 0, z]
  }
  if (layout === "personality") {
    return personalityPosition(bot, index, total)
  }
  // Paseo: spawn disperso (solo referencia; luego deambulan libre)
  const a = (index / Math.max(total, 1)) * Math.PI * 2
  const r = 1.2 + (index % 5) * 0.55
  return [Math.cos(a) * r, 0, Math.sin(a) * r]
}

/** Marcadores de plaza en el suelo (círculo / rejilla / personalidad) */
function FormationMarkers({
  bots,
  layout,
}: {
  bots: BotProfile[]
  layout: SceneLayout
}) {
  if (layout === "paseo") return null
  const color =
    layout === "circle" ? "#818cf8" : layout === "grid" ? "#34d399" : "#c4b5fd"
  return (
    <group>
      {bots.map((bot, i) => {
        const [x, , z] = layoutPosition(bot, i, bots.length, layout)
        return (
          <mesh key={`slot-${bot.id}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, z]}>
            <ringGeometry args={[0.22, 0.3, 24]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} />
          </mesh>
        )
      })}
    </group>
  )
}

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[12, 48]} />
        <meshStandardMaterial color="#e8edf7" roughness={0.95} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[5.8, 6.0, 48]} />
        <meshBasicMaterial color="#a5b4fc" transparent opacity={0.4} />
      </mesh>
      {/* Cuadrícula suave low-cost */}
      <gridHelper args={[14, 14, "#c7d2fe", "#e2e8f0"]} position={[0, 0.02, 0]} />
    </group>
  )
}

function SceneContent({
  bots,
  selectedId,
  onSelect,
  layout,
}: {
  bots: BotProfile[]
  selectedId?: number | null
  onSelect?: (bot: BotProfile | null) => void
  layout: SceneLayout
}) {
  return (
    <>
      <color attach="background" args={["#eef2ff"]} />
      <ambientLight intensity={0.75} />
      <hemisphereLight args={["#fce7f3", "#bfdbfe", 0.45]} />
      <directionalLight
        position={[5, 10, 4]}
        intensity={0.95}
        castShadow={bots.length <= 24}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      <Ground />
      <FormationMarkers bots={bots} layout={layout} />

      {layout === "personality" && (
        <>
          <Text
            position={[0, 0.05, -6.2]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.22}
            color="#94a3b8"
            anchorX="center"
          >
            ← Introvertido · Extrovertido →
          </Text>
          <Text
            position={[-6.2, 0.05, 0]}
            rotation={[-Math.PI / 2, 0, Math.PI / 2]}
            fontSize={0.22}
            color="#94a3b8"
            anchorX="center"
          >
            ← Tech novato · Experto →
          </Text>
        </>
      )}
      {layout === "paseo" && (
        <Text
          position={[0, 0.05, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.2}
          color="#94a3b8"
          anchorX="center"
        >
          Paseo libre
        </Text>
      )}
      {layout === "circle" && (
        <Text
          position={[0, 0.05, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.2}
          color="#a5b4fc"
          anchorX="center"
        >
          Formación en círculo
        </Text>
      )}
      {layout === "grid" && (
        <Text
          position={[0, 0.05, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.2}
          color="#6ee7b7"
          anchorX="center"
        >
          Formación en rejilla
        </Text>
      )}

      {bots.map((bot, i) => (
        <MiiCharacter
          key={bot.id}
          bot={bot}
          index={i}
          selected={selectedId === bot.id}
          layout={layout}
          position={layoutPosition(bot, i, bots.length, layout)}
          onClick={() => onSelect?.(selectedId === bot.id ? null : bot)}
        />
      ))}

      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.35}
        scale={22}
        blur={2.2}
        far={6}
        resolution={256}
        frames={1}
      />

      {/* Environment ligero: sin HDR pesado si hay muchos */}
      {bots.length <= 20 && <Environment preset="apartment" environmentIntensity={0.25} />}

      <OrbitControls
        makeDefault
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={2}
        maxDistance={22}
        target={[0, 0.7, 0]}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  )
}

export function PopulationScene({
  bots,
  selectedId = null,
  onSelect,
  className = "",
  height = 480,
  layout = "paseo",
}: PopulationSceneProps) {
  const [internalLayout, setInternalLayout] = useState<SceneLayout>(layout)

  if (!bots.length) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-border bg-muted/20 ${className}`}
        style={{ height }}
      >
        <p className="text-xs text-muted-foreground">Genera o carga una población para ver la simulación 3D</p>
      </div>
    )
  }

  const layoutHint: Record<SceneLayout, string> = {
    paseo: "paseo libre",
    personality: "por zona de personalidad",
    circle: "van al círculo",
    grid: "van a la rejilla",
  }
  const layoutLabel: Record<SceneLayout, string> = {
    paseo: "Paseo",
    personality: "Personalidad",
    circle: "Círculo",
    grid: "Rejilla",
  }

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-border bg-gradient-to-b from-pink-50 via-indigo-50 to-sky-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-black ${className}`}
      style={{ height }}
    >
      <div className="absolute top-3 left-3 z-10 flex gap-1.5 flex-wrap max-w-[75%]">
        {(["paseo", "personality", "circle", "grid"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setInternalLayout(l)}
            className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg border backdrop-blur-md transition-all ${
              internalLayout === l
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background/85 text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {layoutLabel[l]}
          </button>
        ))}
      </div>
      <div className="absolute top-3 right-3 z-10 text-[10px] font-medium text-muted-foreground bg-background/85 backdrop-blur-md border border-border rounded-lg px-2.5 py-1">
        {bots.length} Miis · {layoutHint[internalLayout]} · arrastra para orbitar
      </div>
      <div className="absolute bottom-3 left-3 z-10 text-[9px] text-muted-foreground bg-background/70 backdrop-blur-sm border border-border/50 rounded-md px-2 py-0.5">
        {internalLayout === "paseo"
          ? "Paseo: caminan, descansan y miran alrededor"
          : internalLayout === "personality"
            ? "Personalidad: X intro/extro · Z novato/experto tech — se quedan en su zona"
            : "Caminan hasta su plaza marcada en el suelo"}
      </div>

      <Canvas
        shadows={bots.length <= 24}
        camera={{ position: [0, 3.2, 7.5], fov: 42, near: 0.1, far: 60 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        onPointerMissed={() => onSelect?.(null)}
      >
        <Suspense fallback={null}>
          <SceneContent
            bots={bots}
            selectedId={selectedId}
            onSelect={onSelect}
            layout={internalLayout}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default PopulationScene
