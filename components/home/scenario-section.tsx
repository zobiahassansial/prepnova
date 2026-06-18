"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, FileText, Brain, ChevronRight } from "lucide-react"
import Link from "next/link"

const scenarios = [
  {
    id: "exam",
    icon: BookOpen,
    trigger: "I have an exam in 7 days",
    headline: "Get exam-ready in a week",
    steps: [
      {
        tool: "Note Summarizer",
        action:
          "Upload your lecture PDFs. PrepNova reads each one and returns a plain-language summary with the key points you actually need to know.",
        href: "/modules/note-summarizer",
      },
      {
        tool: "Flashcard System",
        action:
          "Generate a flashcard deck from the same content. Review the cards in daily sessions — the system tracks which ones you keep getting wrong.",
        href: "/modules/flashcards",
      },
      {
        tool: "Study Planner",
        action:
          "Enter your exam date and your subjects. The planner splits the remaining content across your available days so you always know what to work on next.",
        href: "/modules/study-planner",
      },
    ],
  },
  {
    id: "resume",
    icon: FileText,
    trigger: "I need a resume for an internship",
    headline: "Build a job-ready resume",
    steps: [
      {
        tool: "AI Resume Builder",
        action:
          "Describe your experience, education, and skills in plain sentences. The AI structures it into a clean, formatted resume ready to export and send.",
        href: "/modules/resume-builder",
      },
      {
        tool: "Interview Simulator",
        action:
          "Practise common internship interview questions in writing. You get specific written feedback on each answer — what worked and what to sharpen.",
        href: "/modules/interview-prep",
      },
    ],
  },
  {
    id: "catchup",
    icon: Brain,
    trigger: "I missed two lectures",
    headline: "Catch up without the stress",
    steps: [
      {
        tool: "Document Scanner",
        action:
          "Photograph a classmate's handwritten notes on your phone. The scanner converts the image to clean, readable, searchable text.",
        href: "/modules/document-scanner",
      },
      {
        tool: "Note Summarizer",
        action:
          "Paste the digitised notes and get a summary of the key ideas from both missed lectures in under a minute.",
        href: "/modules/note-summarizer",
      },
      {
        tool: "Flashcard System",
        action:
          "Turn the summary into a flashcard set so the new material sticks before the next class.",
        href: "/modules/flashcards",
      },
    ],
  },
]

export function ScenarioSection() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = scenarios.find((s) => s.id === activeId)

  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container px-4 md:px-6 mx-auto max-w-5xl">

        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Built around how students actually work
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Pick your situation. See exactly which tools apply.
          </p>
        </div>

        {/* Scenario triggers */}
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          {scenarios.map((s) => {
            const Icon = s.icon
            const isActive = activeId === s.id
            return (
              <button
                key={s.id}
                onClick={() => setActiveId(isActive ? null : s.id)}
                className={[
                  "flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer w-full",
                  isActive
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-border bg-background hover:border-primary/20 hover:bg-muted/40",
                ].join(" ")}
              >
                <div
                  className={[
                    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={[
                    "text-sm font-medium leading-tight",
                    isActive ? "text-primary" : "text-foreground",
                  ].join(" ")}
                >
                  {s.trigger}
                </span>
              </button>
            )
          })}
        </div>

        {/* Expanded panel */}
        <AnimatePresence>
          {active && (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.32, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-6 mt-2">
                <h3 className="font-semibold text-foreground mb-5 text-base">
                  {active.headline}
                </h3>
                <div className="space-y-5">
                  {active.steps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.07 * i, duration: 0.28 }}
                      className="flex gap-4"
                    >
                      <div className="flex flex-col items-center">
                        <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {i + 1}
                        </div>
                        {i < active.steps.length - 1 && (
                          <div className="w-px flex-1 bg-primary/15 my-1.5" />
                        )}
                      </div>
                      <div className="pb-1">
                        <Link
                          href={step.href}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline mb-1"
                        >
                          {step.tool}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step.action}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  )
}
