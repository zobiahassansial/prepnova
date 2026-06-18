"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

export function AdminLoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const attempts = useRef(0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        attempts.current++
        const data = await res.json().catch(() => ({}))
        setError(
          res.status === 429
            ? data.error ?? "Too many attempts. Try again later."
            : "Invalid credentials."
        )
        setPassword("")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 mb-4">
            <svg className="h-6 w-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-100">Admin Access</h1>
          <p className="text-sm text-slate-500 mt-1">Restricted area</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Username
            </label>
            <input
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-900/30 border border-red-800/50 px-3 py-2.5 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            {loading ? "Verifying…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}
