"use client"

/**
 * Avatar estilo Nintendo Mii: chibi, low-poly.
 * La textura del avatar se aplica LITERALMENTE a la malla de la cabeza (map UV frontal).
 */
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import * as THREE from "three"
import type { BotProfile } from "@/lib/types"
import { resolveAppearance, bodyScale, genderShape } from "@/lib/appearance-utils"
import { loadAvatarFaceTexture, createHeadGeometryWithFaceUVs } from "@/lib/avatar-texture"

// Geometrías compartidas
const HEAD_GEO = createHeadGeometryWithFaceUVs(24)

const GEO = {
  ear: new THREE.SphereGeometry(1, 6, 5),
  limb: new THREE.CapsuleGeometry(1, 1, 3, 6),
  torso: new THREE.CapsuleGeometry(1, 1, 4, 8),
  hip: new THREE.SphereGeometry(1, 8, 6),
  shoe: new THREE.SphereGeometry(1, 6, 5),
  hairCap: new THREE.SphereGeometry(1, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
  hairBall: new THREE.SphereGeometry(1, 8, 6),
}

const toonGrad = (() => {
  const data = new Uint8Array([70, 70, 85, 255, 150, 150, 165, 255, 255, 255, 255, 255])
  const t = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat)
  t.minFilter = THREE.NearestFilter
  t.magFilter = THREE.NearestFilter
  t.needsUpdate = true
  return t
})()

function toon(color: string) {
  return <meshToonMaterial color={color} gradientMap={toonGrad} />
}

function HairMii({
  style,
  color,
  headR,
}: {
  style: string
  color: string
  headR: number
}) {
  if (style === "bald") return null

  // Desplazamiento vertical extra: sube el pelo para no tapar los ojos
  const up = headR * 0.14
  // Casquete más atrás/arriba (menos volumen en la frente)
  const capY = headR * 0.32 + up
  const capZ = -headR * 0.06

  if (style === "short") {
    return (
      <mesh geometry={GEO.hairCap} scale={[headR * 1.05, headR * 0.85, headR * 1.02]} position={[0, capY, capZ]} castShadow>
        {toon(color)}
      </mesh>
    )
  }

  if (style === "bob") {
    return (
      <group>
        <mesh geometry={GEO.hairCap} scale={[headR * 1.12, headR * 0.95, headR * 1.08]} position={[0, capY, capZ]} castShadow>
          {toon(color)}
        </mesh>
        <mesh geometry={GEO.hairBall} scale={[headR * 0.55, headR * 0.45, headR * 0.4]} position={[-headR * 0.55, -headR * 0.05, -headR * 0.05]} castShadow>
          {toon(color)}
        </mesh>
        <mesh geometry={GEO.hairBall} scale={[headR * 0.55, headR * 0.45, headR * 0.4]} position={[headR * 0.55, -headR * 0.05, -headR * 0.05]} castShadow>
          {toon(color)}
        </mesh>
      </group>
    )
  }

  if (style === "spiky") {
    const spikes = [
      [0, 1.25, 0, 0.22],
      [-0.35, 1.15, 0.05, 0.18],
      [0.35, 1.15, 0.05, 0.18],
      [-0.2, 1.2, -0.15, 0.16],
      [0.2, 1.2, -0.15, 0.16],
      [0, 1.12, 0.15, 0.15],
    ] as const
    return (
      <group>
        <mesh geometry={GEO.hairCap} scale={[headR * 1.0, headR * 0.6, headR * 0.95]} position={[0, headR * 0.38 + up, capZ]} castShadow>
          {toon(color)}
        </mesh>
        {spikes.map(([x, y, z, sc], i) => (
          <mesh
            key={i}
            geometry={GEO.limb}
            scale={[headR * sc * 0.5, headR * sc * 1.2, headR * sc * 0.5]}
            position={[x * headR, y * headR + up * 0.5, z * headR]}
            rotation={[0.3 + i * 0.05, 0, (i - 2.5) * 0.15]}
            castShadow
          >
            {toon(color)}
          </mesh>
        ))}
      </group>
    )
  }

  if (style === "fringe") {
    return (
      <group>
        <mesh geometry={GEO.hairCap} scale={[headR * 1.08, headR * 0.9, headR * 1.05]} position={[0, capY, capZ]} castShadow>
          {toon(color)}
        </mesh>
        {/* Flequillo más alto: no baja hasta los ojos */}
        <mesh
          geometry={GEO.hairBall}
          scale={[headR * 0.85, headR * 0.18, headR * 0.28]}
          position={[0, headR * 0.38 + up * 0.3, headR * 0.55]}
          castShadow
        >
          {toon(color)}
        </mesh>
      </group>
    )
  }

  if (style === "side_part") {
    return (
      <group>
        <mesh geometry={GEO.hairCap} scale={[headR * 1.06, headR * 0.88, headR * 1.04]} position={[0, capY, capZ]} castShadow>
          {toon(color)}
        </mesh>
        <mesh
          geometry={GEO.hairBall}
          scale={[headR * 0.65, headR * 0.28, headR * 0.4]}
          position={[headR * 0.35, headR * 0.32 + up * 0.4, headR * 0.22]}
          castShadow
        >
          {toon(color)}
        </mesh>
      </group>
    )
  }

  if (style === "mohawk") {
    return (
      <group>
        <mesh geometry={GEO.hairCap} scale={[headR * 0.65, headR * 0.45, headR * 0.85]} position={[0, headR * 0.42 + up, capZ]} castShadow>
          {toon(color)}
        </mesh>
        {[1.0, 1.15, 1.25, 1.15, 1.0].map((h, i) => (
          <mesh
            key={i}
            geometry={GEO.limb}
            scale={[headR * 0.12, headR * 0.28, headR * 0.14]}
            position={[0, h * headR + up * 0.3, (i - 2) * headR * 0.16]}
            castShadow
          >
            {toon(color)}
          </mesh>
        ))}
      </group>
    )
  }

  if (style === "afro") {
    return (
      <mesh geometry={GEO.hairBall} scale={headR * 1.28} position={[0, headR * 0.48 + up, -headR * 0.08]} castShadow>
        {toon(color)}
      </mesh>
    )
  }

  if (style === "twin_tails") {
    return (
      <group>
        <mesh geometry={GEO.hairCap} scale={[headR * 1.06, headR * 0.9, headR * 1.04]} position={[0, capY, capZ]} castShadow>
          {toon(color)}
        </mesh>
        <mesh geometry={GEO.limb} scale={[headR * 0.18, headR * 0.55, headR * 0.18]} position={[-headR * 0.7, -headR * 0.08, -headR * 0.2]} rotation={[0.4, 0, 0.5]} castShadow>
          {toon(color)}
        </mesh>
        <mesh geometry={GEO.limb} scale={[headR * 0.18, headR * 0.55, headR * 0.18]} position={[headR * 0.7, -headR * 0.08, -headR * 0.2]} rotation={[0.4, 0, -0.5]} castShadow>
          {toon(color)}
        </mesh>
        <mesh geometry={GEO.hairBall} scale={headR * 0.28} position={[-headR * 0.85, -headR * 0.48, -headR * 0.15]} castShadow>
          {toon(color)}
        </mesh>
        <mesh geometry={GEO.hairBall} scale={headR * 0.28} position={[headR * 0.85, -headR * 0.48, -headR * 0.15]} castShadow>
          {toon(color)}
        </mesh>
      </group>
    )
  }

  if (style === "bun") {
    return (
      <group>
        <mesh geometry={GEO.hairCap} scale={[headR * 1.06, headR * 0.9, headR * 1.04]} position={[0, capY, capZ]} castShadow>
          {toon(color)}
        </mesh>
        <mesh geometry={GEO.hairBall} scale={headR * 0.42} position={[0, headR * 1.12 + up * 0.3, -headR * 0.05]} castShadow>
          {toon(color)}
        </mesh>
      </group>
    )
  }

  if (style === "ponytail") {
    return (
      <group>
        <mesh geometry={GEO.hairCap} scale={[headR * 1.06, headR * 0.9, headR * 1.04]} position={[0, capY, capZ]} castShadow>
          {toon(color)}
        </mesh>
        <mesh
          geometry={GEO.limb}
          scale={[headR * 0.22, headR * 0.55, headR * 0.22]}
          position={[0, headR * 0.18, -headR * 0.95]}
          rotation={[0.9, 0, 0]}
          castShadow
        >
          {toon(color)}
        </mesh>
      </group>
    )
  }

  if (style === "curly") {
    const spots = [
      [0, 1.05, -0.15],
      [-0.55, 0.7, 0.05],
      [0.55, 0.7, 0.05],
      [-0.5, 0.65, -0.4],
      [0.5, 0.65, -0.4],
      [0, 0.55, -0.7],
      [-0.7, 0.85, -0.05],
      [0.7, 0.85, -0.05],
    ] as const
    return (
      <group>
        {spots.map(([x, y, z], i) => (
          <mesh
            key={i}
            geometry={GEO.hairBall}
            scale={headR * (0.34 + (i % 3) * 0.05)}
            position={[x * headR, y * headR + up * 0.4, z * headR]}
            castShadow
          >
            {toon(color)}
          </mesh>
        ))}
      </group>
    )
  }

  if (style === "long") {
    return (
      <group>
        <mesh geometry={GEO.hairCap} scale={[headR * 1.1, headR * 0.95, headR * 1.08]} position={[0, capY, capZ]} castShadow>
          {toon(color)}
        </mesh>
        <mesh geometry={GEO.limb} scale={[headR * 0.55, headR * 0.75, headR * 0.35]} position={[0, -headR * 0.32, -headR * 0.42]} castShadow>
          {toon(color)}
        </mesh>
        <mesh geometry={GEO.limb} scale={[headR * 0.25, headR * 0.6, headR * 0.22]} position={[-headR * 0.45, -headR * 0.28, -headR * 0.18]} castShadow>
          {toon(color)}
        </mesh>
        <mesh geometry={GEO.limb} scale={[headR * 0.25, headR * 0.6, headR * 0.22]} position={[headR * 0.45, -headR * 0.28, -headR * 0.18]} castShadow>
          {toon(color)}
        </mesh>
      </group>
    )
  }

  // medium default
  return (
    <mesh geometry={GEO.hairCap} scale={[headR * 1.1, headR * 0.95, headR * 1.06]} position={[0, capY, capZ]} castShadow>
      {toon(color)}
    </mesh>
  )
}

/** Radio del patio donde deambulan los Miis (modo personalidad) */
const WANDER_RADIUS = 5.2

/** paseo = deambular libre (como al inicio); personalidad / círculo / rejilla = plazas */
export type LayoutMode = "paseo" | "personality" | "circle" | "grid"

type AIState = "walk" | "rest" | "look" | "go_to_slot"

type AIBrain = {
  state: AIState
  mode: "free" | "formation"
  layout: LayoutMode
  x: number
  z: number
  yaw: number
  targetX: number
  targetZ: number
  slotX: number
  slotZ: number
  timer: number
  walkPhase: number
  speed: number
  restChance: number
}

function randomInCircle(radius: number, rng: () => number): { x: number; z: number } {
  const a = rng() * Math.PI * 2
  const r = Math.sqrt(rng()) * radius
  return { x: Math.cos(a) * r, z: Math.sin(a) * r }
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function turnToward(b: AIBrain, tx: number, tz: number, dt: number, rate = 6) {
  const desiredYaw = Math.atan2(tx - b.x, tz - b.z)
  let dyaw = desiredYaw - b.yaw
  while (dyaw > Math.PI) dyaw -= Math.PI * 2
  while (dyaw < -Math.PI) dyaw += Math.PI * 2
  b.yaw += dyaw * Math.min(1, rate * dt)
}

function stepToward(b: AIBrain, dt: number) {
  const step = b.speed * 1.15 * dt
  b.x += Math.sin(b.yaw) * step
  b.z += Math.cos(b.yaw) * step
  b.walkPhase += dt * (8 + b.speed * 4)
}

export function MiiCharacter({
  bot,
  index,
  selected,
  onClick,
  position,
  layout = "paseo",
}: {
  bot: BotProfile
  index: number
  selected: boolean
  onClick: () => void
  /** Punto de formación o referencia de spawn */
  position: [number, number, number]
  layout?: LayoutMode
}) {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const headG = useRef<THREE.Group>(null)
  const lArm = useRef<THREE.Group>(null)
  const rArm = useRef<THREE.Group>(null)
  const lLeg = useRef<THREE.Group>(null)
  const rLeg = useRef<THREE.Group>(null)

  const [faceMap, setFaceMap] = useState<THREE.Texture | null>(null)
  const [hovered, setHovered] = useState(false)

  const app = useMemo(() => resolveAppearance(bot), [bot])
  const bScale = useMemo(() => bodyScale(app.body_type), [app.body_type])
  const gShape = useMemo(() => genderShape(app.gender), [app.gender])

  const rng = useMemo(() => mulberry32((bot.id + 1) * 9973 + index * 131), [bot.id, index])

  // Cerebro de IA (ref: sin re-renders)
  const brain = useRef<AIBrain | null>(null)
  if (!brain.current) {
    const start = { x: position[0], z: position[2] }
    const dest = randomInCircle(WANDER_RADIUS, rng)
    // Personalidad = formación por zona (se quedan en su punto)
    const isFormation = layout === "circle" || layout === "grid" || layout === "personality"
    brain.current = {
      state: isFormation ? "go_to_slot" : rng() > 0.35 ? "walk" : "rest",
      mode: isFormation ? "formation" : "free",
      layout,
      x: start.x,
      z: start.z,
      yaw: Math.atan2(dest.x - start.x, dest.z - start.z),
      targetX: isFormation ? position[0] : dest.x,
      targetZ: isFormation ? position[2] : dest.z,
      slotX: position[0],
      slotZ: position[2],
      timer: 1 + rng() * 3,
      walkPhase: rng() * Math.PI * 2,
      speed: 0.7 + app.energy * 0.55 + rng() * 0.25,
      restChance: 0.35 + (1 - app.energy) * 0.35,
    }
  }

  // Al cambiar layout o plaza (p. ej. otro mapa de personalidad): caminan a la nueva posición
  useEffect(() => {
    const b = brain.current
    if (!b) return
    const isFormation = layout === "circle" || layout === "grid" || layout === "personality"
    const slotMoved =
      Math.hypot(position[0] - b.slotX, position[2] - b.slotZ) > 0.08
    const layoutChanged = b.layout !== layout

    b.layout = layout
    b.slotX = position[0]
    b.slotZ = position[2]

    if (isFormation) {
      // Formación: ir andando a la plaza (también si solo cambia el mapa de ejes)
      if (layoutChanged || slotMoved || b.mode !== "formation") {
        b.mode = "formation"
        b.targetX = position[0]
        b.targetZ = position[2]
        b.state = "go_to_slot"
        b.timer = 60
      }
    } else {
      // Paseo: deambular desde donde están (sin teletransporte)
      b.mode = "free"
      if (layoutChanged || b.state === "go_to_slot") {
        const dest = randomInCircle(WANDER_RADIUS, rng)
        b.targetX = dest.x
        b.targetZ = dest.z
        b.state = "walk"
        b.timer = 2 + rng() * 4
      }
    }
  }, [layout, position[0], position[2], rng])

  useEffect(() => {
    let cancelled = false
    setFaceMap(null)
    loadAvatarFaceTexture(bot, bot.name, app.skin_hex)
      .then((tex) => {
        if (!cancelled) setFaceMap(tex)
      })
      .catch(() => {
        if (!cancelled) setFaceMap(null)
      })
    return () => {
      cancelled = true
    }
  }, [bot.avatar, bot.name, bot.id, app.skin_hex])

  const s = 0.55 + (app.height - 1.5) * 0.35
  const headR = 0.28 * s * (app.gender === "Female" ? 1.02 : 1)
  const torsoH = 0.22 * s * bScale.torso
  const torsoR = 0.12 * s * bScale.chest * gShape.chestMul
  const hipR = 0.11 * s * bScale.hips * gShape.hipMul
  const shoulderW = 0.2 * s * bScale.shoulders * gShape.shoulderMul
  const armLen = 0.16 * s * bScale.limbs
  const armR = 0.04 * s * bScale.limbs
  const legLen = 0.18 * s * bScale.limbs
  const legR = 0.05 * s * bScale.limbs

  const hipY = legLen + 0.02
  const torsoY = hipY + torsoH * 0.35
  const headY = hipY + torsoH + headR * 0.85

  useFrame((state, delta) => {
    const b = brain.current
    if (!b || !root.current) return
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime

    // Al seleccionar: se para y saluda (sin moverse ni girar)
    if (!selected) {
      b.timer -= dt

      // —— Ir a plaza de formación (círculo / rejilla / cambio de layout) ——
      if (b.state === "go_to_slot") {
        b.targetX = b.slotX
        b.targetZ = b.slotZ
        const dist = Math.hypot(b.slotX - b.x, b.slotZ - b.z)
        if (dist < 0.1) {
          b.x = b.slotX
          b.z = b.slotZ
          if (b.mode === "formation") {
            // Orientación según formación
            if (b.layout === "circle") {
              b.yaw = Math.atan2(-b.x, -b.z) // mirar al centro
            } else if (b.layout === "personality") {
              // Mirar hacia el centro del mapa (origen) para leer ejes
              b.yaw = Math.atan2(-b.x, -b.z + 0.001)
            }
            // rejilla: mantiene la orientación al llegar
            b.state = "rest"
            b.timer = 3 + rng() * 4
          } else {
            b.state = rng() > 0.5 ? "walk" : "rest"
            b.timer = 1.5 + rng() * 3
            if (b.state === "walk") {
              const dest = randomInCircle(WANDER_RADIUS, rng)
              b.targetX = dest.x
              b.targetZ = dest.z
            }
          }
        } else {
          turnToward(b, b.slotX, b.slotZ, dt)
          stepToward(b, dt)
        }
      } else if (b.mode === "formation") {
        // Formación / personalidad: fijos en su zona; idle y mirar sin salir
        const dist = Math.hypot(b.slotX - b.x, b.slotZ - b.z)
        if (dist > 0.12) {
          b.state = "go_to_slot"
        } else {
          // Anclar a la plaza (evita deriva)
          b.x = b.slotX
          b.z = b.slotZ
          if (b.state === "look") {
            b.yaw += Math.sin(t * 0.5 + index) * 0.2 * dt
            if (b.timer <= 0) {
              b.state = "rest"
              b.timer = 2.5 + rng() * 4
            }
          } else {
            if (b.timer <= 0) {
              b.state = "look"
              b.timer = 1.5 + rng() * 2.5
            }
          }
        }
      } else if (b.state === "walk") {
        // —— Modo paseo libre ——
        const dx = b.targetX - b.x
        const dz = b.targetZ - b.z
        const dist = Math.hypot(dx, dz)

        if (dist < 0.12 || b.timer <= 0) {
          b.state = rng() < 0.7 ? "rest" : "look"
          b.timer = 1.5 + rng() * 3.5 + (1 - app.energy) * 2
        } else {
          turnToward(b, b.targetX, b.targetZ, dt)
          stepToward(b, dt)

          const r = Math.hypot(b.x, b.z)
          if (r > WANDER_RADIUS) {
            const k = WANDER_RADIUS / r
            b.x *= k
            b.z *= k
            const back = randomInCircle(WANDER_RADIUS * 0.7, rng)
            b.targetX = back.x
            b.targetZ = back.z
          }
        }
      } else if (b.state === "rest") {
        if (b.timer <= 0) {
          if (rng() < b.restChance * 0.3) {
            b.state = "look"
            b.timer = 1 + rng() * 2
          } else {
            b.state = "walk"
            const dest = randomInCircle(WANDER_RADIUS, rng)
            b.targetX = dest.x
            b.targetZ = dest.z
            b.timer = 2.5 + rng() * 5
          }
        }
      } else if (b.state === "look") {
        b.yaw += Math.sin(t * 0.8 + index) * 0.4 * dt
        if (b.timer <= 0) {
          b.state = rng() < 0.55 ? "walk" : "rest"
          if (b.state === "walk") {
            const dest = randomInCircle(WANDER_RADIUS, rng)
            b.targetX = dest.x
            b.targetZ = dest.z
            b.timer = 2 + rng() * 4
          } else {
            b.timer = 1.2 + rng() * 2.5
          }
        }
      }
    }

    // Posición y orientación del root
    const isMoving = !selected && (b.state === "walk" || b.state === "go_to_slot")
    const bob = selected
      ? Math.sin(t * 2.2) * 0.012
      : isMoving
        ? Math.abs(Math.sin(b.walkPhase)) * 0.035
        : Math.sin(t * 1.5 + index) * 0.008
    root.current.position.set(b.x, bob, b.z)

    root.current.rotation.y = b.yaw
    if (selected) {
      root.current.scale.setScalar(1.08 + Math.sin(t * 3) * 0.02)
    } else {
      root.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.12)
    }

    // —— Animación corporal ——
    const walking = isMoving
    const swing = walking ? Math.sin(b.walkPhase) : Math.sin(t * 1.2 + index) * 0.08
    // Saludo: brazo derecho arriba + vaivén
    const wave = Math.sin(t * 9) * 0.45

    if (lLeg.current && rLeg.current) {
      const legAmp = walking ? 0.55 : 0.04
      lLeg.current.rotation.x = swing * legAmp
      rLeg.current.rotation.x = -swing * legAmp
    }
    if (lArm.current && rArm.current) {
      if (selected) {
        // Brazo izquierdo relajado
        lArm.current.rotation.x = THREE.MathUtils.lerp(lArm.current.rotation.x, 0.15, 0.15)
        lArm.current.rotation.z = THREE.MathUtils.lerp(lArm.current.rotation.z, 0.4, 0.15)
        // Brazo derecho: saludo (levantado y ondeando)
        rArm.current.rotation.x = THREE.MathUtils.lerp(rArm.current.rotation.x, -0.15 + wave * 0.15, 0.2)
        rArm.current.rotation.z = THREE.MathUtils.lerp(rArm.current.rotation.z, -2.15 + wave, 0.22)
      } else {
        const armAmp = walking ? 0.5 : 0.12
        lArm.current.rotation.x = -swing * armAmp
        rArm.current.rotation.x = swing * armAmp
        lArm.current.rotation.z = 0.35 + (walking ? 0 : Math.sin(t + index) * 0.05)
        rArm.current.rotation.z = -0.35 - (walking ? 0 : Math.sin(t + index) * 0.05)
      }
    }
    if (body.current) {
      body.current.rotation.y = selected ? Math.sin(t * 2) * 0.04 : walking ? swing * 0.06 : 0
      body.current.scale.y =
        1 + Math.sin(t * (selected ? 3 : walking ? 8 : 1.8) + index) * (selected ? 0.02 : walking ? 0.025 : 0.015)
    }
    if (headG.current) {
      if (selected) {
        // Asiente amable mientras saluda
        headG.current.rotation.y = Math.sin(t * 2.5) * 0.12
        headG.current.rotation.x = -0.08 + Math.sin(t * 3) * 0.08
        headG.current.rotation.z = Math.sin(t * 2) * 0.05
      } else if (b.state === "look") {
        headG.current.rotation.y = Math.sin(t * 1.1 + index) * 0.55
        headG.current.rotation.x = Math.sin(t * 0.7) * 0.12
        headG.current.rotation.z = Math.sin(t * 0.3 + index) * 0.03
      } else if (walking) {
        headG.current.rotation.y = swing * 0.08
        headG.current.rotation.x = -0.05
        headG.current.rotation.z = Math.sin(t * 0.3 + index) * 0.03
      } else {
        headG.current.rotation.y = Math.sin(t * 0.35 + index) * 0.15
        headG.current.rotation.x = 0.08 + Math.sin(t * 0.5) * 0.04
        headG.current.rotation.z = Math.sin(t * 0.3 + index) * 0.03
      }
    }
  })

  return (
    <group
      ref={root}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = "pointer"
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHovered(false)
        document.body.style.cursor = "auto"
      }}
    >
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <ringGeometry args={[0.32 * s, 0.4 * s, 24]} />
          <meshBasicMaterial color="#6366f1" transparent opacity={0.85} />
        </mesh>
      )}

      {/* Piernas animables */}
      <group ref={lLeg} position={[-hipR * 0.45, hipY, 0]}>
        <mesh geometry={GEO.limb} scale={[legR, legLen * 0.35, legR]} position={[0, -legLen * 0.5, 0]} castShadow>
          {toon(app.pants_color)}
        </mesh>
        <mesh geometry={GEO.shoe} scale={[legR * 1.5, legR * 0.9, legR * 1.8]} position={[0, -legLen + legR * 0.7, legR * 0.3]} castShadow>
          {toon(app.shoe_color)}
        </mesh>
      </group>
      <group ref={rLeg} position={[hipR * 0.45, hipY, 0]}>
        <mesh geometry={GEO.limb} scale={[legR, legLen * 0.35, legR]} position={[0, -legLen * 0.5, 0]} castShadow>
          {toon(app.pants_color)}
        </mesh>
        <mesh geometry={GEO.shoe} scale={[legR * 1.5, legR * 0.9, legR * 1.8]} position={[0, -legLen + legR * 0.7, legR * 0.3]} castShadow>
          {toon(app.shoe_color)}
        </mesh>
      </group>

      <mesh geometry={GEO.hip} scale={[hipR * 1.1, hipR * 0.85, hipR * 0.95]} position={[0, hipY, 0]} castShadow>
        {toon(app.pants_color)}
      </mesh>

      <group ref={body} position={[0, torsoY, 0]}>
        <mesh geometry={GEO.torso} scale={[torsoR, torsoH * 0.35, torsoR * 0.9]} castShadow>
          {toon(app.primary_color)}
        </mesh>
        <mesh geometry={GEO.hip} scale={[torsoR * 0.55, torsoR * 0.25, torsoR * 0.55]} position={[0, torsoH * 0.45, 0]} castShadow>
          {toon(app.secondary_color)}
        </mesh>
      </group>

      <group ref={lArm} position={[-shoulderW * 0.7, hipY + torsoH * 0.55, 0]}>
        <mesh geometry={GEO.limb} scale={[armR, armLen * 0.4, armR]} position={[0, -armLen * 0.35, 0]} castShadow>
          {toon(app.primary_color)}
        </mesh>
        <mesh geometry={GEO.hip} scale={armR * 1.3} position={[0, -armLen * 0.75, 0]} castShadow>
          {toon(app.skin_hex)}
        </mesh>
      </group>
      <group ref={rArm} position={[shoulderW * 0.7, hipY + torsoH * 0.55, 0]}>
        <mesh geometry={GEO.limb} scale={[armR, armLen * 0.4, armR]} position={[0, -armLen * 0.35, 0]} castShadow>
          {toon(app.primary_color)}
        </mesh>
        <mesh geometry={GEO.hip} scale={armR * 1.3} position={[0, -armLen * 0.75, 0]} castShadow>
          {toon(app.skin_hex)}
        </mesh>
      </group>

      <group ref={headG} position={[0, headY, 0]}>
        {/*
          Cabeza = 1 malla.
          Textura opaca: piel del Mii + avatar de la tarjeta (sin blanco) en el frente.
        */}
        <mesh geometry={HEAD_GEO} scale={headR} castShadow>
          {faceMap ? (
            <meshStandardMaterial
              map={faceMap}
              color="#ffffff"
              roughness={0.72}
              metalness={0}
              envMapIntensity={0.15}
            />
          ) : (
            <meshToonMaterial color={app.skin_hex} gradientMap={toonGrad} />
          )}
        </mesh>

        <mesh geometry={GEO.ear} scale={headR * 0.22} position={[-headR * 0.95, 0, 0]} castShadow>
          {toon(app.skin_hex)}
        </mesh>
        <mesh geometry={GEO.ear} scale={headR * 0.22} position={[headR * 0.95, 0, 0]} castShadow>
          {toon(app.skin_hex)}
        </mesh>

        <HairMii style={app.hair_style} color={app.hair_hex} headR={headR} />
      </group>

      {hovered && (
        <Html
          position={[0, headY + headR + 0.18, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shadow-md border bg-background/90 text-foreground border-border/70">
            {bot.name.split(" ")[0]}
            <span className="opacity-60 font-medium"> · {bot.age}</span>
          </div>
        </Html>
      )}
    </group>
  )
}

export default MiiCharacter
