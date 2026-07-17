"use client"

/**
 * Personaje humanoide modular de media fidelidad (estilizado realista).
 * Anatomía por partes, cara, peinados y ropa por capas — recolorable por perfil.
 */
import React, { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import * as THREE from "three"
import type { BotProfile } from "@/lib/types"
import { resolveAppearance, bodyScale, genderShape, type ResolvedAppearance } from "@/lib/appearance-utils"

type Layout = "personality" | "circle" | "grid"

function matProps(color: string, opts?: { roughness?: number; metalness?: number; flat?: boolean }) {
  return {
    color,
    roughness: opts?.roughness ?? 0.65,
    metalness: opts?.metalness ?? 0.05,
    flatShading: opts?.flat ?? false,
  }
}

function Hair({
  style,
  color,
  headR,
  y,
}: {
  style: string
  color: string
  headR: number
  y: number
}) {
  if (style === "bald") return null

  const hairMat = matProps(color, { roughness: 0.92, metalness: 0.02 })

  if (style === "short") {
    return (
      <group position={[0, y + headR * 0.15, 0]}>
        <mesh castShadow position={[0, headR * 0.25, -0.01]}>
          <sphereGeometry args={[headR * 1.02, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial {...hairMat} side={THREE.DoubleSide} />
        </mesh>
        {/* sideburns / fringe */}
        <mesh castShadow position={[0, headR * 0.05, headR * 0.55]}>
          <boxGeometry args={[headR * 1.1, headR * 0.28, headR * 0.25]} />
          <meshStandardMaterial {...hairMat} />
        </mesh>
      </group>
    )
  }

  if (style === "medium") {
    return (
      <group position={[0, y, 0]}>
        <mesh castShadow position={[0, headR * 0.35, -0.02]}>
          <sphereGeometry args={[headR * 1.12, 22, 18]} />
          <meshStandardMaterial {...hairMat} />
        </mesh>
        <mesh castShadow position={[0, -headR * 0.15, -headR * 0.15]}>
          <sphereGeometry args={[headR * 1.05, 16, 12]} />
          <meshStandardMaterial {...hairMat} />
        </mesh>
      </group>
    )
  }

  if (style === "long") {
    return (
      <group position={[0, y, 0]}>
        <mesh castShadow position={[0, headR * 0.3, -0.02]}>
          <sphereGeometry args={[headR * 1.15, 22, 18]} />
          <meshStandardMaterial {...hairMat} />
        </mesh>
        <mesh castShadow position={[0, -headR * 0.55, -headR * 0.2]}>
          <capsuleGeometry args={[headR * 0.55, headR * 1.1, 6, 12]} />
          <meshStandardMaterial {...hairMat} />
        </mesh>
        <mesh castShadow position={[-headR * 0.35, -headR * 0.7, -headR * 0.1]} rotation={[0.2, 0, 0.15]}>
          <capsuleGeometry args={[headR * 0.22, headR * 0.9, 4, 8]} />
          <meshStandardMaterial {...hairMat} />
        </mesh>
        <mesh castShadow position={[headR * 0.35, -headR * 0.7, -headR * 0.1]} rotation={[0.2, 0, -0.15]}>
          <capsuleGeometry args={[headR * 0.22, headR * 0.9, 4, 8]} />
          <meshStandardMaterial {...hairMat} />
        </mesh>
      </group>
    )
  }

  if (style === "curly") {
    const curls = [
      [0, 0.35, 0],
      [-0.35, 0.2, 0.2],
      [0.35, 0.2, 0.2],
      [-0.25, 0.1, -0.3],
      [0.25, 0.1, -0.3],
      [0, -0.05, -0.4],
      [-0.4, 0.05, 0],
      [0.4, 0.05, 0],
    ] as const
    return (
      <group position={[0, y, 0]}>
        {curls.map(([x, cy, z], i) => (
          <mesh key={i} castShadow position={[x * headR, cy * headR, z * headR]}>
            <sphereGeometry args={[headR * (0.42 + (i % 3) * 0.06), 12, 10]} />
            <meshStandardMaterial {...hairMat} />
          </mesh>
        ))}
      </group>
    )
  }

  if (style === "ponytail") {
    return (
      <group position={[0, y, 0]}>
        <mesh castShadow position={[0, headR * 0.3, 0]}>
          <sphereGeometry args={[headR * 1.08, 20, 16]} />
          <meshStandardMaterial {...hairMat} />
        </mesh>
        <mesh castShadow position={[0, headR * 0.15, -headR * 0.85]} rotation={[0.9, 0, 0]}>
          <capsuleGeometry args={[headR * 0.22, headR * 0.95, 6, 10]} />
          <meshStandardMaterial {...hairMat} />
        </mesh>
        <mesh castShadow position={[0, headR * 0.35, -headR * 0.55]}>
          <sphereGeometry args={[headR * 0.28, 10, 10]} />
          <meshStandardMaterial {...hairMat} />
        </mesh>
      </group>
    )
  }

  if (style === "bun") {
    return (
      <group position={[0, y, 0]}>
        <mesh castShadow position={[0, headR * 0.28, 0]}>
          <sphereGeometry args={[headR * 1.05, 18, 14]} />
          <meshStandardMaterial {...hairMat} />
        </mesh>
        <mesh castShadow position={[0, headR * 0.95, -headR * 0.1]}>
          <sphereGeometry args={[headR * 0.45, 14, 12]} />
          <meshStandardMaterial {...hairMat} />
        </mesh>
      </group>
    )
  }

  return (
    <mesh castShadow position={[0, y + headR * 0.25, 0]}>
      <sphereGeometry args={[headR * 1.08, 18, 14]} />
      <meshStandardMaterial {...hairMat} />
    </mesh>
  )
}

function Face({
  headR,
  app,
}: {
  headR: number
  app: ResolvedAppearance
}) {
  const eyeY = headR * 0.08
  const eyeZ = headR * 0.78
  const eyeX = headR * 0.32
  const eyeW = headR * 0.14
  const eyeH = headR * 0.1

  return (
    <group>
      {/* Ears */}
      <mesh castShadow position={[-headR * 0.92, 0, 0]} rotation={[0, 0, 0.2]}>
        <sphereGeometry args={[headR * 0.22, 10, 8]} />
        <meshStandardMaterial {...matProps(app.skin_hex, { roughness: 0.78 })} />
      </mesh>
      <mesh castShadow position={[headR * 0.92, 0, 0]} rotation={[0, 0, -0.2]}>
        <sphereGeometry args={[headR * 0.22, 10, 8]} />
        <meshStandardMaterial {...matProps(app.skin_hex, { roughness: 0.78 })} />
      </mesh>

      {/* Eye whites */}
      <mesh position={[-eyeX, eyeY, eyeZ]}>
        <sphereGeometry args={[eyeW, 12, 10]} />
        <meshStandardMaterial color="#f5f5f4" roughness={0.35} />
      </mesh>
      <mesh position={[eyeX, eyeY, eyeZ]}>
        <sphereGeometry args={[eyeW, 12, 10]} />
        <meshStandardMaterial color="#f5f5f4" roughness={0.35} />
      </mesh>

      {/* Iris */}
      <mesh position={[-eyeX, eyeY, eyeZ + eyeW * 0.55]}>
        <sphereGeometry args={[eyeH * 0.85, 12, 10]} />
        <meshStandardMaterial color={app.eye_color} roughness={0.25} metalness={0.15} />
      </mesh>
      <mesh position={[eyeX, eyeY, eyeZ + eyeW * 0.55]}>
        <sphereGeometry args={[eyeH * 0.85, 12, 10]} />
        <meshStandardMaterial color={app.eye_color} roughness={0.25} metalness={0.15} />
      </mesh>

      {/* Pupils */}
      <mesh position={[-eyeX, eyeY, eyeZ + eyeW * 0.85]}>
        <sphereGeometry args={[eyeH * 0.4, 8, 8]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.2} />
      </mesh>
      <mesh position={[eyeX, eyeY, eyeZ + eyeW * 0.85]}>
        <sphereGeometry args={[eyeH * 0.4, 8, 8]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.2} />
      </mesh>

      {/* Brows */}
      <mesh position={[-eyeX, eyeY + headR * 0.18, eyeZ + 0.01]} rotation={[0, 0, 0.12]}>
        <boxGeometry args={[eyeW * 1.6, headR * 0.04, headR * 0.06]} />
        <meshStandardMaterial {...matProps(app.hair_hex, { roughness: 0.9 })} />
      </mesh>
      <mesh position={[eyeX, eyeY + headR * 0.18, eyeZ + 0.01]} rotation={[0, 0, -0.12]}>
        <boxGeometry args={[eyeW * 1.6, headR * 0.04, headR * 0.06]} />
        <meshStandardMaterial {...matProps(app.hair_hex, { roughness: 0.9 })} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, -headR * 0.05, headR * 0.9]} rotation={[0.25, 0, 0]}>
        <coneGeometry args={[headR * 0.1, headR * 0.28, 8]} />
        <meshStandardMaterial {...matProps(app.skin_hex, { roughness: 0.72 })} />
      </mesh>

      {/* Mouth */}
      <mesh position={[0, -headR * 0.32, headR * 0.78]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[headR * 0.28, headR * 0.06, headR * 0.08]} />
        <meshStandardMaterial color={app.lip_color} roughness={0.55} />
      </mesh>

      {/* Soft cheek volume */}
      <mesh position={[-headR * 0.45, -headR * 0.15, headR * 0.45]}>
        <sphereGeometry args={[headR * 0.28, 10, 8]} />
        <meshStandardMaterial {...matProps(app.skin_hex, { roughness: 0.8 })} transparent opacity={0.35} />
      </mesh>
      <mesh position={[headR * 0.45, -headR * 0.15, headR * 0.45]}>
        <sphereGeometry args={[headR * 0.28, 10, 8]} />
        <meshStandardMaterial {...matProps(app.skin_hex, { roughness: 0.8 })} transparent opacity={0.35} />
      </mesh>
    </group>
  )
}

function Limb({
  length,
  radius,
  color,
  roughness = 0.7,
}: {
  length: number
  radius: number
  color: string
  roughness?: number
}) {
  return (
    <mesh castShadow position={[0, -length / 2, 0]}>
      <capsuleGeometry args={[radius, Math.max(0.01, length - radius * 2), 6, 10]} />
      <meshStandardMaterial {...matProps(color, { roughness })} />
    </mesh>
  )
}

export function HumanoidCharacter({
  bot,
  index,
  total,
  selected,
  onClick,
  layout,
  position,
}: {
  bot: BotProfile
  index: number
  total: number
  selected: boolean
  onClick: () => void
  layout: Layout
  position: [number, number, number]
}) {
  const root = useRef<THREE.Group>(null)
  const torsoRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  const lArmRef = useRef<THREE.Group>(null)
  const rArmRef = useRef<THREE.Group>(null)
  const lLegRef = useRef<THREE.Group>(null)
  const rLegRef = useRef<THREE.Group>(null)

  const app = useMemo(() => resolveAppearance(bot), [bot])
  const scale = useMemo(() => bodyScale(app.body_type), [app.body_type])
  const gShape = useMemo(() => genderShape(app.gender), [app.gender])

  // Proportions relative to height (meters ≈ scene units)
  const s = app.height / 1.75
  const headR = 0.105 * s
  const neckH = 0.055 * s
  const torsoH = 0.38 * s * scale.torso
  const shoulderW = 0.28 * s * scale.shoulders * gShape.shoulderMul
  const hipW = 0.22 * s * scale.hips * gShape.hipMul
  const chestD = 0.14 * s * scale.chest * gShape.chestMul
  const waistW = 0.16 * s * gShape.waistMul
  const upperLeg = 0.32 * s * scale.limbs
  const lowerLeg = 0.3 * s * scale.limbs
  const upperArm = 0.24 * s * scale.limbs
  const lowerArm = 0.22 * s * scale.limbs
  const armR = 0.038 * s * scale.limbs
  const legR = 0.052 * s * scale.limbs

  const hipY = lowerLeg + upperLeg
  const shoulderY = hipY + torsoH
  const headY = shoulderY + neckH + headR

  // Clothing colors by style accents
  const shirtColor = app.primary_color
  const accentColor = app.secondary_color
  const isFormal = app.clothing_style === "formal"
  const isSporty = app.clothing_style === "sporty"

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const phase = t * (0.9 + app.energy * 0.8) + index * 0.7
    const breath = 1 + Math.sin(t * 1.6 + index) * 0.012

    if (root.current) {
      // weight shift
      root.current.rotation.y = Math.sin(phase * 0.35) * 0.06 * app.energy
      root.current.position.y = position[1] + Math.sin(phase * 0.5) * 0.008
      if (selected) {
        root.current.scale.setScalar(1.04 + Math.sin(t * 2.5) * 0.015)
      } else {
        root.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.12)
      }
    }
    if (torsoRef.current) {
      torsoRef.current.scale.y = breath
      torsoRef.current.rotation.x = Math.sin(phase * 0.4) * 0.02
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(phase * 0.25) * 0.18 * app.energy
      headRef.current.rotation.x = Math.sin(phase * 0.2) * 0.05
    }
    if (lArmRef.current && rArmRef.current) {
      const swing = Math.sin(phase) * 0.12 * app.energy
      lArmRef.current.rotation.x = swing
      rArmRef.current.rotation.x = -swing
      lArmRef.current.rotation.z = 0.22 + Math.sin(phase * 0.5) * 0.04
      rArmRef.current.rotation.z = -0.22 - Math.sin(phase * 0.5) * 0.04
    }
    if (lLegRef.current && rLegRef.current) {
      const legSwing = Math.sin(phase * 0.5) * 0.03 * app.energy
      lLegRef.current.rotation.x = legSwing
      rLegRef.current.rotation.x = -legSwing
    }
  })

  const labelY = headY + headR + 0.22 * s

  return (
    <group
      ref={root}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer"
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto"
      }}
    >
      {/* Selection halo */}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <ringGeometry args={[0.32 * s, 0.4 * s, 48]} />
          <meshBasicMaterial color="#6366f1" transparent opacity={0.9} />
        </mesh>
      )}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <circleGeometry args={[0.28 * s, 32]} />
          <meshBasicMaterial color="#818cf8" transparent opacity={0.18} />
        </mesh>
      )}

      {/* —— Legs —— */}
      <group ref={lLegRef} position={[-hipW * 0.35, hipY, 0]}>
        {/* Thigh (pants) */}
        <Limb length={upperLeg} radius={legR * 1.15} color={app.pants_color} roughness={0.85} />
        {/* Calf */}
        <group position={[0, -upperLeg, 0]}>
          <Limb length={lowerLeg * 0.85} radius={legR * 0.9} color={app.pants_color} roughness={0.85} />
          {/* Shoe */}
          <mesh castShadow position={[0, -lowerLeg + 0.02 * s, 0.03 * s]}>
            <boxGeometry args={[legR * 2.2, 0.045 * s, legR * 3.2]} />
            <meshStandardMaterial {...matProps(app.shoe_color, { roughness: 0.55, metalness: 0.15 })} />
          </mesh>
        </group>
      </group>

      <group ref={rLegRef} position={[hipW * 0.35, hipY, 0]}>
        <Limb length={upperLeg} radius={legR * 1.15} color={app.pants_color} roughness={0.85} />
        <group position={[0, -upperLeg, 0]}>
          <Limb length={lowerLeg * 0.85} radius={legR * 0.9} color={app.pants_color} roughness={0.85} />
          <mesh castShadow position={[0, -lowerLeg + 0.02 * s, 0.03 * s]}>
            <boxGeometry args={[legR * 2.2, 0.045 * s, legR * 3.2]} />
            <meshStandardMaterial {...matProps(app.shoe_color, { roughness: 0.55, metalness: 0.15 })} />
          </mesh>
        </group>
      </group>

      {/* —— Hips / pelvis —— */}
      <mesh castShadow position={[0, hipY, 0]}>
        <sphereGeometry args={[hipW * 0.55, 14, 12]} />
        <meshStandardMaterial {...matProps(app.pants_color, { roughness: 0.85 })} />
      </mesh>

      {/* —— Torso —— */}
      <group ref={torsoRef} position={[0, hipY, 0]}>
        {/* Waist */}
        <mesh castShadow position={[0, torsoH * 0.22, 0]}>
          <capsuleGeometry args={[waistW * 0.55, torsoH * 0.2, 6, 12]} />
          <meshStandardMaterial {...matProps(shirtColor, { roughness: 0.7 })} />
        </mesh>
        {/* Chest */}
        <mesh castShadow position={[0, torsoH * 0.55, 0]}>
          <capsuleGeometry args={[shoulderW * 0.42, torsoH * 0.28, 8, 14]} />
          <meshStandardMaterial {...matProps(shirtColor, { roughness: 0.65 })} />
        </mesh>
        {/* Chest depth plate */}
        <mesh castShadow position={[0, torsoH * 0.55, chestD * 0.35]}>
          <boxGeometry args={[shoulderW * 0.7, torsoH * 0.35, chestD * 0.5]} />
          <meshStandardMaterial {...matProps(shirtColor, { roughness: 0.68 })} />
        </mesh>

        {/* Collar / accent */}
        <mesh castShadow position={[0, torsoH * 0.88, chestD * 0.15]}>
          <boxGeometry args={[shoulderW * 0.55, 0.04 * s, chestD * 0.5]} />
          <meshStandardMaterial {...matProps(isFormal ? "#f8fafc" : accentColor, { roughness: 0.6 })} />
        </mesh>

        {/* Sporty stripe */}
        {isSporty && (
          <mesh castShadow position={[0, torsoH * 0.5, chestD * 0.55]}>
            <boxGeometry args={[shoulderW * 0.15, torsoH * 0.5, 0.02 * s]} />
            <meshStandardMaterial {...matProps(accentColor, { roughness: 0.5 })} />
          </mesh>
        )}

        {/* Shoulders */}
        <mesh castShadow position={[-shoulderW * 0.55, torsoH * 0.82, 0]}>
          <sphereGeometry args={[armR * 1.8, 12, 10]} />
          <meshStandardMaterial {...matProps(shirtColor, { roughness: 0.7 })} />
        </mesh>
        <mesh castShadow position={[shoulderW * 0.55, torsoH * 0.82, 0]}>
          <sphereGeometry args={[armR * 1.8, 12, 10]} />
          <meshStandardMaterial {...matProps(shirtColor, { roughness: 0.7 })} />
        </mesh>
      </group>

      {/* —— Arms —— */}
      <group ref={lArmRef} position={[-shoulderW * 0.62, shoulderY - 0.02 * s, 0]} rotation={[0, 0, 0.25]}>
        <Limb length={upperArm} radius={armR * 1.15} color={shirtColor} roughness={0.7} />
        <group position={[0, -upperArm, 0]} rotation={[0, 0, 0.08]}>
          <Limb length={lowerArm} radius={armR} color={app.skin_hex} roughness={0.78} />
          {/* Hand */}
          <mesh castShadow position={[0, -lowerArm - 0.02 * s, 0]}>
            <sphereGeometry args={[armR * 1.15, 10, 8]} />
            <meshStandardMaterial {...matProps(app.skin_hex, { roughness: 0.78 })} />
          </mesh>
        </group>
      </group>

      <group ref={rArmRef} position={[shoulderW * 0.62, shoulderY - 0.02 * s, 0]} rotation={[0, 0, -0.25]}>
        <Limb length={upperArm} radius={armR * 1.15} color={shirtColor} roughness={0.7} />
        <group position={[0, -upperArm, 0]} rotation={[0, 0, -0.08]}>
          <Limb length={lowerArm} radius={armR} color={app.skin_hex} roughness={0.78} />
          <mesh castShadow position={[0, -lowerArm - 0.02 * s, 0]}>
            <sphereGeometry args={[armR * 1.15, 10, 8]} />
            <meshStandardMaterial {...matProps(app.skin_hex, { roughness: 0.78 })} />
          </mesh>
        </group>
      </group>

      {/* —— Neck + Head —— */}
      <group ref={headRef} position={[0, shoulderY, 0]}>
        <mesh castShadow position={[0, neckH * 0.5, 0]}>
          <cylinderGeometry args={[headR * 0.35, headR * 0.42, neckH, 12]} />
          <meshStandardMaterial {...matProps(app.skin_hex, { roughness: 0.75 })} />
        </mesh>

        <group position={[0, neckH + headR * 0.85, 0]}>
          {/* Skull */}
          <mesh castShadow>
            <sphereGeometry args={[headR, 28, 22]} />
            <meshStandardMaterial {...matProps(app.skin_hex, { roughness: 0.72 })} />
          </mesh>
          {/* Jaw slightly elongated */}
          <mesh castShadow position={[0, -headR * 0.35, headR * 0.15]} scale={[0.85, 0.7, 0.75]}>
            <sphereGeometry args={[headR * 0.75, 16, 12]} />
            <meshStandardMaterial {...matProps(app.skin_hex, { roughness: 0.74 })} />
          </mesh>

          <Face headR={headR} app={app} />
          <Hair style={app.hair_style} color={app.hair_hex} headR={headR} y={0} />

          {/* Age hint: gray streaks for 55+ */}
          {app.age >= 55 && app.hair_style !== "bald" && (
            <mesh position={[headR * 0.35, headR * 0.4, headR * 0.2]}>
              <sphereGeometry args={[headR * 0.2, 8, 8]} />
              <meshStandardMaterial color="#c4c4c4" roughness={0.95} transparent opacity={0.55} />
            </mesh>
          )}
        </group>
      </group>

      {/* Name label */}
      <Html position={[0, labelY, 0]} center distanceFactor={9} style={{ pointerEvents: "none", userSelect: "none" }}>
        <div
          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap shadow-lg border backdrop-blur-md transition-all ${
            selected
              ? "bg-primary text-primary-foreground border-primary scale-110 shadow-primary/30"
              : "bg-background/90 text-foreground border-border/70"
          }`}
        >
          {bot.name.split(" ")[0]}
          <span className="opacity-65 font-normal"> · {bot.age}</span>
        </div>
      </Html>
    </group>
  )
}

export default HumanoidCharacter
