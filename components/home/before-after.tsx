"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { X, Check } from "lucide-react"

const before = [
  "45-page lecture PDF sitting unread on your desktop",
  "Dense, unstructured handwritten notes from three weeks ago",
  "No idea which topics to prioritise before the exam",
  "Resume you wrote once and never updated",
  "Interview nerves with no structured practice",
]

const after = [
  "A plain-language summary with key points, ready in seconds",
  "Auto-generated flashcard deck from the same notes",
  "A study schedule that fills your remaining days, topic by topic",
  "A resume the AI formats from whatever you describe",
  "Written interview feedback after every practice session",
]

export function BeforeAfter() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="how-it-works" className="py-24 md:py-32 border-y bg-muted/30" ref={ref}>
      <div className="container px-4 md:px-6 mx-auto">
        <div className="text-center mb-14 space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            See the AI at work
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            What you start with — and what PrepNova gives back.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">

          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="rounded-xl border border-border bg-background p-6 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                <X className="h-4 w-4 text-rose-500" />
              </div>
              <h3 className="font-semibold text-foreground">Without PrepNova</h3>
            </div>
            <ul className="space-y-3">
              {before.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.1 + 0.07 * i, duration: 0.35 }}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.18, ease: "easeOut" }}
            className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">With PrepNova</h3>
            </div>
            <ul className="space-y-3">
              {after.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.32 + 0.07 * i, duration: 0.35 }}
                  className="flex items-start gap-2.5 text-sm text-foreground/80"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
