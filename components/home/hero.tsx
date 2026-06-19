"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Sparkles, BookOpen } from "lucide-react"

function HeroPreview() {
  const prefersReduced = useReducedMotion()
  const [phase, setPhase] = useState<"input" | "output">(
    prefersReduced ? "output" : "input"
  )

  useEffect(() => {
    if (prefersReduced) return
    const t = setTimeout(() => setPhase("output"), 1800)
    return () => clearTimeout(t)
  }, [prefersReduced])

  return (
    <div className="w-full max-w-lg mx-auto lg:mx-0 relative">
      {/* Ambient glow behind card */}
      <div className="absolute -inset-4 bg-primary/8 blur-3xl rounded-3xl pointer-events-none" />

      {/* Floating status badge */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="absolute -top-3 right-6 z-10 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background px-3 py-1 text-xs font-medium text-primary shadow-sm"
      >
        <motion.span
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-1.5 w-1.5 rounded-full bg-primary"
        />
        AI Processing
      </motion.div>

      <div className="relative rounded-xl border border-border bg-card shadow-xl shadow-black/5 overflow-hidden">
        {/* App chrome bar — no specific URL */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-muted/50">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 flex-1 text-xs text-muted-foreground font-mono truncate">
            prepnova.online
          </span>
          <span className="text-[10px] text-muted-foreground/60 font-mono">Note Summarizer</span>
        </div>

        {/* Content */}
        <div className="p-5 min-h-[300px] relative">
          <AnimatePresence mode="wait">
            {phase === "input" ? (
              <motion.div
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-7 w-7 rounded bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-rose-500" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    lecture_4_photosynthesis.pdf · 45 pages
                  </span>
                </div>
                <div className="space-y-2">
                  {[95, 80, 100, 70, 90, 60, 100, 75, 85].map((w, i) => (
                    <div
                      key={i}
                      className="h-2 rounded-full bg-muted"
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
                <motion.div
                  className="mt-5 flex items-center gap-2 text-xs text-primary"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Analysing and summarising…
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="output"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="space-y-5"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 border border-primary/20">
                    <Sparkles className="h-3 w-3" />
                    Summary ready
                  </span>
                </div>

                <div className="space-y-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Key Points
                  </p>
                  {[
                    "Light reactions in the thylakoid membrane convert sunlight into ATP and NADPH.",
                    "The Calvin cycle fixes CO₂ into 3-carbon sugars using the energy from ATP.",
                    "Chlorophyll absorbs red and blue light; reflects green — why leaves look green.",
                  ].map((point, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 * i + 0.1, duration: 0.3 }}
                      className="flex items-start gap-2 text-sm text-foreground/80 leading-snug"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {point}
                    </motion.div>
                  ))}
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    Flashcards generated
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {["What is ATP?", "Light vs Dark reactions", "Role of chlorophyll"].map(
                      (card, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0.92 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.55 + 0.1 * i, duration: 0.3 }}
                          className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 text-primary text-xs px-2.5 py-1 font-medium"
                        >
                          <BookOpen className="h-3 w-3" />
                          {card}
                        </motion.span>
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="mt-4 text-xs text-center text-muted-foreground">
        Paste notes or upload a PDF — get a summary and flashcards in seconds.
      </p>
    </div>
  )
}

export function Hero() {
  return (
    <section className="w-full pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 xl:gap-20 items-center">

          {/* Text */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-primary" />
              Now in Early Access — share your feedback
            </div>

            <div className="space-y-5">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-foreground leading-[1.12]">
                Academic Learning
                <br />
                <span className="text-primary">with AI.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0">
                Turn lecture notes into summaries and flashcards, plan a week that adapts to your deadlines, build a resume, and practise interviews — all in one workspace.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="h-12 px-7 text-base font-semibold rounded-lg shadow-md shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  Start for Free
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-7 text-base font-medium rounded-lg border-border hover:bg-muted/50 transition-all"
                >
                  See How It Works
                </Button>
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              No credit card required · Free plan available · Built for students.
            </p>
          </div>

          {/* Animated preview */}
          <HeroPreview />
        </div>
      </div>
    </section>
  )
}
