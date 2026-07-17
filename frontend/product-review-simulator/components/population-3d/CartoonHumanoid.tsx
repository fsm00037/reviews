"use client"

/**
 * Personaje cartoon-realista basado en malla skinned GLB (Mixamo Xbot),
 * sombreado toon y colores por zonas parametrizables.
 */
import React, { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useGLTF, useAnimations, Html } from "@react-three/drei"
import * as THREE from "three"
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js"
import type { BotProfile } from "@/lib/types"
import { resolveAppearance, bodyScale, genderShape } from "@/lib/appearance-utils"
import {
  createToonGradientMap,
  makeZonedToonMaterial,
  type CharacterPalette,
} from "./toonMaterials"

const MODEL_URL = "/models/characters/xbot.glb"

// Preload en módulo
if (typeof window !== "undefined") {
  useGLTF.preload(MODEL_URL)
}

function findBone(root: THREE.Object3D, namePart: string): THREE.Bone | null {
  let found: THREE.Bone | null = null
  root.traverse((obj) => {
    if (found) return
    if ((obj as THREE.Bone).isBone && obj.name.toLowerCase().includes(namePart.toLowerCase())) {
      found = obj as THREE.Bone
    }
  })
  return found
}

function cloneSkinned(source: THREE.Object3D): THREE.Object3D {
  return cloneSkeleton(source)
}

export function CartoonHumanoid({
  bot,
  index,
  selected,
  onClick,
  position,
}: {
  bot: BotProfile
  index: number
  selected: boolean
  onClick: () => void
  position: [number, number, number]
}) {
  const group = useRef<THREE.Group>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  const { scene, animations } = useGLTF(MODEL_URL)
  const gradientMap = useMemo(() => createToonGradientMap(), [])

  const app = useMemo(() => resolveAppearance(bot), [bot])
  const bScale = useMemo(() => bodyScale(app.body_type), [app.body_type])
  const gShape = useMemo(() => genderShape(app.gender), [app.gender])

  const palette: CharacterPalette = useMemo(
    () => ({
      skin: app.skin_hex,
      shirt: app.primary_color,
      pants: app.pants_color,
      shoes: app.shoe_color,
      hair: app.hair_hex,
      accent: app.secondary_color,
    }),
    [app]
  )

  // Clone once per mount
  const character = useMemo(() => {
    const root = cloneSkinned(scene)
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.frustumCulled = false
        // Aplicar material toon zonificado a todas las submallas
        const mat = makeZonedToonMaterial(palette, gradientMap)
        mesh.material = mat
      }
    })
    return root
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clone once; palette applied below
  }, [scene, gradientMap])

  // Actualizar paleta cuando cambian colores (sin re-clonar)
  useEffect(() => {
    character.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m) => {
          if (m instanceof THREE.MeshToonMaterial) {
            // Recrear material con nueva paleta (cache key distinto)
            mesh.material = makeZonedToonMaterial(palette, gradientMap)
          }
        })
      }
    })
  }, [character, palette, gradientMap])

  // Proporciones parametrizables vía huesos + escala raíz
  useEffect(() => {
    const root = character
    // Xbot ~1.7m de alto; normalizar a app.height
    const baseHeight = 1.7
    const uniform = app.height / baseHeight

    root.scale.setScalar(uniform)

    // Cartoon: cabeza ligeramente más grande
    const head = findBone(root, "Head")
    if (head) {
      const headBoost = app.gender === "Female" ? 1.12 : 1.08
      head.scale.setScalar(headBoost)
    }

    // Hombros / torso
    const spine = findBone(root, "Spine")
    const spine1 = findBone(root, "Spine1") || findBone(root, "Spine2")
    const lShoulder = findBone(root, "LeftShoulder")
    const rShoulder = findBone(root, "RightShoulder")
    const hips = findBone(root, "Hips")

    const shoulderMul = bScale.shoulders * gShape.shoulderMul
    const hipMul = bScale.hips * gShape.hipMul
    const chestMul = bScale.chest * gShape.chestMul

    if (lShoulder) lShoulder.scale.set(shoulderMul, 1, chestMul)
    if (rShoulder) rShoulder.scale.set(shoulderMul, 1, chestMul)
    if (spine) spine.scale.set(chestMul * 0.95, 1, chestMul)
    if (spine1) spine1.scale.set(gShape.waistMul * bScale.torso, 1, chestMul * 0.9)
    if (hips) hips.scale.set(hipMul, 1, hipMul * 0.95)

    // Extremidades
    const limbBones = [
      "LeftArm",
      "RightArm",
      "LeftForeArm",
      "RightForeArm",
      "LeftUpLeg",
      "RightUpLeg",
      "LeftLeg",
      "RightLeg",
    ]
    limbBones.forEach((n) => {
      const b = findBone(root, n)
      if (b) b.scale.set(bScale.limbs, 1, bScale.limbs)
    })
  }, [character, app.height, app.gender, bScale, gShape])

  const { actions, mixer } = useAnimations(animations, character)

  // Animación idle / walk según energía
  useEffect(() => {
    if (!actions) return
    const idle = actions["idle"] || actions["Idle"]
    const walk = actions["walk"] || actions["Walk"]
    const sad = actions["sad_pose"]
    const agree = actions["agree"]

    Object.values(actions).forEach((a) => a?.fadeOut(0.2))

    let chosen = idle
    if (selected && agree) chosen = agree
    else if (app.energy > 0.75 && walk) chosen = walk
    else if (app.energy < 0.3 && sad) chosen = sad
    else chosen = idle

    if (chosen) {
      chosen.reset().fadeIn(0.35).play()
      chosen.setLoop(THREE.LoopRepeat, Infinity)
      chosen.setEffectiveTimeScale(0.85 + app.energy * 0.4)
      chosen.setEffectiveWeight(1)
    }

    return () => {
      chosen?.fadeOut(0.2)
    }
  }, [actions, app.energy, selected])

  useFrame((_, delta) => {
    mixer?.update(delta)
    if (!group.current) return
    if (selected) {
      const pulse = 1.03 + Math.sin(performance.now() * 0.004) * 0.015
      group.current.scale.setScalar(pulse)
    } else {
      group.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.12)
    }
  })

  // Orientación: mirar ligeramente al centro de la escena
  const lookYaw = useMemo(() => {
    const [x, , z] = position
    return Math.atan2(x, z) + Math.PI
  }, [position])

  const labelY = app.height + 0.15

  return (
    <group
      ref={group}
      position={position}
      rotation={[0, lookYaw + (index % 2 === 0 ? 0.15 : -0.15), 0]}
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
      {/* Halo selección */}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.38, 0.48, 48]} />
          <meshBasicMaterial color="#6366f1" transparent opacity={0.9} />
        </mesh>
      )}

      <group ref={modelRef} position={[0, 0, 0]}>
        <primitive object={character} />
      </group>

      <Html position={[0, labelY, 0]} center distanceFactor={10} style={{ pointerEvents: "none", userSelect: "none" }}>
        <div
          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap shadow-lg border backdrop-blur-md transition-all ${
            selected
              ? "bg-primary text-primary-foreground border-primary scale-110 shadow-primary/30"
              : "bg-background/90 text-foreground border-border/70"
          }`}
        >
          {bot.name.split(" ")[0]}
          <span className="opacity-65 font-normal">
            {" "}
            · {bot.age} · {app.clothing_style}
          </span>
        </div>
      </Html>
    </group>
  )
}

export default CartoonHumanoid
