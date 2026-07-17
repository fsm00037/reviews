/**
 * Misma lógica de avatar que las tarjetas de perfil / reseñas.
 * Una sola fuente de verdad para UI 2D y textura 3D.
 */

const MOUTH_VARIANTS =
  "variant01,variant02,variant03,variant04,variant05,variant06,variant07,variant09,variant10,variant11,variant12,variant13,variant14,variant15,variant16,variant17,variant18"

/** URL exacta del avatar como se muestra en las tarjetas (SVG DiceBear). */
export function getBotAvatarUrl(bot: { avatar?: string | null; name?: string } | null | undefined): string {
  if (bot?.avatar && bot.avatar.includes("dicebear")) {
    return bot.avatar
  }
  if (bot?.avatar && (bot.avatar.startsWith("http") || bot.avatar.startsWith("data:") || bot.avatar.startsWith("/"))) {
    return bot.avatar
  }
  const seed = encodeURIComponent(bot?.name || "avatar")
  return `https://api.dicebear.com/10.x/croodles-neutral/svg?mouthVariant=${MOUTH_VARIANTS}&seed=${seed}`
}

/**
 * Misma cara que la tarjeta, pero en formato raster para textura WebGL.
 * Conserva seed, mouthVariant y resto de params; solo svg→png + size.
 */
export function getBotAvatarTextureUrl(bot: { avatar?: string | null; name?: string } | null | undefined): string {
  const cardUrl = getBotAvatarUrl(bot)

  if (cardUrl.includes("dicebear.com")) {
    try {
      const u = new URL(cardUrl)
      // Misma API 10.x y query; cambiar path svg → png
      u.pathname = u.pathname.replace(/\/svg\/?$/, "/png")
      if (!u.pathname.includes("/png")) {
        // por si el path es .../croodles-neutral/svg
        u.pathname = u.pathname.replace(/svg$/, "png")
      }
      u.searchParams.set("size", "256")
      // Fondo transparente cuando la API lo soporte
      if (!u.searchParams.has("backgroundColor")) {
        u.searchParams.set("backgroundColor", "transparent")
      }
      return u.toString()
    } catch {
      return cardUrl
        .replace(/\/svg(\?|$)/, "/png$1")
        .replace(/([?&])size=\d+/g, "")
        .concat(cardUrl.includes("?") ? "&size=256" : "?size=256")
    }
  }

  return cardUrl
}
