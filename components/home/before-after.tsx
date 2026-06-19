"use client"

import { useRef } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"
import { FileText, Brain, Calendar } from "lucide-react"

export function BeforeAfter() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const reduced = useReducedMotion()

  function reveal(delay: number) {
    return {
      initial: { opacity: 0, y: reduced ? 0 : 10 },
      animate: inView ? { opacity: 1, y: 0 } : {},
      transition: {
        duration: reduced ? 0.15 : 0.45,
        delay: reduced ? 0 : delay,
        ease: "easeOut",
      },
    }
  }

  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-muted/10 border-y" ref={ref}>
      <div className="container px-4 md:px-6 mx-auto">

        {/* Eyebrow + heading */}
        <div className="text-center mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-[11px] font-semibold text-primary uppercase tracking-widest">
            From notes to a clearer plan
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            See the AI at work.
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Start with the material you already have. Use PrepNova to turn it into study resources you can work with.
          </p>
        </div>

        {/* Three-column composition */}
        <div className="flex flex-col lg:flex-row items-start gap-6 max-w-5xl mx-auto">

          {/* ── LEFT: source material ── */}
          <motion.div {...reveal(0)} className="flex-1 space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              What you start with
            </p>

            {/* PDF document preview */}
            <div className="rounded-xl border border-border bg-background shadow-sm p-4">
              <div className="flex items-start gap-2.5 mb-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-indigo-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground leading-tight">
                    Introduction to Cognitive Psychology
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Lecture PDF · 45 pages</p>
                </div>
              </div>
              <div className="space-y-1.5 pl-1">
                <div className="h-1.5 bg-muted rounded-full w-full" />
                <div className="h-1.5 bg-muted rounded-full w-5/6" />
                <div className="h-1.5 bg-muted rounded-full w-full" />
                <div className="h-1.5 bg-muted rounded-full w-4/5" />
                <div className="h-1.5 bg-muted rounded-full w-3/4" />
              </div>
            </div>

            {/* Handwritten notes snippet */}
            <div className="rounded-xl border border-amber-200/80 dark:border-amber-800/50 bg-amber-50/70 dark:bg-amber-900/10 p-3.5 rotate-[-0.4deg] shadow-sm">
              <p className="text-[11px] font-mono leading-[1.7] text-amber-900 dark:text-amber-200/90">
                Working memory → 7 ± 2 items<br />
                Schemas... check textbook pg 84<br />
                <span className="opacity-60">Selective vs divided attention??</span>
              </p>
            </div>

            {/* Deadline chip + label */}
            <div className="flex items-center gap-3 pt-0.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                Exam in 7 days
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Dense notes. No clear starting point.</p>
          </motion.div>

          {/* ── CENTER: connector ── */}
          <motion.div
            {...reveal(0.28)}
            className="flex lg:flex-col items-center justify-center gap-3 self-center shrink-0 py-2 lg:py-0 lg:px-4"
          >
            <div className="hidden lg:block w-px h-16 bg-gradient-to-b from-transparent via-border to-transparent" />
            <div className="flex flex-col items-center gap-2">
              <div className="h-9 w-9 rounded-full border border-primary/25 bg-primary/5 flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <p className="text-[10px] font-medium text-center text-muted-foreground leading-snug max-w-[90px]">
                Choose what to create next.
              </p>
            </div>
            <div className="hidden lg:block w-px h-16 bg-gradient-to-b from-transparent via-border to-transparent" />
            <span className="lg:hidden text-muted-foreground/40 text-sm">↓</span>
          </motion.div>

          {/* ── RIGHT: outputs ── */}
          <div className="flex-1 space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Useful study material, ready to review.
            </p>

            {/* 1. Summary panel */}
            <motion.div {...reveal(0.48)} className="rounded-xl border border-border bg-background shadow-sm p-4 space-y-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">AI Summary</span>
              </div>
              <p className="text-xs font-semibold text-foreground">
                Cognitive Psychology — Key Concepts
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Working memory holds items briefly; schemas organise information into existing knowledge structures.
              </p>
              <div className="space-y-1.5">
                {[
                  "Working memory capacity: ~7 ± 2 items (Miller's Law).",
                  "Schemas are mental frameworks for organising knowledge.",
                  "Selective attention filters out competing stimuli.",
                ].map((pt, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-foreground/75">
                    <span className="mt-1 h-1 w-1 rounded-full bg-primary/50 shrink-0" />
                    {pt}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 2. Flashcard */}
            <motion.div
              {...reveal(0.61)}
              className="rounded-xl border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 translate-x-2 shadow-sm"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">
                Flashcard
              </p>
              <p className="text-xs font-semibold text-foreground mb-2">
                What is the capacity of working memory?
              </p>
              <div className="border-t border-indigo-100 dark:border-indigo-800 pt-2">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Approximately 7 ± 2 items (Miller's Law). Items fade without active rehearsal.
                </p>
              </div>
            </motion.div>

            {/* 3. Weekly planner */}
            <motion.div {...reveal(0.74)} className="rounded-xl border border-border bg-background shadow-sm overflow-hidden -translate-x-1">
              <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-foreground">This week · Revision plan</span>
              </div>
              <div className="p-3 space-y-1.5">
                {[
                  { day: "Mon", task: "Read Ch. 4 — Attention",         cls: "bg-primary/5 text-primary border-primary/20" },
                  { day: "Wed", task: "Flashcard review — Memory",       cls: "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800" },
                  { day: "Fri", task: "Practice questions",              cls: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800" },
                ].map((item) => (
                  <div key={item.day} className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-muted-foreground w-6 shrink-0">{item.day}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${item.cls}`}>
                      {item.task}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  )
}
