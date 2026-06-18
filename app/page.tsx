import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { PricingCards } from "@/components/pricing/PricingCards"
import { AnimatedSection } from "@/components/ui/animated-section"
import { Hero } from "@/components/home/hero"
import { BeforeAfter } from "@/components/home/before-after"
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

        {/* 2. Before / After proof */}
        <BeforeAfter />

        {/* 3. Scenarios */}
        <ScenarioSection />

        {/* 4. Tools as Tabs */}
        <ToolsTabs />

        {/* 5. Pricing */}
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

        {/* 6. FAQ */}
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

        {/* 7. Final CTA */}
        <AnimatedSection>
          <section className="py-24 md:py-32 bg-background">
            <div className="container px-4 text-center max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                Ready to get your semester under control?
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Join our early-access community. Your feedback shapes what we build next.
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
