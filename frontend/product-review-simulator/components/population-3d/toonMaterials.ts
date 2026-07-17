import * as THREE from "three"

/** Mapa de rampas 1D para sombreado cartoon (3 bandas). */
export function createToonGradientMap(): THREE.DataTexture {
  const colors = new Uint8Array([
    90, 90, 100, 255, // sombra profunda
    160, 160, 170, 255, // media
    255, 255, 255, 255, // luz
  ])
  const tex = new THREE.DataTexture(colors, 3, 1, THREE.RGBAFormat)
  tex.minFilter = THREE.NearestFilter
  tex.magFilter = THREE.NearestFilter
  tex.needsUpdate = true
  return tex
}

export type CharacterPalette = {
  skin: string
  shirt: string
  pants: string
  shoes: string
  hair: string
  accent: string
}

/**
 * Aplica un fragment shader que pinta zonas por altura del vértice en espacio de modelo.
 * Así un único mesh skinned (Xbot) se ve como personaje con ropa parametrizable.
 */
export function makeZonedToonMaterial(
  palette: CharacterPalette,
  gradientMap: THREE.Texture,
  opts?: { headY?: number; shirtY?: number; pantsY?: number; shoeY?: number }
): THREE.MeshToonMaterial {
  const headY = opts?.headY ?? 1.35
  const shirtY = opts?.shirtY ?? 0.95
  const pantsY = opts?.pantsY ?? 0.35
  const shoeY = opts?.shoeY ?? 0.08

  const mat = new THREE.MeshToonMaterial({
    color: "#ffffff",
    gradientMap,
  })

  // MeshToonMaterial no tiene roughness en todos los tipos — forzar via any si hace falta
  mat.userData.palette = palette

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSkin = { value: new THREE.Color(palette.skin) }
    shader.uniforms.uShirt = { value: new THREE.Color(palette.shirt) }
    shader.uniforms.uPants = { value: new THREE.Color(palette.pants) }
    shader.uniforms.uShoes = { value: new THREE.Color(palette.shoes) }
    shader.uniforms.uHair = { value: new THREE.Color(palette.hair) }
    shader.uniforms.uAccent = { value: new THREE.Color(palette.accent) }
    shader.uniforms.uHeadY = { value: headY }
    shader.uniforms.uShirtY = { value: shirtY }
    shader.uniforms.uPantsY = { value: pantsY }
    shader.uniforms.uShoeY = { value: shoeY }

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vModelPos;
        varying vec3 vModelNormal;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vModelPos = position;
        vModelNormal = normalize(normal);`
      )

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vModelPos;
        varying vec3 vModelNormal;
        uniform vec3 uSkin;
        uniform vec3 uShirt;
        uniform vec3 uPants;
        uniform vec3 uShoes;
        uniform vec3 uHair;
        uniform vec3 uAccent;
        uniform float uHeadY;
        uniform float uShirtY;
        uniform float uPantsY;
        uniform float uShoeY;`
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        {
          float y = vModelPos.y;
          float ny = vModelNormal.y;
          // Base por franjas de altura (cuerpo Mixamo en metros aprox.)
          vec3 zone = uSkin;
          if (y < uShoeY) {
            zone = uShoes;
          } else if (y < uPantsY) {
            zone = uPants;
          } else if (y < uShirtY) {
            // transición suave pantalón → camiseta en cintura
            float t = smoothstep(uPantsY, uShirtY, y);
            zone = mix(uPants, uShirt, t);
          } else if (y < uHeadY) {
            float t = smoothstep(uShirtY, uHeadY * 0.92, y);
            // brazos/cuello: si normal lateral y y medio → piel
            float armLikeness = smoothstep(0.35, 0.85, abs(vModelPos.x)) * step(uShirtY * 0.7, y) * (1.0 - step(uHeadY * 0.88, y));
            zone = mix(uShirt, uSkin, armLikeness * 0.85);
            zone = mix(zone, uSkin, smoothstep(uHeadY * 0.88, uHeadY, y) * 0.5);
          } else {
            // cabeza: piel + “pelo” en parte superior (normal hacia arriba)
            float hairMask = smoothstep(0.15, 0.65, ny) * smoothstep(uHeadY, uHeadY + 0.25, y);
            zone = mix(uSkin, uHair, hairMask);
          }
          // acento en pecho (camiseta)
          if (y > uPantsY + 0.05 && y < uHeadY * 0.9 && abs(vModelPos.x) < 0.18 && vModelPos.z > 0.05) {
            float stripe = smoothstep(0.0, 0.08, abs(vModelPos.x));
            zone = mix(uAccent, zone, stripe);
          }
          diffuseColor.rgb *= zone;
        }`
      )

    mat.userData.shader = shader
  }

  mat.customProgramCacheKey = () =>
    `zoned-toon-${palette.skin}-${palette.shirt}-${palette.pants}-${palette.shoes}-${palette.hair}`

  return mat
}

export function updateZonedPalette(mat: THREE.MeshToonMaterial, palette: CharacterPalette) {
  const shader = mat.userData.shader as { uniforms: Record<string, { value: THREE.Color }> } | undefined
  if (!shader?.uniforms) {
    mat.userData.palette = palette
    mat.customProgramCacheKey = () =>
      `zoned-toon-${palette.skin}-${palette.shirt}-${palette.pants}-${palette.shoes}-${palette.hair}`
    mat.needsUpdate = true
    return
  }
  shader.uniforms.uSkin.value.set(palette.skin)
  shader.uniforms.uShirt.value.set(palette.shirt)
  shader.uniforms.uPants.value.set(palette.pants)
  shader.uniforms.uShoes.value.set(palette.shoes)
  shader.uniforms.uHair.value.set(palette.hair)
  shader.uniforms.uAccent.value.set(palette.accent)
}
