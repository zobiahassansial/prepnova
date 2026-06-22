"use client"

import { Brain, Layers, Calendar, Briefcase } from "lucide-react"

const features = [
  {
    icon: Brain,
    colorBg: "bg-purple-500/10",
    colorIcon: "text-purple-600 dark:text-purple-400",
    colorBorder: "border-purple-500/20",
    title: "Smart Notes",
    description: "Turn PDFs and lecture notes into clear summaries.",
  },
  {
    icon: Layers,
    colorBg: "bg-pink-500/10",
    colorIcon: "text-pink-600 dark:text-pink-400",
    colorBorder: "border-pink-500/20",
    title: "Flashcards",
    description: "Review key concepts with AI-generated flashcards.",
  },
  {
    icon: Calendar,
    colorBg: "bg-green-500/10",
    colorIcon: "text-green-600 dark:text-green-400",
    colorBorder: "border-green-500/20",
    title: "Study Planner",
    description: "Organise deadlines, tasks, and revision in one plan.",
  },
  {
    icon: Briefcase,
    colorBg: "bg-blue-500/10",
    colorIcon: "text-blue-600 dark:text-blue-400",
    colorBorder: "border-blue-500/20",
    title: "Career Tools",
    description: "Build resumes and practise interviews with confidence.",
  },
]

export function BeforeAfter() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-muted/10 border-y">
      <div className="container px-4 md:px-6 mx-auto">

        <div className="text-center mb-14 space-y-3">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Everything for your semester, in one place.
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            One workspace for notes, flashcards, planning, and career prep — no more switching between apps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {features.map(({ icon: Icon, colorBg, colorIcon, colorBorder, title, description }) => (
            <div
              key={title}
              className="group rounded-xl border border-border bg-background/60 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-border/80"
            >
              <div className={`w-11 h-11 rounded-xl ${colorBg} border ${colorBorder} flex items-center justify-center mb-4`}>
                <Icon className={`h-5 w-5 ${colorIcon}`} />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
