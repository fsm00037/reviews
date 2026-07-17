"use client"

/**
 * Escenario 3D protagonista de la landing: población Mii caminando.
 * Ligero (sin texturas de cara ni IA).
 */
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { ContactShadows } from "@react-three/drei"
import * as THREE from "three"
import { loadAvatarFaceTexture, createHeadGeometryWithFaceUVs } from "@/lib/avatar-texture"

const HEAD_GEO = createHeadGeometryWithFaceUVs(20)

const GEO = {
  ear: new THREE.SphereGeometry(1, 6, 5),
  limb: new THREE.CapsuleGeometry(1, 1, 3, 6),
  torso: new THREE.CapsuleGeometry(1, 1, 4, 8),
  hip: new THREE.SphereGeometry(1, 8, 6),
  shoe: new THREE.SphereGeometry(1, 6, 5),
  hairCap: new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
  hairBall: new THREE.SphereGeometry(1, 8, 6),
}

/** Nombres-seed aleatorios para caras DiceBear distintas */
const FACE_SEEDS = [
  "lucia", "marco", "sofia", "diego", "elena", "pablo", "ina", "hugo",
  "carla", "nerea", "ivan", "alba", "raul", "mira", "leo", "noa",
  "kike", "vera", "omar", "lara", "nico", "iris", "felix", "zoe",
]

const toonGrad = (() => {
  const data = new Uint8Array([70, 70, 85, 255, 150, 150, 165, 255, 255, 255, 255, 255])
  const t = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat)
  t.minFilter = THREE.NearestFilter
  t.magFilter = THREE.NearestFilter
  t.needsUpdate = true
  return t
})()

type ParadeWalker = {
  id: number
  skin: string
  shirt: string
  pants: string
  shoes: string
  hair: string
  hairStyle: "short" | "long" | "curly" | "bun" | "bald"
  faceSeed: string
  speed: number
  scale: number
  startX: number
  startZ: number
  walkDur: number
  restDur: number
  phase: number
}

const PALETTE = {
  skins: ["#f3c9a8", "#e8b48a", "#c98a54", "#b07a4a", "#9a6435", "#6e4226"],
  shirts: ["#6366f1", "#ec4899", "#22c55e", "#f59e0b", "#0ea5e9", "#a855f7", "#ef4444", "#14b8a6"],
  pants: ["#1e293b", "#334155", "#0f172a", "#374151", "#1e3a5f", "#27272a"],
  shoes: ["#0f172a", "#f8fafc", "#ef4444", "#3b82f6", "#a855f7"],
  hair: ["#1c1410", "#5c3a21", "#e0c068", "#c0392b", "#9aa0a8", "#ec4899", "#3b82f6"],
}

function pick<T>(arr: T[], i: number): T {
  return arr[Math.abs(i) % arr.length]
}

/**
 * Zona de paseo en forma de DONUT:
 * hueco grande en el centro para el texto del hero (sin Miis detrás).
 * Radio en plano XZ (cámara mira desde +Z).
 */
const RING_INNER = 4.15
const RING_OUTER = 6.15
/** Evita el arco lejano (-Z) que se proyecta bajo el título */
const RING_Z_MIN = -2.35

/** Punto aleatorio en el anillo [inner, outer]; evita el arco lejano (-Z) bajo el título */
function randomInRing(inner = RING_INNER, outer = RING_OUTER): { x: number; z: number } {
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2
    const u = Math.random()
    const r = Math.sqrt(u * (outer * outer - inner * inner) + inner * inner)
    // Convención de movimiento: x~sin, z~cos → usamos la misma al samplear
    const x = Math.sin(a) * r
    const z = Math.cos(a) * r
    if (z >= RING_Z_MIN) return clampToRing(x, z, inner, outer)
  }
  // Fallback: laterales del anillo (nunca centro)
  const mid = (inner + outer) * 0.5
  const side = Math.random() < 0.5 ? 1 : -1
  return clampToRing(side * mid, 0.6 + Math.random() * 1.2, inner, outer)
}

/** Empuja una posición al interior del donut si se sale */
function clampToRing(x: number, z: number, inner = RING_INNER, outer = RING_OUTER): { x: number; z: number } {
  let zz = z < RING_Z_MIN ? RING_Z_MIN : z
  const r = Math.hypot(x, zz)
  if (r < 1e-6) {
    const mid = (inner + outer) * 0.5
    return { x: mid, z: 0 }
  }
  if (r < inner) {
    const k = inner / r
    return { x: x * k, z: zz * k }
  }
  if (r > outer) {
    const k = outer / r
    return { x: x * k, z: zz * k }
  }
  return { x, z: zz }
}

/**
 * Avanza hacia el target sin atravesar el hueco del donut.
 * Si el paso caería dentro del radio interior, desliza por el arco.
 */
function stepInRing(
  x: number,
  z: number,
  yaw: number,
  speed: number,
  dt: number,
  targetX: number,
  targetZ: number,
  inner = RING_INNER,
  outer = RING_OUTER
): { x: number; z: number; yaw: number } {
  const step = speed * dt
  let nx = x + Math.sin(yaw) * step
  let nz = z + Math.cos(yaw) * step
  const nr = Math.hypot(nx, nz)

  if (nr < inner) {
    // Deslizar por la circunferencia interior hacia el ángulo del target
    const curAng = Math.atan2(x, z)
    const tgtAng = Math.atan2(targetX, targetZ)
    let dAng = tgtAng - curAng
    while (dAng > Math.PI) dAng -= Math.PI * 2
    while (dAng < -Math.PI) dAng += Math.PI * 2
    const maxAng = step / Math.max(inner, 0.01)
    const angStep = Math.sign(dAng) * Math.min(Math.abs(dAng), maxAng)
    const ang = curAng + angStep
    nx = Math.sin(ang) * inner
    nz = Math.cos(ang) * inner
    yaw = ang + (dAng >= 0 ? Math.PI / 2 : -Math.PI / 2)
  }

  const clamped = clampToRing(nx, nz, inner, outer)
  return { x: clamped.x, z: clamped.z, yaw }
}

/** Pseudo-aleatorio estable (misma población en cada montaje → precarga coherente) */
function seeded01(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function seededInRing(seed: number, inner = RING_INNER, outer = RING_OUTER): { x: number; z: number } {
  const a = seeded01(seed * 3.17) * Math.PI * 2
  const u = seeded01(seed * 5.91)
  const r = Math.sqrt(u * (outer * outer - inner * inner) + inner * inner)
  const x = Math.sin(a) * r
  const z = Math.cos(a) * r
  return clampToRing(x, z, inner, outer)
}

function buildWalkers(count: number): ParadeWalker[] {
  return Array.from({ length: count }, (_, i) => {
    const spawn = seededInRing(i + 1)
    return {
      id: i,
      skin: pick(PALETTE.skins, i * 3 + 1),
      shirt: pick(PALETTE.shirts, i * 5 + 2),
      pants: pick(PALETTE.pants, i * 7),
      shoes: pick(PALETTE.shoes, i * 11),
      hair: pick(PALETTE.hair, i * 13),
      hairStyle: pick(["short", "long", "curly", "bun", "bald"] as const, i * 3),
      faceSeed: FACE_SEEDS[i % FACE_SEEDS.length] + `-mii-${i}`,
      speed: 0.38 + (i % 5) * 0.05,
      scale: 0.72 + (i % 5) * 0.07,
      startX: spawn.x,
      startZ: spawn.z,
      walkDur: 4 + (i % 4) * 1.2,
      restDur: 1.6 + (i % 3) * 1.0,
      phase: i * 1.7,
    }
  })
}

function easeOutCubic(t: number) {
  const x = Math.min(1, Math.max(0, t))
  return 1 - Math.pow(1 - x, 3)
}

/** Precarga caras DiceBear (usa la caché de avatar-texture). */
export async function preloadParadeFaces(walkers: ParadeWalker[]): Promise<Map<number, THREE.Texture>> {
  const map = new Map<number, THREE.Texture>()
  await Promise.all(
    walkers.map(async (w) => {
      try {
        const tex = await loadAvatarFaceTexture({ name: w.faceSeed }, w.faceSeed, w.skin)
        map.set(w.id, tex)
      } catch {
        /* skin sólido como fallback */
      }
    })
  )
  return map
}

function Mat({ color }: { color: string }) {
  return <meshToonMaterial color={color} gradientMap={toonGrad} />
}

function Hair({ style, color, headR }: { style: ParadeWalker["hairStyle"]; color: string; headR: number }) {
  if (style === "bald") return null
  const up = headR * 0.3
  if (style === "long") {
    return (
      <group>
        <mesh geometry={GEO.hairCap} scale={[headR * 1.1, headR * 0.9, headR * 1.05]} position={[0, up, -headR * 0.05]}>
          <Mat color={color} />
        </mesh>
        <mesh geometry={GEO.limb} scale={[headR * 0.5, headR * 0.55, headR * 0.3]} position={[0, -headR * 0.25, -headR * 0.35]}>
          <Mat color={color} />
        </mesh>
      </group>
    )
  }
  if (style === "curly") {
    return (
      <group>
        {[0, 0.5, -0.5, 0.35, -0.35].map((x, i) => (
          <mesh key={i} geometry={GEO.hairBall} scale={headR * 0.38} position={[x * headR, up + headR * 0.15, (i % 2) * -0.15 * headR]}>
            <Mat color={color} />
          </mesh>
        ))}
      </group>
    )
  }
  if (style === "bun") {
    return (
      <group>
        <mesh geometry={GEO.hairCap} scale={[headR * 1.05, headR * 0.85, headR]} position={[0, up, -headR * 0.05]}>
          <Mat color={color} />
        </mesh>
        <mesh geometry={GEO.hairBall} scale={headR * 0.4} position={[0, headR * 1.05, 0]}>
          <Mat color={color} />
        </mesh>
      </group>
    )
  }
  return (
    <mesh geometry={GEO.hairCap} scale={[headR * 1.05, headR * 0.85, headR * 1.02]} position={[0, up, -headR * 0.05]}>
      <Mat color={color} />
    </mesh>
  )
}

function ParadeMii({
  w,
  preloadedFace,
  reveal,
}: {
  w: ParadeWalker
  preloadedFace?: THREE.Texture | null
  /** Cuando true, arranca el fade-in escalonado */
  reveal: boolean
}) {
  const root = useRef<THREE.Group>(null)
  const lArm = useRef<THREE.Group>(null)
  const rArm = useRef<THREE.Group>(null)
  const lLeg = useRef<THREE.Group>(null)
  const rLeg = useRef<THREE.Group>(null)
  const [faceMap, setFaceMap] = useState<THREE.Texture | null>(preloadedFace ?? null)
  const appearT = useRef(0)
  /** Stagger de entrada (s) */
  const appearDelay = 0.05 + w.id * 0.09

  const ai = useRef({
    x: w.startX,
    z: w.startZ,
    yaw: seeded01(w.id * 9.1) * Math.PI * 2,
    targetX: w.startX,
    targetZ: w.startZ,
    walking: true as boolean,
    timer: w.walkDur * 0.3 + (w.phase % 2),
    walkPhase: w.phase,
    targetInit: false as boolean,
  })
  if (!ai.current.targetInit) {
    const t0 = seededInRing(w.id + 40)
    ai.current.targetX = t0.x
    ai.current.targetZ = t0.z
    ai.current.targetInit = true
  }

  // Cara: usa precarga o carga en caliente (caché compartida)
  useEffect(() => {
    if (preloadedFace) {
      setFaceMap(preloadedFace)
      return
    }
    let cancelled = false
    loadAvatarFaceTexture({ name: w.faceSeed }, w.faceSeed, w.skin)
      .then((tex) => {
        if (!cancelled) setFaceMap(tex)
      })
      .catch(() => {
        if (!cancelled) setFaceMap(null)
      })
    return () => {
      cancelled = true
    }
  }, [w.faceSeed, w.skin, preloadedFace])

  const s = w.scale
  const headR = 0.28 * s
  const torsoH = 0.2 * s
  const torsoR = 0.11 * s
  const hipR = 0.1 * s
  const armLen = 0.14 * s
  const armR = 0.035 * s
  const legLen = 0.16 * s
  const legR = 0.045 * s
  const hipY = legLen + 0.02
  const torsoY = hipY + torsoH * 0.35
  const headY = hipY + torsoH + headR * 0.85
  const shoulderW = 0.18 * s

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const a = ai.current

    // Entrada suave: escala + subida desde el suelo (escalonada por id)
    if (reveal) {
      appearT.current += dt
    }
    const raw = (appearT.current - appearDelay) / 0.65
    const appear = easeOutCubic(raw)
    // Solo animar movimiento cuando ya es visible (ahorra trabajo al inicio)
    const canWalk = appear > 0.4

    if (canWalk) {
      a.timer -= dt

      if (a.timer <= 0) {
        if (a.walking) {
          a.walking = false
          a.timer = w.restDur * (0.7 + Math.random() * 0.6)
        } else {
          a.walking = true
          const next = randomInRing()
          a.targetX = next.x
          a.targetZ = next.z
          a.timer = w.walkDur * (0.85 + Math.random() * 0.5)
        }
      }

      if (a.walking) {
        const dx = a.targetX - a.x
        const dz = a.targetZ - a.z
        const dist = Math.hypot(dx, dz)
        if (dist < 0.18) {
          if (Math.random() < 0.4) {
            a.walking = false
            a.timer = w.restDur * (0.6 + Math.random() * 0.5)
          } else {
            const next = randomInRing()
            a.targetX = next.x
            a.targetZ = next.z
            a.timer = w.walkDur * (0.7 + Math.random() * 0.5)
          }
        } else {
          const desired = Math.atan2(dx, dz)
          let dyaw = desired - a.yaw
          while (dyaw > Math.PI) dyaw -= Math.PI * 2
          while (dyaw < -Math.PI) dyaw += Math.PI * 2
          a.yaw += dyaw * Math.min(1, 4.5 * dt)
          const stepped = stepInRing(a.x, a.z, a.yaw, w.speed, dt, a.targetX, a.targetZ)
          a.x = stepped.x
          a.z = stepped.z
          a.yaw = stepped.yaw
          a.walkPhase += dt * 5.2
        }
      } else {
        const clamped = clampToRing(a.x, a.z)
        a.x = clamped.x
        a.z = clamped.z
      }
    }

    const swing = a.walking && canWalk ? Math.sin(a.walkPhase) : Math.sin(a.walkPhase * 0.3) * 0.08
    const bob = a.walking && canWalk ? Math.abs(Math.sin(a.walkPhase)) * 0.02 : Math.sin(a.walkPhase * 0.4) * 0.006
    const yOff = (1 - appear) * -0.35 + bob

    if (root.current) {
      root.current.position.set(a.x, yOff, a.z)
      root.current.rotation.y = a.yaw
      const sc = 0.001 + appear * 0.999
      root.current.scale.setScalar(sc)
      root.current.visible = appear > 0.02
    }
    if (lLeg.current && rLeg.current) {
      const amp = a.walking && canWalk ? 0.48 : 0.03
      lLeg.current.rotation.x = swing * amp
      rLeg.current.rotation.x = -swing * amp
    }
    if (lArm.current && rArm.current) {
      const amp = a.walking && canWalk ? 0.38 : 0.06
      lArm.current.rotation.x = -swing * amp
      rArm.current.rotation.x = swing * amp
      lArm.current.rotation.z = 0.35
      rArm.current.rotation.z = -0.35
    }
  })

  return (
    <group ref={root} scale={0.001} visible={false}>
      <group ref={lLeg} position={[-hipR * 0.45, hipY, 0]}>
        <mesh geometry={GEO.limb} scale={[legR, legLen * 0.35, legR]} position={[0, -legLen * 0.5, 0]}>
          <Mat color={w.pants} />
        </mesh>
        <mesh geometry={GEO.shoe} scale={[legR * 1.4, legR * 0.85, legR * 1.7]} position={[0, -legLen + legR * 0.6, legR * 0.25]}>
          <Mat color={w.shoes} />
        </mesh>
      </group>
      <group ref={rLeg} position={[hipR * 0.45, hipY, 0]}>
        <mesh geometry={GEO.limb} scale={[legR, legLen * 0.35, legR]} position={[0, -legLen * 0.5, 0]}>
          <Mat color={w.pants} />
        </mesh>
        <mesh geometry={GEO.shoe} scale={[legR * 1.4, legR * 0.85, legR * 1.7]} position={[0, -legLen + legR * 0.6, legR * 0.25]}>
          <Mat color={w.shoes} />
        </mesh>
      </group>

      <mesh geometry={GEO.hip} scale={[hipR * 1.05, hipR * 0.8, hipR * 0.9]} position={[0, hipY, 0]}>
        <Mat color={w.pants} />
      </mesh>
      <mesh geometry={GEO.torso} scale={[torsoR, torsoH * 0.32, torsoR * 0.85]} position={[0, torsoY, 0]}>
        <Mat color={w.shirt} />
      </mesh>

      <group ref={lArm} position={[-shoulderW * 0.7, hipY + torsoH * 0.5, 0]}>
        <mesh geometry={GEO.limb} scale={[armR, armLen * 0.35, armR]} position={[0, -armLen * 0.3, 0]}>
          <Mat color={w.shirt} />
        </mesh>
        <mesh geometry={GEO.hip} scale={armR * 1.2} position={[0, -armLen * 0.65, 0]}>
          <Mat color={w.skin} />
        </mesh>
      </group>
      <group ref={rArm} position={[shoulderW * 0.7, hipY + torsoH * 0.5, 0]}>
        <mesh geometry={GEO.limb} scale={[armR, armLen * 0.35, armR]} position={[0, -armLen * 0.3, 0]}>
          <Mat color={w.shirt} />
        </mesh>
        <mesh geometry={GEO.hip} scale={armR * 1.2} position={[0, -armLen * 0.65, 0]}>
          <Mat color={w.skin} />
        </mesh>
      </group>

      <group position={[0, headY, 0]}>
        {/* Cabeza con cara DiceBear aleatoria (piel + avatar) */}
        <mesh geometry={HEAD_GEO} scale={headR}>
          {faceMap ? (
            <meshStandardMaterial map={faceMap} color="#ffffff" roughness={0.72} metalness={0} />
          ) : (
            <Mat color={w.skin} />
          )}
        </mesh>
        <mesh geometry={GEO.ear} scale={headR * 0.2} position={[-headR * 0.92, 0, 0]}>
          <Mat color={w.skin} />
        </mesh>
        <mesh geometry={GEO.ear} scale={headR * 0.2} position={[headR * 0.92, 0, 0]}>
          <Mat color={w.skin} />
        </mesh>
        <Hair style={w.hairStyle} color={w.hair} headR={headR} />
      </group>
    </group>
  )
}

/** Opacidades objetivo del suelo (estado final) */
const FLOOR_OP = {
  base: 0.35,
  ring: 0.9,
  outer: 0.4,
  inner: 0.35,
  shadow: 0.14,
} as const

function StageFloor({ reveal }: { reveal: boolean }) {
  const group = useRef<THREE.Group>(null)
  const baseMat = useRef<THREE.MeshStandardMaterial>(null)
  const ringMat = useRef<THREE.MeshStandardMaterial>(null)
  const outerMat = useRef<THREE.MeshBasicMaterial>(null)
  const innerMat = useRef<THREE.MeshBasicMaterial>(null)
  const appearT = useRef(0)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    if (reveal) {
      // Un poco antes que los Miis (delay ~0) y duración similar
      appearT.current = Math.min(1, appearT.current + dt / 0.75)
    }
    const a = easeOutCubic(appearT.current)

    if (group.current) {
      // Crece desde el centro + sube levemente del “suelo”
      const sc = 0.55 + a * 0.45
      group.current.scale.set(sc, 1, sc)
      group.current.position.y = (1 - a) * -0.12
      group.current.visible = a > 0.02
    }
    if (baseMat.current) baseMat.current.opacity = FLOOR_OP.base * a
    if (ringMat.current) ringMat.current.opacity = FLOOR_OP.ring * a
    if (outerMat.current) outerMat.current.opacity = FLOOR_OP.outer * a
    if (innerMat.current) innerMat.current.opacity = FLOOR_OP.inner * a
  })

  return (
    <group ref={group} scale={[0.55, 1, 0.55]} position={[0, -0.12, 0]} visible={false}>
      {/* Suelo base suave (centro vacío visualmente = donut) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[RING_OUTER + 1.1, 64]} />
        <meshStandardMaterial
          ref={baseMat}
          color="#f1f5f9"
          roughness={0.96}
          metalness={0}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      {/* Donut visible: única zona de paseo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
        <ringGeometry args={[RING_INNER, RING_OUTER, 80]} />
        <meshStandardMaterial
          ref={ringMat}
          color="#eef2ff"
          roughness={0.94}
          metalness={0}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      {/* Borde exterior e interior del anillo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <ringGeometry args={[RING_OUTER, RING_OUTER + 0.1, 80]} />
        <meshBasicMaterial ref={outerMat} color="#a5b4fc" transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <ringGeometry args={[RING_INNER - 0.1, RING_INNER, 80]} />
        <meshBasicMaterial ref={innerMat} color="#c4b5fd" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

function FloorContactShadows({ reveal }: { reveal: boolean }) {
  // ContactShadows (frames=1) no anima bien: montar con un pequeño delay al revelar
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (!reveal) {
      setShow(false)
      return
    }
    const t = window.setTimeout(() => setShow(true), 280)
    return () => window.clearTimeout(t)
  }, [reveal])

  if (!show) return null
  return (
    <ContactShadows
      position={[0, 0, 0]}
      opacity={FLOOR_OP.shadow}
      scale={18}
      blur={2.8}
      far={5}
      resolution={256}
      frames={1}
    />
  )
}

function ParadeScene({
  walkers,
  faces,
  reveal,
}: {
  walkers: ParadeWalker[]
  faces: Map<number, THREE.Texture>
  reveal: boolean
}) {
  return (
    <>
      <color attach="background" args={["transparent"]} />
      <ambientLight intensity={1.25} />
      <hemisphereLight args={["#ffffff", "#eef2ff", 0.7]} />
      <directionalLight position={[4, 9, 5]} intensity={1.1} castShadow={false} color="#ffffff" />
      <directionalLight position={[-3, 5, -2]} intensity={0.4} color="#c7d2fe" />
      <StageFloor reveal={reveal} />
      {walkers.map((w) => (
        <ParadeMii key={w.id} w={w} preloadedFace={faces.get(w.id) ?? null} reveal={reveal} />
      ))}
      <FloorContactShadows reveal={reveal} />
    </>
  )
}

type LandingMiiParadeProps = {
  className?: string
  /** "hero" = escenario grande protagonista */
  variant?: "strip" | "hero"
}

const WALKER_COUNT = 8

export default function LandingMiiParade({ className = "", variant = "hero" }: LandingMiiParadeProps) {
  const isHero = variant === "hero"
  const walkers = useMemo(() => buildWalkers(WALKER_COUNT), [])
  const [faces, setFaces] = useState<Map<number, THREE.Texture>>(() => new Map())
  const [assetsReady, setAssetsReady] = useState(false)
  const [glReady, setGlReady] = useState(false)
  const [reveal, setReveal] = useState(false)

  // Precarga caras en paralelo (antes / durante montaje del canvas)
  useEffect(() => {
    let cancelled = false
    const safety = window.setTimeout(() => {
      if (!cancelled) setAssetsReady(true)
    }, 2200)

    preloadParadeFaces(walkers).then((map) => {
      if (cancelled) return
      setFaces(map)
      setAssetsReady(true)
      window.clearTimeout(safety)
    })

    return () => {
      cancelled = true
      window.clearTimeout(safety)
    }
  }, [walkers])

  // Reveal solo cuando caras + WebGL están listos → transición profesional
  useEffect(() => {
    if (!assetsReady || !glReady || reveal) return
    const id = window.requestAnimationFrame(() => {
      // un frame extra para que el primer paint del canvas no sea vacío
      window.requestAnimationFrame(() => setReveal(true))
    })
    return () => window.cancelAnimationFrame(id)
  }, [assetsReady, glReady, reveal])

  return (
    <div
      className={
        className ||
        (isHero
          ? "pointer-events-none absolute inset-0 z-[1]"
          : "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[240px]")
      }
      aria-hidden
    >
      {/* Placeholder suave mientras carga (evita “pop” brusco) */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-out ${
          reveal ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_70%,hsl(var(--primary)/0.07),transparent_65%)]" />
        <div className="absolute left-1/2 top-[58%] h-[42%] w-[78%] -translate-x-1/2 rounded-[100%] bg-primary/[0.04] blur-3xl animate-pulse" />
      </div>

      {isHero && (
        <>
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-background/50 via-transparent to-background/40" />
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-background/25 via-transparent to-background/25" />
        </>
      )}
      {!isHero && <div className="absolute inset-0 z-10 bg-gradient-to-t from-background/50 via-transparent to-transparent" />}

      <div
        className={`absolute inset-0 transition-opacity duration-[1100ms] ease-out ${
          reveal ? "opacity-100" : "opacity-0"
        }`}
      >
        <Canvas
          dpr={[1, 1.35]}
          camera={{
            position: isHero ? [0, 2.4, 9.5] : [0, 1.1, 7.5],
            fov: isHero ? 36 : 38,
            near: 0.1,
            far: 50,
          }}
          gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
          style={{ background: "transparent" }}
          onCreated={() => setGlReady(true)}
        >
          <Suspense fallback={null}>
            <ParadeScene walkers={walkers} faces={faces} reveal={reveal} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  )
}
