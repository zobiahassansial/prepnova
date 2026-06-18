"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus } from "lucide-react"

const faqs = [
  {
    q: "Is PrepNova really free?",
    a: "Yes. The Free plan gives you 1 resume generation and 3 AI note summaries per month — no credit card needed. Upgrade any time if you need higher limits.",
  },
  {
    q: "How does the PDF summariser work?",
    a: "Upload a PDF or paste your notes as text. PrepNova reads the content and returns a plain-language summary with key bullet points. You can also generate a flashcard deck from the same upload at the same time.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes — cancel any time from your dashboard with no phone call, no form, and no questions. You keep access until the end of the billing period you already paid for.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Payments are processed securely through our payment provider. Available methods and currency options are shown at checkout.",
  },
]

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i
        return (
          <div key={i} className="rounded-xl border border-border bg-background overflow-hidden">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-foreground text-sm sm:text-base">
                {faq.q}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0 text-muted-foreground"
              >
                <Plus className="h-5 w-5" />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
