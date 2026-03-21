/**
 * Rate limit simple en mémoire (par IP).
 * Convient pour une seule instance. En multi-instances, utiliser Redis ou équivalent.
 */
const store = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 60_000 // 1 minute

function getKey(ip: string, prefix: string): string {
  return `${prefix}:${ip}`
}

function cleanup(key: string) {
  const entry = store.get(key)
  if (entry && Date.now() > entry.resetAt) store.delete(key)
}

export function checkRateLimit(
  ip: string,
  prefix: string,
  maxRequests: number
): { ok: boolean } {
  const key = getKey(ip, prefix)
  cleanup(key)
  const entry = store.get(key)
  const now = Date.now()
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true }
  }
  if (entry.count >= maxRequests) return { ok: false }
  entry.count += 1
  return { ok: true }
}

export function getClientIp(event: { node: { req: { headers: Record<string, string | undefined> } } }): string {
  const forwarded = event.node.req.headers['x-forwarded-for']
  if (forwarded) {
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0]
    return first?.trim() ?? 'unknown'
  }
  return event.node.req.headers['x-real-ip'] ?? 'unknown'
}
