"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, Calendar, FileText, Code2, BookOpen, ChevronRight } from "lucide-react"
import Link from "next/link"

// ─── Mockup components (animated product UI representations) ─────────────────

function StudyMockup() {
  const points = [
    "Mitosis produces two identical daughter cells from a single parent cell.",
    "Meiosis produces four genetically unique cells — used in sexual reproduction.",
    "The spindle apparatus separates chromosomes and pulls them to opposite poles.",
  ]
  const cards = ["What is mitosis?", "Mitosis vs Meiosis", "Spindle apparatus", "4 stages of mitosis"]

  return (
    <div className="space-y-3 pointer-events-none select-none">
      {/* AI status row */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Summary · Lecture 4: Cell Division
        </span>
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="inline-flex items-center gap-1 rounded-full bg-primary/8 border border-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          AI Generated
        </motion.span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-lg border border-border bg-background p-4 space-y-3"
      >
        {points.map((pt, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + 0.13 * i, duration: 0.3 }}
            className="flex items-start gap-2 text-xs text-foreground/80 leading-snug"
          >
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            {pt}
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48, duration: 0.35 }}
        className="rounded-lg border border-border bg-background p-4"
      >
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Flashcards generated
          </p>
          <span className="text-[10px] font-semibold text-primary">{cards.length} cards</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cards.map((c, i) => (
            <motion.span
              key={c}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.58 + 0.09 * i, duration: 0.28 }}
              className="inline-flex items-center gap-1 rounded border border-primary/20 bg-primary/5 text-primary text-xs px-2 py-0.5 font-medium"
            >
              <BookOpen className="h-2.5 w-2.5" />
              {c}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function OrganiseMockup() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const tasks: { day: number; label: string; cls: string }[] = [
    { day: 0, label: "Bio Ch. 4", cls: "bg-primary/10 text-primary border-primary/20" },
    { day: 0, label: "Chem: Revision", cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
    { day: 1, label: "Bio Ch. 5", cls: "bg-primary/10 text-primary border-primary/20" },
    { day: 2, label: "Chem: Mock", cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
    { day: 3, label: "Bio: Cards", cls: "bg-primary/10 text-primary border-primary/20" },
    { day: 4, label: "Bio Exam 🎯", cls: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-lg border border-border bg-background overflow-hidden pointer-events-none select-none"
    >
      <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">This week</span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="inline-flex items-center gap-1 text-[10px] text-primary font-medium"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Plan optimised
        </motion.span>
      </div>
      <div className="grid grid-cols-7 gap-0.5 p-2.5">
        {days.map((day, i) => {
          const dayTasks = tasks.filter((t) => t.day === i)
          return (
            <div key={i} className="flex flex-col gap-1">
              <p className="text-[9px] font-semibold text-center text-muted-foreground uppercase mb-0.5">
                {day}
              </p>
              {dayTasks.map((task, j) => (
                <motion.div
                  key={j}
                  initial={{ opacity: 0, scaleY: 0.6 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ delay: 0.12 + 0.07 * (i + j), duration: 0.28, ease: "easeOut" }}
                  className={`rounded px-1 py-0.5 text-[9px] font-medium border leading-tight origin-top ${task.cls}`}
                >
                  {task.label}
                </motion.div>
              ))}
            </div>
          )
        })}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.3 }}
        className="px-4 py-2 border-t border-border bg-muted/20 flex items-center gap-1.5"
      >
        <span className="text-[10px] text-muted-foreground">2 subjects · 1 exam · </span>
        <span className="text-[10px] font-semibold text-primary">6 sessions planned</span>
      </motion.div>
    </motion.div>
  )
}

function CareerMockup() {
  const skills = ["Python", "Data Analysis", "React", "SQL", "Figma"]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-lg border border-border bg-background overflow-hidden pointer-events-none select-none"
    >
      {/* ATS score header */}
      <div className="px-5 pt-4 pb-3 border-b border-border bg-muted/20 flex items-center justify-between">
        <div className="space-y-1">
          <motion.div initial={{ width: 0 }} animate={{ width: "9rem" }} transition={{ delay: 0.1, duration: 0.4 }} className="h-3.5 rounded bg-foreground/20" />
          <motion.div initial={{ width: 0 }} animate={{ width: "11rem" }} transition={{ delay: 0.2, duration: 0.35 }} className="h-2 rounded bg-muted-foreground/15" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="flex flex-col items-center"
        >
          <span className="text-xs font-bold text-primary">94%</span>
          <span className="text-[9px] text-muted-foreground">ATS match</span>
        </motion.div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Experience
          </p>
          <div className="space-y-2.5 pl-2.5 border-l-2 border-primary/20">
            {[[44, 56, 48], [36, 52]].map((widths, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + 0.15 * i, duration: 0.3 }}
              >
                {widths.map((w, j) => (
                  <div key={j} className={`h-${j === 0 ? "2.5" : "2"} rounded mb-1`} style={{ width: `${w * 1.4}px`, background: j === 0 ? "hsl(var(--foreground)/0.15)" : "hsl(var(--muted-foreground)/0.12)" }} />
                ))}
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s, i) => (
              <motion.span
                key={s}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 + 0.07 * i, duration: 0.25 }}
                className="rounded border border-border bg-muted/50 text-[9px] px-1.5 py-0.5 text-muted-foreground font-medium"
              >
                {s}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function PracticeMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-lg border border-border bg-background overflow-hidden pointer-events-none select-none"
    >
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground">Interview Simulator</p>
          <p className="text-[10px] text-muted-foreground">Behavioural · Question 2 of 5</p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="flex flex-col items-end"
        >
          <span className="text-sm font-bold text-primary">8<span className="text-xs text-muted-foreground font-normal">/10</span></span>
          <span className="text-[9px] text-muted-foreground">score</span>
        </motion.div>
      </div>
      <div className="p-4 space-y-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="rounded-lg bg-muted/50 p-3"
        >
          <p className="text-xs font-medium text-foreground">
            Tell me about a time you had to learn something quickly under pressure.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="rounded-lg border border-primary/20 bg-primary/5 p-3"
        >
          <p className="text-[11px] text-foreground/80 leading-relaxed">
            "During finals week my lab partner dropped out, so I had to learn the full data-analysis pipeline solo in two days…"
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.3 }}
          className="rounded-lg border border-border bg-muted/20 p-3 space-y-2"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Feedback
          </p>
          {[
            { icon: "✓", text: "Good use of a specific, concrete situation.", cls: "text-emerald-600 dark:text-emerald-400" },
            { icon: "→", text: "Explain the outcome — what did you deliver, and what did you learn?", cls: "text-amber-600 dark:text-amber-400" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.52 + 0.1 * i, duration: 0.25 }}
              className={`flex items-start gap-1.5 text-[11px] ${item.cls}`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}

// ─── Tab data ───────────────────────────────────────────────────────────────

const tabs = [
  {
    id: "study",
    label: "Study",
    icon: Brain,
    headline: "Turn any notes into a study kit",
    description:
      "Upload a PDF or paste lecture notes. PrepNova returns a plain-language summary and a ready-to-review flashcard deck from the same content. No editing needed.",
    tools: [
      { name: "Note Summarizer", href: "/modules/note-summarizer" },
      { name: "Flashcard System", href: "/modules/flashcards" },
      { name: "Document Scanner", href: "/modules/document-scanner" },
    ],
    Mockup: StudyMockup,
  },
  {
    id: "organise",
    label: "Organise",
    icon: Calendar,
    headline: "A study plan that fits your actual week",
    description:
      "Add your subjects and exam dates. The planner spreads topics across your available days, so you always know what to work on next — and you can adjust it as things change.",
    tools: [{ name: "Study Planner", href: "/modules/study-planner" }],
    Mockup: OrganiseMockup,
  },
  {
    id: "career",
    label: "Career",
    icon: FileText,
    headline: "A resume ready to send",
    description:
      "Describe your experience, education, and skills in plain sentences. The AI structures everything into a clean, formatted resume you can export directly.",
    tools: [{ name: "AI Resume Builder", href: "/modules/resume-builder" }],
    Mockup: CareerMockup,
  },
  {
    id: "practice",
    label: "Practice",
    icon: Code2,
    headline: "Interview practice with real feedback",
    description:
      "Answer common technical and behavioural questions in writing. PrepNova scores each answer and explains specifically what to improve — not just whether it was good.",
    tools: [{ name: "Interview Simulator", href: "/modules/interview-prep" }],
    Mockup: PracticeMockup,
  },
]

// ─── Component ──────────────────────────────────────────────────────────────

export function ToolsTabs() {
  const [activeId, setActiveId] = useState("study")
  const active = tabs.find((t) => t.id === activeId)!

  return (
    <section id="features" className="py-24 md:py-32 bg-muted/20 border-y">
      <div className="container px-4 md:px-6 mx-auto">

        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            See AI at Work
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Six tools. One workspace.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Switch between tools as your needs change — everything stays in one place.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background p-1 shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeId === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveId(tab.id)}
                  className={[
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="grid md:grid-cols-2 gap-10 items-start max-w-5xl mx-auto"
          >
            {/* Left: description */}
            <div className="space-y-5 md:pt-2">
              <h3 className="text-2xl font-bold text-foreground">{active.headline}</h3>
              <p className="text-muted-foreground leading-relaxed">{active.description}</p>
              <div className="space-y-2 pt-1">
                {active.tools.map((tool) => (
                  <Link
                    key={tool.name}
                    href={tool.href}
                    className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    <ChevronRight className="h-4 w-4 shrink-0" />
                    {tool.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right: mockup */}
            <active.Mockup />
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  )
}
