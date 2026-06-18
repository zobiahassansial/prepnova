// Module-level in-memory cache — lives for the lifetime of the Node process.
// Fine for a single-admin panel; resets on cold start / deploy.

interface Entry { data: unknown; exp: number }
const store = new Map<string, Entry>()

export function getCache<T>(key: string): T | null {
  const e = store.get(key)
  if (!e) return null
  if (Date.now() > e.exp) { store.delete(key); return null }
  return e.data as T
}

export function setCache<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, exp: Date.now() + ttlMs })
}

export function invalidateCache(...keys: string[]): void {
  for (const k of keys) store.delete(k)
}

export const CACHE_KEYS = {
  users:     "admin:users",
  contacts:  "admin:contacts",
  analytics: "admin:analytics",
} as const
