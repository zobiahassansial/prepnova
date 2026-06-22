import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowRight, Brain, FileText, Calendar, ScanLine, Code2, Layers } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { PricingCards } from "@/components/pricing/PricingCards"
import { AnimatedSection } from "@/components/ui/animated-section"
import { Hero } from "@/components/home/hero"
import { ScenarioSection } from "@/components/home/scenario-section"
import { ToolsTabs } from "@/components/home/tools-tabs"
import { FaqAccordion } from "@/components/home/faq-accordion"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans antialiased">
      <Navbar />

      <main className="flex-1">

        {/* 1. Hero */}
        <Hero />

        {/* 2. Core Capabilities */}
        <AnimatedSection>
          <section id="features" className="w-full py-24 md:py-32 bg-muted/10 relative overflow-hidden">
            <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
              <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-16">
                <div className="space-y-2 max-w-2xl">
                  <h2 className="text-3xl font-bold tracking-tight md:text-5xl text-foreground">Core Capabilities</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Powerful tools designed to replace your fragmented study stack.
                  </p>
                </div>
                <Link href="/signup">
                  <Button variant="outline" className="group border-primary/20 hover:bg-primary/5 hover:border-primary/50 transition-all">
                    Explore all features <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[240px]">

                {/* AI Resume Builder — wide card */}
                <Card className="group relative md:col-span-2 overflow-hidden border-border/50 bg-background/60 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-1">
                  <Link href="/modules/resume-builder" className="absolute inset-0 z-20" aria-label="Go to Resume Builder" />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="relative z-10 flex flex-col h-full justify-between p-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform duration-300 border border-blue-500/20">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold mb-2">AI Resume Builder</CardTitle>
                      <CardDescription className="text-sm leading-relaxed max-w-md">
                        Build industry-standard resumes with ATS-optimized algorithms. Our engine formats your experience instantly to pass automated screens.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <div className="absolute right-[-20px] bottom-[-20px] w-64 h-64 bg-gradient-to-tl from-blue-500/10 to-transparent rounded-full blur-2xl group-hover:blur-3xl transition-all" />
                </Card>

                {/* Note Summarizer — tall card */}
                <Card className="group relative md:row-span-2 overflow-hidden border-border/50 bg-background/60 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:border-purple-500/30 hover:-translate-y-1">
                  <Link href="/modules/note-summarizer" className="absolute inset-0 z-20" aria-label="Go to Note Summarizer" />
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="relative z-10 flex flex-col h-full p-6">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform duration-300 border border-purple-500/20">
                      <Brain className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg font-bold mb-2">Note Summarizer</CardTitle>
                    <CardDescription className="text-sm leading-relaxed mb-4">
                      Process complex PDFs into concise executive summaries. Save hours of reading time with AI-generated key points.
                    </CardDescription>
                    <div className="mt-auto w-full h-20 rounded-lg bg-muted/50 border border-border/50 relative overflow-hidden p-4 group-hover:bg-background transition-colors">
                      <div className="w-3/4 h-2 bg-foreground/10 rounded-full mb-2" />
                      <div className="w-full h-2 bg-foreground/10 rounded-full mb-2" />
                      <div className="w-5/6 h-2 bg-foreground/10 rounded-full mb-2" />
                      <div className="w-1/2 h-2 bg-foreground/10 rounded-full" />
                    </div>
                  </CardHeader>
                </Card>

                {/* Smart Study Planner */}
                <Card className="group relative overflow-hidden border-border/50 bg-background/60 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10 hover:border-green-500/30 hover:-translate-y-1">
                  <Link href="/modules/study-planner" className="absolute inset-0 z-20" aria-label="Go to Study Planner" />
                  <CardHeader className="p-8">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform border border-green-500/20">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold">Smart Study Planner</CardTitle>
                    <CardDescription className="mt-2">
                      Dynamic time-blocking engine that adjusts to your syllabus deadlines.
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Document Scanner */}
                <Card className="group relative overflow-hidden border-border/50 bg-background/60 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:border-orange-500/30 hover:-translate-y-1">
                  <Link href="/modules/document-scanner" className="absolute inset-0 z-20" aria-label="Go to Document Scanner" />
                  <CardHeader className="p-8">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform border border-orange-500/20">
                      <ScanLine className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold">Document Scanner</CardTitle>
                    <CardDescription className="mt-2">
                      Digitize handwritten notes into searchable text with high fidelity.
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Flashcard System */}
                <Card className="group relative overflow-hidden border-border/50 bg-background/60 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/10 hover:border-pink-500/30 hover:-translate-y-1">
                  <Link href="/modules/flashcards" className="absolute inset-0 z-20" aria-label="Go to Flashcards" />
                  <CardHeader className="p-8">
                    <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-600 mb-4 group-hover:scale-110 transition-transform border border-pink-500/20">
                      <Layers className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold">Flashcard System</CardTitle>
                    <CardDescription className="mt-2">
                      Automated flashcard generation utilizing spaced repetition protocols.
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Interview Simulator — wide card */}
                <Card className="group relative md:col-span-2 overflow-hidden border-border/50 bg-background/60 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 hover:-translate-y-1">
                  <Link href="/modules/interview-prep" className="absolute inset-0 z-20" aria-label="Go to Interview Prep" />
                  <div className="absolute inset-0 bg-gradient-to-bl from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="relative z-10 flex flex-row items-center gap-5 p-6 h-full">
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-300 border border-indigo-500/20">
                      <Code2 className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold mb-1.5">Interview Simulator</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        LLM-powered mock interviews. Practice technical and behavioral questions with real-time feedback.
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>

              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* 3. See AI at Work — tabs */}
        <ToolsTabs />

        {/* 5. Scenarios */}
        <ScenarioSection />

        {/* 6. Pricing */}
        <AnimatedSection>
          <section id="pricing" className="w-full py-24 md:py-32 bg-background">
            <div className="container px-4 md:px-6 mx-auto">
              <div className="flex flex-col items-center text-center gap-4 mb-16">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  Simple, transparent pricing
                </h2>
                <p className="text-muted-foreground text-lg max-w-md">
                  Start free. Upgrade when you need more.
                </p>
              </div>
              <PricingCards />
            </div>
          </section>
        </AnimatedSection>

        {/* 7. FAQ */}
        <AnimatedSection>
          <section className="py-24 bg-muted/20 border-y">
            <div className="container px-4 max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight text-foreground text-center mb-12">
                Common questions
              </h2>
              <FaqAccordion />
            </div>
          </section>
        </AnimatedSection>

        {/* 8. Final CTA */}
        <AnimatedSection>
          <section className="py-24 md:py-32 bg-background">
            <div className="container px-4 text-center max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                Your semester, under control.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Stay organised, study smarter, and be ready for every deadline.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base font-semibold rounded-lg shadow-md shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                  >
                    Get Started for Free
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                No credit card required for the free plan.
              </p>
            </div>
          </section>
        </AnimatedSection>

      </main>

      <Footer />
    </div>
  )
}
