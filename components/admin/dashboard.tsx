"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdminUser {
  uid: string; email: string; displayName: string; disabled: boolean
  createdAt: string; lastSignIn: string; plan: string; blocked: boolean
  blockedFeatures: string[]; adminNote: string
  limitOverrides: Record<string, number>; usage: Record<string, number>
}

interface ContactMessage {
  id: string; name: string; email: string; category: string
  subject: string; message: string; status: "unread" | "read" | "resolved"; createdAt: string
}

interface AnalyticsSession {
  id: string; uid?: string | null; email?: string | null
  startedAt?: string; lastSeen?: string; totalSeconds?: number
  pageCount?: number; paths?: string[]; lastPath?: string
  referrer?: string | null; device?: string
}

interface AnalyticsData {
  stats: { today: number; week: number; month: number; total: number; authenticated: number; anonymous: number; avgDurationSeconds: number }
  topPages: { path: string; count: number }[]
  sessions: AnalyticsSession[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLANS = ["free", "standard", "pro", "max"] as const
const FEATURES = [
  { key: "resumes",    label: "Resumes",        planDefault: { free: 1,  standard: 5,  pro: 15, max: 30  } },
  { key: "summaries",  label: "Summaries",      planDefault: { free: 3,  standard: 20, pro: 50, max: 120 } },
  { key: "flashcards", label: "Flashcards",     planDefault: { free: 3,  standard: 15, pro: 40, max: 100 } },
  { key: "interviews", label: "Interview Prep", planDefault: { free: 0,  standard: 5,  pro: 10, max: 20  } },
  { key: "scanPages",  label: "Scan Pages",     planDefault: { free: 0,  standard: 20, pro: 100,max: 300 } },
] as const

const PLAN_COLORS: Record<string, string> = {
  free: "bg-slate-700 text-slate-300", standard: "bg-blue-900/60 text-blue-300",
  pro: "bg-indigo-900/60 text-indigo-300", max: "bg-violet-900/60 text-violet-300",
}

const CAT_COLORS: Record<string, string> = {
  suggestion: "text-yellow-400", complaint: "text-red-400", general: "text-blue-400",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(d?: string) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}
function fmtTime(d?: string) {
  if (!d) return "—"
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}
function fmtDuration(s: number) {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60), sec = s % 60
  if (m < 60) return `${m}m ${sec}s`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────

function Skeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-slate-800/50">
          <div className="h-4 w-40 rounded bg-slate-800" />
          <div className="h-4 w-16 rounded bg-slate-800" />
          <div className="h-4 w-16 rounded bg-slate-800 ml-auto" />
        </div>
      ))}
    </div>
  )
}

// ─── User Detail Panel ────────────────────────────────────────────────────────

function UserPanel({ user, onClose, onSaved }: { user: AdminUser; onClose: () => void; onSaved: () => void }) {
  const [plan, setPlan] = useState(user.plan)
  const [blocked, setBlocked] = useState(user.blocked)
  const [blockedFeatures, setBlockedFeatures] = useState<string[]>(user.blockedFeatures)
  const [adminNote, setAdminNote] = useState(user.adminNote)
  const [limitOverrides, setLimitOverrides] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    for (const f of FEATURES) {
      const v = user.limitOverrides?.[f.key]
      m[f.key] = typeof v === "number" ? String(v) : ""
    }
    return m
  })
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState("")

  const toggleFeature = (key: string) =>
    setBlockedFeatures((p) => p.includes(key) ? p.filter((f) => f !== key) : [...p, key])

  const setOverride = (key: string, val: string) => {
    if (val === "" || /^\d+$/.test(val))
      setLimitOverrides((p) => ({ ...p, [key]: val }))
  }

  const planDefault = (key: string) => (FEATURES.find((f) => f.key === key)?.planDefault as Record<string, number>)?.[plan] ?? 0

  async function save() {
    setSaving(true); setSavedMsg("")
    const overridesPayload: Record<string, number | null> = {}
    for (const f of FEATURES) {
      const v = limitOverrides[f.key]
      overridesPayload[f.key] = v === "" ? null : parseInt(v, 10)
    }
    try {
      const res = await fetch(`/api/admin/users/${user.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, blocked, blockedFeatures, adminNote, limitOverrides: overridesPayload }),
      })
      if (res.ok) { setSavedMsg("Saved."); onSaved() } else setSavedMsg("Error saving.")
    } catch { setSavedMsg("Network error.") }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 cursor-pointer" onClick={onClose} />
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 overflow-y-auto flex flex-col">

        <div className="flex items-start justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div className="min-w-0">
            <p className="font-semibold text-slate-100 truncate">{user.displayName || user.email}</p>
            <p className="text-xs text-slate-500 truncate mt-0.5">{user.uid}</p>
          </div>
          <button onClick={onClose} className="ml-3 shrink-0 text-slate-500 hover:text-slate-300 text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-6 flex-1">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[{ label: "Email", value: user.email }, { label: "Joined", value: fmt(user.createdAt) }, { label: "Last sign in", value: fmt(user.lastSignIn) }, { label: "Auth status", value: user.disabled ? "🔴 Disabled" : "🟢 Active" }].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-slate-800/60 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                <p className="text-sm text-slate-200 mt-0.5 break-all">{value}</p>
              </div>
            ))}
          </div>

          {/* Usage */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Usage this month</p>
            <div className="grid grid-cols-3 gap-2">
              {FEATURES.map(({ key, label }) => (
                <div key={key} className="rounded-lg bg-slate-800/60 px-3 py-2.5 text-center">
                  <p className="text-lg font-bold text-slate-100">{user.usage[key] ?? 0}</p>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Plan */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">Plan</label>
            <select value={plan} onChange={(e) => setPlan(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none">
              {PLANS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>

          {/* Custom limits */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Custom Limits</p>
              <span className="text-[10px] text-slate-600">blank = plan default</span>
            </div>
            <div className="space-y-2">
              {FEATURES.map(({ key, label }) => {
                const def = planDefault(key)
                const hasOverride = limitOverrides[key] !== ""
                return (
                  <div key={key} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-800/40 px-3 py-2.5">
                    <span className="flex-1 text-sm text-slate-300">{label}</span>
                    <span className="text-[11px] text-slate-600 shrink-0">plan: {def}</span>
                    <input type="text" inputMode="numeric" placeholder={String(def)} value={limitOverrides[key]}
                      onChange={(e) => setOverride(key, e.target.value)}
                      className={["w-16 rounded-md border px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-900", hasOverride ? "border-indigo-500/70 text-indigo-300" : "border-slate-700 text-slate-400"].join(" ")} />
                  </div>
                )
              })}
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5">Set 0 to fully block a feature for this user.</p>
          </div>

          {/* Block account */}
          <div className="rounded-lg border border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">Block account</p>
                <p className="text-xs text-slate-500 mt-0.5">Disables Firebase Auth login immediately.</p>
              </div>
              <button onClick={() => setBlocked(!blocked)}
                className={["relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer", blocked ? "bg-red-600" : "bg-slate-700"].join(" ")} aria-pressed={blocked}>
                <span className={["pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform", blocked ? "translate-x-5" : "translate-x-0"].join(" ")} />
              </button>
            </div>
          </div>

          {/* Feature access */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Feature Access</p>
            <div className="space-y-2">
              {FEATURES.map(({ key, label }) => {
                const isBlocked = blockedFeatures.includes(key)
                return (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/40 px-3 py-2.5">
                    <span className={`text-sm ${isBlocked ? "text-red-400 line-through" : "text-slate-200"}`}>{label}</span>
                    <button onClick={() => toggleFeature(key)}
                      className={["text-xs font-medium px-2.5 py-1 rounded-md transition-colors", isBlocked ? "bg-red-900/40 text-red-400 hover:bg-red-900/60" : "bg-slate-700 text-slate-300 hover:bg-slate-600"].join(" ")}>
                      {isBlocked ? "Blocked" : "Allowed"}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Admin note */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">Admin Note</label>
            <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} maxLength={500} rows={3}
              placeholder="Internal note — not visible to the user."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none resize-none" />
          </div>
        </div>

        <div className="p-5 border-t border-slate-800 bg-slate-900 sticky bottom-0">
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving}
              className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white transition-colors">
              {saving ? "Saving…" : "Save Changes"}
            </button>
            {savedMsg && <span className={`text-xs ${savedMsg.startsWith("Saved") ? "text-emerald-400" : "text-red-400"}`}>{savedMsg}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Messages Tab (receives data as props — no internal fetching) ──────────────

function MessagesTab({
  contacts, loading, onRefresh, onStatusChange,
}: {
  contacts: ContactMessage[]; loading: boolean
  onRefresh: () => void; onStatusChange: (id: string, status: string) => void
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCat, setFilterCat] = useState("all")

  const filtered = contacts.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false
    if (filterCat !== "all" && c.category !== filterCat) return false
    return true
  })
  const unread = contacts.filter((c) => c.status === "unread").length

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none">
          <option value="all">All statuses</option>
          <option value="unread">Unread ({unread})</option>
          <option value="read">Read</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none">
          <option value="all">All categories</option>
          <option value="suggestion">Suggestion</option>
          <option value="complaint">Complaint</option>
          <option value="general">General</option>
        </select>
        <button onClick={onRefresh} className="rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-4 py-2 text-sm text-slate-300 transition-colors ml-auto">
          Refresh
        </button>
      </div>

      {loading ? <Skeleton rows={6} /> : filtered.length === 0 ? (
        <div className="text-center py-24 text-slate-500 text-sm">No messages.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
              <button className="w-full flex items-start gap-4 px-4 py-3.5 hover:bg-slate-800/50 transition-colors text-left"
                onClick={() => {
                  setExpanded(expanded === c.id ? null : c.id)
                  if (c.status === "unread") onStatusChange(c.id, "read")
                }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold ${CAT_COLORS[c.category] ?? "text-slate-400"}`}>{c.category}</span>
                    {c.status === "unread" && <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">NEW</span>}
                    {c.status === "resolved" && <span className="rounded-full bg-emerald-900/50 text-emerald-400 px-2 py-0.5 text-[10px] font-semibold">RESOLVED</span>}
                    <span className="text-xs text-slate-500 ml-auto shrink-0">{fmtTime(c.createdAt)}</span>
                  </div>
                  <p className="font-medium text-slate-200 text-sm mt-0.5 truncate">{c.subject}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.name} · {c.email}</p>
                </div>
                <span className="text-slate-600 mt-0.5 shrink-0">{expanded === c.id ? "▲" : "▼"}</span>
              </button>
              {expanded === c.id && (
                <div className="border-t border-slate-800 px-4 py-4 space-y-4">
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{c.message}</p>
                  <div className="flex gap-2">
                    {(["unread", "read", "resolved"] as const).map((s) => (
                      <button key={s} onClick={() => onStatusChange(c.id, s)}
                        className={["text-xs px-3 py-1.5 rounded-lg font-medium transition-colors", c.status === s ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"].join(" ")}>
                        Mark {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Analytics Tab (receives data as props) ───────────────────────────────────

function AnalyticsTab({ data, loading, onRefresh }: { data: AnalyticsData | null; loading: boolean; onRefresh: () => void }) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  if (loading) return <Skeleton rows={10} />
  if (!data) return <div className="text-center py-24 text-red-400 text-sm">Failed to load analytics.</div>

  const { stats, topPages, sessions } = data
  const filteredSessions = sessions.filter((s) =>
    search === "" ||
    (s.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.uid ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.lastPath ?? "").includes(search) || s.id.includes(search)
  )

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{ label: "Today", value: stats.today, sub: "sessions" }, { label: "This week", value: stats.week, sub: "sessions" }, { label: "This month", value: stats.month, sub: "sessions" }, { label: "Avg time", value: fmtDuration(stats.avgDurationSeconds), sub: "per session" }].map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-slate-100 mt-0.5">{value}</p>
            <p className="text-[11px] text-slate-600">{sub}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[{ label: "All-time sessions", value: stats.total }, { label: "Authenticated (mo)", value: stats.authenticated }, { label: "Anonymous (mo)", value: stats.anonymous }].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            <p className="text-xl font-bold text-slate-100 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Top pages */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Top Pages (this month)</p>
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          {topPages.length === 0 ? <p className="text-center py-8 text-slate-600 text-sm">No data yet.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Page</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Unique visitors</th>
              </tr></thead>
              <tbody>{topPages.map(({ path, count }) => (
                <tr key={path} className="border-b border-slate-800/50 bg-slate-900 hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 text-slate-300 font-mono text-xs">{path}</td>
                  <td className="px-4 py-2.5 text-right text-slate-400 font-semibold">{count}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>

      {/* Sessions */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recent Sessions</p>
          <div className="flex items-center gap-2">
            <input type="search" placeholder="Search email, UID, path…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none" />
            <button onClick={onRefresh} className="rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-sm text-slate-300 transition-colors">Refresh</button>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 bg-slate-900/60">
                {["User", "Started", "Duration", "Pages", "Last page", "Device", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filteredSessions.slice(0, 100).map((s) => (
                  <>
                    <tr key={s.id} className="border-b border-slate-800/50 bg-slate-900 hover:bg-slate-800/40 cursor-pointer"
                      onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}>
                      <td className="px-4 py-2.5">{s.email ? <p className="text-slate-200 text-xs truncate max-w-[160px]">{s.email}</p> : <p className="text-slate-600 text-xs">Anonymous</p>}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{fmtTime(s.startedAt)}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-400 whitespace-nowrap">{fmtDuration(s.totalSeconds ?? 0)}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-400 text-center">{s.pageCount ?? 0}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 font-mono max-w-[140px] truncate">{s.lastPath ?? "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 capitalize">{s.device ?? "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600 text-xs">{expandedSession === s.id ? "▲" : "▼"}</td>
                    </tr>
                    {expandedSession === s.id && (
                      <tr key={`${s.id}-d`} className="border-b border-slate-800">
                        <td colSpan={7} className="px-4 py-4 bg-slate-800/40">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                            <div><p className="text-slate-500 font-semibold mb-1">Session ID</p><p className="text-slate-400 font-mono break-all">{s.id}</p></div>
                            {s.uid && <div><p className="text-slate-500 font-semibold mb-1">UID</p><p className="text-slate-400 font-mono break-all">{s.uid}</p></div>}
                            {s.referrer && <div><p className="text-slate-500 font-semibold mb-1">Referrer</p><p className="text-slate-400 break-all">{s.referrer}</p></div>}
                            <div><p className="text-slate-500 font-semibold mb-1">Last seen</p><p className="text-slate-400">{fmtTime(s.lastSeen)}</p></div>
                            {(s.paths ?? []).length > 0 && (
                              <div className="sm:col-span-2">
                                <p className="text-slate-500 font-semibold mb-1">Pages visited</p>
                                <div className="flex flex-wrap gap-1">
                                  {(s.paths ?? []).map((p) => <span key={p} className="rounded bg-slate-700 px-1.5 py-0.5 font-mono text-slate-300">{p}</span>)}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-slate-700 text-center mt-3">Showing {Math.min(filteredSessions.length, 100)} of {filteredSessions.length} sessions</p>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<"users" | "messages" | "analytics">("users")

  // ── Users ──
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState("")
  const [search, setSearch] = useState("")
  const [filterPlan, setFilterPlan] = useState("all")
  const [selectedUid, setSelectedUid] = useState<string | null>(null)

  // ── Contacts — load once, persist across tab switches ──
  const [contacts, setContacts] = useState<ContactMessage[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const contactsLoaded = useRef(false)

  // ── Analytics — load once ──
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const analyticsLoaded = useRef(false)

  // ── Fetchers ──
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true); setUsersError("")
    try {
      const res = await fetch("/api/admin/users")
      if (res.status === 401) { router.refresh(); return }
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUsers(data.users ?? [])
    } catch { setUsersError("Failed to load users.") }
    finally { setUsersLoading(false) }
  }, [router])

  const fetchContacts = useCallback(async () => {
    setContactsLoading(true)
    try {
      const res = await fetch("/api/admin/contacts")
      const data = await res.json()
      setContacts(data.contacts ?? [])
    } catch { /* ignore */ }
    finally { setContactsLoading(false) }
  }, [])

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const res = await fetch("/api/admin/analytics")
      setAnalyticsData(await res.json())
    } catch { /* ignore */ }
    finally { setAnalyticsLoading(false) }
  }, [])

  // Initial load
  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Lazy load tabs on first visit
  useEffect(() => {
    if (tab === "messages" && !contactsLoaded.current) {
      contactsLoaded.current = true
      fetchContacts()
    }
    if (tab === "analytics" && !analyticsLoaded.current) {
      analyticsLoaded.current = true
      fetchAnalytics()
    }
  }, [tab, fetchContacts, fetchAnalytics])

  async function handleStatusChange(id: string, status: string) {
    await fetch("/api/admin/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    setContacts((p) => p.map((c) => c.id === id ? { ...c, status: status as ContactMessage["status"] } : c))
  }

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" })
    router.refresh()
  }

  const filtered = users.filter((u) =>
    (search === "" || u.email.toLowerCase().includes(search.toLowerCase()) || u.displayName.toLowerCase().includes(search.toLowerCase()) || u.uid.toLowerCase().includes(search.toLowerCase())) &&
    (filterPlan === "all" || u.plan === filterPlan)
  )

  const stats = {
    total: users.length,
    free:     users.filter((u) => u.plan === "free").length,
    standard: users.filter((u) => u.plan === "standard").length,
    pro:      users.filter((u) => u.plan === "pro").length,
    max:      users.filter((u) => u.plan === "max").length,
    blocked:  users.filter((u) => u.blocked || u.disabled).length,
  }

  const unreadCount = contacts.filter((c) => c.status === "unread").length
  const selectedUser = users.find((u) => u.uid === selectedUid) ?? null

  const TABS = [
    { key: "users"     as const, label: "Users",     badge: null },
    { key: "messages"  as const, label: "Messages",  badge: unreadCount > 0 ? unreadCount : null },
    { key: "analytics" as const, label: "Analytics", badge: null },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">

      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <svg className="h-3.5 w-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-semibold text-sm text-slate-200">PrepNova Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 hidden sm:block">{users.length} users</span>
            <button onClick={logout} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Sign out →</button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1">
          {TABS.map(({ key, label, badge }) => (
            <button key={key} onClick={() => setTab(key)}
              className={["relative px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px", tab === key ? "border-indigo-500 text-indigo-300" : "border-transparent text-slate-500 hover:text-slate-300"].join(" ")}>
              {label}
              {badge !== null && <span className="ml-1.5 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span>}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Users ── */}
        {tab === "users" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {[
                { label: "Total",    value: stats.total,    cls: "text-slate-100" },
                { label: "Free",     value: stats.free,     cls: "text-slate-400" },
                { label: "Standard", value: stats.standard, cls: "text-blue-400" },
                { label: "Pro",      value: stats.pro,      cls: "text-indigo-400" },
                { label: "Max",      value: stats.max,      cls: "text-violet-400" },
                { label: "Blocked",  value: stats.blocked,  cls: "text-red-400" },
              ].map(({ label, value, cls }) => (
                <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                  <p className={`text-2xl font-bold mt-0.5 ${cls}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <input type="search" placeholder="Search by email, name, or UID…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none">
                <option value="all">All plans</option>
                {PLANS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
              <button onClick={fetchUsers} className="rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-4 py-2 text-sm text-slate-300 transition-colors">Refresh</button>
            </div>

            {usersLoading ? <Skeleton /> : usersError ? (
              <div className="text-center py-24 text-red-400 text-sm">{usersError}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 text-slate-500 text-sm">No users match.</div>
            ) : (
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-800 bg-slate-900/60">
                      {["User", "Plan", "Status", "Usage (mo)", "Custom limits", "Joined", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {filtered.map((u) => {
                        const isBlocked = u.blocked || u.disabled
                        const hasOverrides = Object.values(u.limitOverrides ?? {}).some((v) => typeof v === "number")
                        return (
                          <tr key={u.uid} className="border-b border-slate-800/50 bg-slate-900 hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setSelectedUid(u.uid)}>
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-200 truncate max-w-[180px]">{u.displayName || u.email}</p>
                              {u.displayName && <p className="text-xs text-slate-500 truncate max-w-[180px]">{u.email}</p>}
                            </td>
                            <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${PLAN_COLORS[u.plan] ?? PLAN_COLORS.free}`}>{u.plan}</span></td>
                            <td className="px-4 py-3">{isBlocked ? <span className="text-xs font-medium text-red-400">🔴 Blocked</span> : <span className="text-xs font-medium text-emerald-400">🟢 Active</span>}</td>
                            <td className="px-4 py-3 text-xs text-slate-400">{Object.values(u.usage).reduce((a, b) => a + b, 0)} actions</td>
                            <td className="px-4 py-3 text-xs">{hasOverrides ? <span className="text-indigo-400 font-medium">Custom ✦</span> : <span className="text-slate-600">—</span>}</td>
                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmt(u.createdAt)}</td>
                            <td className="px-4 py-3 text-xs text-indigo-400">Manage →</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <p className="mt-6 text-xs text-slate-700 text-center">{filtered.length} of {users.length} users · Session expires in 8 hours</p>
          </>
        )}

        {/* ── Messages ── */}
        {tab === "messages" && (
          <MessagesTab
            contacts={contacts}
            loading={contactsLoading}
            onRefresh={() => { contactsLoaded.current = true; fetchContacts() }}
            onStatusChange={handleStatusChange}
          />
        )}

        {/* ── Analytics ── */}
        {tab === "analytics" && (
          <AnalyticsTab
            data={analyticsData}
            loading={analyticsLoading}
            onRefresh={() => { analyticsLoaded.current = true; fetchAnalytics() }}
          />
        )}
      </div>

      {selectedUser && (
        <UserPanel user={selectedUser} onClose={() => setSelectedUid(null)} onSaved={fetchUsers} />
      )}
    </div>
  )
}
