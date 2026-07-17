import * as THREE from "three"
import { getBotAvatarTextureUrl, getBotAvatarUrl } from "./bot-avatar"

const textureCache = new Map<string, THREE.CanvasTexture>()
const inflight = new Map<string, Promise<THREE.CanvasTexture>>()

let _headGeo: THREE.SphereGeometry | null = null

/** Elimina blanco / casi blanco del avatar (deja solo el dibujo). */
function stripWhiteToAlpha(data: ImageData): void {
  const d = data.data
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]
    const g = d[i + 1]
    const b = d[i + 2]
    const a = d[i + 3]
    if (a < 8) {
      d[i + 3] = 0
      continue
    }
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    const maxc = Math.max(r, g, b)
    const minc = Math.min(r, g, b)
    const sat = maxc <= 0 ? 0 : (maxc - minc) / maxc

    // Fondo blanco o papel
    if (lum >= 195 || minc >= 215 || (lum >= 170 && sat < 0.14)) {
      d[i + 3] = 0
      continue
    }
    // Borde suave
    if (lum > 140 && sat < 0.18) {
      d[i + 3] = Math.round(a * Math.max(0, 1 - (lum - 140) / 55))
      continue
    }
    // Trazo más oscuro y opaco
    d[i] = Math.round(r * 0.55)
    d[i + 1] = Math.round(g * 0.55)
    d[i + 2] = Math.round(b * 0.55)
    d[i + 3] = 255
  }
}

async function loadImage(url: string): Promise<CanvasImageSource> {
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" })
    if (!res.ok) throw new Error(String(res.status))
    return await createImageBitmap(await res.blob())
  } catch {
    return await new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }
}

function parseSkin(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * Textura OPACA para la cabeza:
 * 1) Rellena todo con el color de piel del Mii
 * 2) Dibuja encima el avatar de la tarjeta (mismo que el 2D) sin fondo blanco
 */
export function loadAvatarFaceTexture(
  botOrAvatar: { avatar?: string | null; name?: string } | string | null | undefined,
  name?: string,
  skinHex: string = "#e8b98a"
): Promise<THREE.CanvasTexture> {
  let bot: { avatar?: string | null; name?: string }
  if (typeof botOrAvatar === "string") {
    bot = { avatar: botOrAvatar, name }
  } else if (botOrAvatar && typeof botOrAvatar === "object") {
    bot = { avatar: botOrAvatar.avatar, name: botOrAvatar.name || name }
  } else {
    bot = { name }
  }

  const pngUrl = getBotAvatarTextureUrl(bot)
  const svgUrl = getBotAvatarUrl(bot)
  const cacheKey = `head-skin-v9:${pngUrl}:${skinHex}`

  const hit = textureCache.get(cacheKey)
  if (hit) return Promise.resolve(hit)
  const pending = inflight.get(cacheKey)
  if (pending) return pending

  const job = (async () => {
    const size = 512
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!

    // —— Base: color de piel REAL (nunca blanco) ——
    const [sr, sg, sb] = parseSkin(skinHex || "#e8b98a")
    ctx.fillStyle = `rgb(${sr},${sg},${sb})`
    ctx.fillRect(0, 0, size, size)

    try {
      let src: CanvasImageSource
      try {
        src = await loadImage(pngUrl)
      } catch {
        src = await loadImage(svgUrl)
      }

      const iw =
        "naturalWidth" in (src as HTMLImageElement) && (src as HTMLImageElement).naturalWidth
          ? (src as HTMLImageElement).naturalWidth
          : (src as ImageBitmap).width || size
      const ih =
        "naturalHeight" in (src as HTMLImageElement) && (src as HTMLImageElement).naturalHeight
          ? (src as HTMLImageElement).naturalHeight
          : (src as ImageBitmap).height || size

      // Capa temporal del avatar
      const layer = document.createElement("canvas")
      layer.width = size
      layer.height = size
      const lctx = layer.getContext("2d", { willReadFrequently: true })!
      lctx.clearRect(0, 0, size, size)

      const scale = Math.max(size / iw, size / ih) * 0.88
      const dw = iw * scale
      const dh = ih * scale
      lctx.drawImage(src, (size - dw) / 2, (size - dh) / 2, dw, dh)

      const id = lctx.getImageData(0, 0, size, size)
      stripWhiteToAlpha(id)
      lctx.putImageData(id, 0, 0)

      // Avatar (solo trazos) sobre la piel → resultado opaco con piel + cara
      ctx.drawImage(layer, 0, 0)

      if (typeof (src as ImageBitmap).close === "function") {
        ;(src as ImageBitmap).close()
      }
    } catch {
      // Si falla la imagen, al menos se ve la piel (no blanco)
      ctx.fillStyle = "#222"
      ctx.beginPath()
      ctx.arc(size * 0.38, size * 0.44, size * 0.045, 0, Math.PI * 2)
      ctx.arc(size * 0.62, size * 0.44, size * 0.045, 0, Math.PI * 2)
      ctx.fill()
    }

    const tex = new THREE.CanvasTexture(canvas)
    // No forzar SRGB de forma que lave el color; dejar default del renderer
    tex.colorSpace = THREE.NoColorSpace
    tex.needsUpdate = true
    tex.flipY = true
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.generateMipmaps = true
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter

    textureCache.set(cacheKey, tex)
    inflight.delete(cacheKey)
    return tex
  })()

  inflight.set(cacheKey, job)
  return job
}

/**
 * Esfera con UVs: frente = textura de cara (atlas completo),
 * nuca = esquina del atlas (solo piel, mismo color).
 */
export function createHeadGeometryWithFaceUVs(segments = 28): THREE.SphereGeometry {
  if (_headGeo) return _headGeo

  const geo = new THREE.SphereGeometry(1, segments, Math.floor(segments * 0.8))
  const pos = geo.attributes.position
  const uvs = geo.attributes.uv

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)

    // Cara frontal: proyección ortográfica x/y → UV
    // Usamos un umbral suave: laterales también muestran un poco de cara
    if (z > -0.05) {
      const u = THREE.MathUtils.clamp(0.5 + x * 0.5, 0, 1)
      // flipY de la textura ya está en true; no invertir aquí de más
      const v = THREE.MathUtils.clamp(0.5 + y * 0.5, 0, 1)
      uvs.setXY(i, u, v)
    } else {
      // Nuca: esquina (piel sólida del relleno)
      uvs.setXY(i, 0.02, 0.02)
    }
  }
  uvs.needsUpdate = true
  geo.computeVertexNormals()
  _headGeo = geo
  return geo
}

export function createFaceDiscGeometry(): THREE.CircleGeometry {
  return new THREE.CircleGeometry(1, 32)
}

export function createFaceOnlyGeometry(): THREE.SphereGeometry {
  return createHeadGeometryWithFaceUVs()
}

export function removeWhiteBackground(imageData: ImageData): void {
  stripWhiteToAlpha(imageData)
}
