/**
 * Vérifie un jeton Cloudflare Turnstile côté serveur.
 * @see https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true

  if (!token || typeof token !== 'string' || token.trim() === '') {
    return false
  }

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret,
      response: token.trim()
    })
  })

  const data = (await res.json()) as { success?: boolean }
  return data.success === true
}
