import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Brain, FileText, Calendar, ScanLine, Code2, Layers, Star, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PricingCards } from "@/components/pricing/PricingCards";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="flex-1">
        
        {/* ================= HERO SECTION (Enterprise Grade) ================= */}
        <section className="relative w-full py-24 md:py-32 lg:py-40 overflow-hidden border-b bg-background">
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] opacity-50"></div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-background/50 to-background"></div>
            
            <div className="container px-4 md:px-6 mx-auto">
                <div className="flex flex-col items-center space-y-8 text-center max-w-5xl mx-auto">
                
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-secondary/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
                    <span className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></span>
                    v2.0 System Update: Interview Hub Live
                </div>
                
                <div className="space-y-6">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-7xl text-foreground">
                    Academic performance <br />
                    <span className="text-primary">engineered by AI.</span>
                    </h1>
                    <p className="mx-auto max-w-2xl text-muted-foreground text-lg md:text-xl leading-relaxed font-normal">
                    A unified operating system for students. Automate note summarization, schedule optimization, and career preparation in one secure environment.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-6">
                    <Link href="/signup">
                    <Button size="lg" className="h-12 px-8 min-w-[200px] text-base font-medium shadow-sm rounded-md transition-all hover:translate-y-[-1px]">
                        Start Free Trial
                    </Button>
                    </Link>
                    <Link href="#features">
                    <Button variant="outline" size="lg" className="h-12 px-8 min-w-[200px] text-base font-medium bg-background rounded-md hover:bg-muted/50">
                        View Documentation
                    </Button>
                    </Link>
                </div>
                </div>
            </div>
        </section>

        {/* ================= INFINITE MARQUEE (Social Proof) ================= */}
        <section className="border-y bg-muted/20 py-10 overflow-hidden relative">
            <div className="container px-4 mx-auto mb-6 text-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Trusted by high achievers from</p>
            </div>
            
            <div className="relative flex overflow-x-hidden group">
                <div className="absolute top-0 bottom-0 left-0 w-24 z-10 bg-gradient-to-r from-background to-transparent"></div>
                <div className="absolute top-0 bottom-0 right-0 w-24 z-10 bg-gradient-to-l from-background to-transparent"></div>

                <div className="animate-marquee flex whitespace-nowrap gap-16 md:gap-32 items-center">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex gap-16 md:gap-32 items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            <span className="text-xl md:text-2xl font-bold text-foreground/80">STANFORD</span>
                            <span className="text-xl md:text-2xl font-bold text-foreground/80">MIT</span>
                            <span className="text-xl md:text-2xl font-bold text-foreground/80">HARVARD</span>
                            <span className="text-xl md:text-2xl font-bold text-foreground/80">OXFORD</span>
                            <span className="text-xl md:text-2xl font-bold text-foreground/80">CAMBRIDGE</span>
                            <span className="text-xl md:text-2xl font-bold text-foreground/80">PRINCETON</span>
                            <span className="text-xl md:text-2xl font-bold text-foreground/80">YALE</span>
                            <span className="text-xl md:text-2xl font-bold text-foreground/80">CALTECH</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* ================= PREMIUM FEATURE CARDS (Bento Grid) ================= */}
        <section id="features" className="w-full py-24 md:py-32 bg-muted/10 relative overflow-hidden">
          
          {/* Decorative Background Blurs */}
          <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="container px-4 md:px-6 mx-auto relative z-10">
            
            {/* Section Header */}
            <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-16">
                <div className="space-y-2 max-w-2xl">
                    <h2 className="text-3xl font-bold tracking-tight md:text-5xl text-foreground">
                        Core Capabilities
                    </h2>
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
            
            {/* The Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
              
              {/* Feature 1: Resume (Large Card) -> /modules/resume-builder */}
              <Card className="group relative md:col-span-2 overflow-hidden border-border/50 bg-background/60 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-1">
                {/* LINK ATTACHED HERE */}
                <Link href="/modules/resume-builder" className="absolute inset-0 z-20" aria-label="Go to Resume Builder"></Link>
                
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="relative z-10 flex flex-col h-full justify-between p-8">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300 border border-blue-500/20">
                        <FileText className="h-8 w-8" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold mb-3">AI Resume Builder</CardTitle>
                        <CardDescription className="text-base leading-relaxed max-w-md">
                            Build industry-standard resumes with ATS-optimized algorithms. Our engine formats your experience instantly to pass automated screens.
                        </CardDescription>
                    </div>
                </CardHeader>
                {/* Decorative Element */}
                <div className="absolute right-[-20px] bottom-[-20px] w-64 h-64 bg-gradient-to-tl from-blue-500/10 to-transparent rounded-full blur-2xl group-hover:blur-3xl transition-all" />
              </Card>

              {/* Feature 2: Summarizer (Tall Card) -> /modules/note-summarizer */}
              <Card className="group relative md:row-span-2 overflow-hidden border-border/50 bg-background/60 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:border-purple-500/30 hover:-translate-y-1">
                {/* LINK ATTACHED HERE */}
                <Link href="/modules/note-summarizer" className="absolute inset-0 z-20" aria-label="Go to Note Summarizer"></Link>

                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="relative z-10 flex flex-col h-full p-8">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform duration-300 border border-purple-500/20">
                        <Brain className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold mb-3">Note Summarizer</CardTitle>
                    <CardDescription className="text-base leading-relaxed mb-8">
                        Process complex PDFs into concise executive summaries. Save hours of reading time with AI-generated key points.
                    </CardDescription>
                    
                    {/* Visual Mockup */}
                    <div className="mt-auto w-full h-32 rounded-lg bg-muted/50 border border-border/50 relative overflow-hidden p-4 group-hover:bg-background transition-colors">
                        <div className="w-3/4 h-2 bg-foreground/10 rounded-full mb-2" />
                        <div className="w-full h-2 bg-foreground/10 rounded-full mb-2" />
                        <div className="w-5/6 h-2 bg-foreground/10 rounded-full mb-2" />
                        <div className="w-1/2 h-2 bg-foreground/10 rounded-full" />
                    </div>
                </CardHeader>
              </Card>

              {/* Feature 3: Scheduler (Standard Card) -> /modules/study-planner */}
              <Card className="group relative overflow-hidden border-border/50 bg-background/60 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10 hover:border-green-500/30 hover:-translate-y-1">
                {/* LINK ATTACHED HERE */}
                <Link href="/modules/study-planner" className="absolute inset-0 z-20" aria-label="Go to Study Planner"></Link>

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

              {/* Feature 4: OCR (Standard Card) -> /modules/document-scanner */}
              <Card className="group relative overflow-hidden border-border/50 bg-background/60 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:border-orange-500/30 hover:-translate-y-1">
                {/* LINK ATTACHED HERE */}
                <Link href="/modules/document-scanner" className="absolute inset-0 z-20" aria-label="Go to Document Scanner"></Link>

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

              {/* Feature 5: Flashcards (Standard Card) -> /modules/flashcards */}
              <Card className="group relative overflow-hidden border-border/50 bg-background/60 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/10 hover:border-pink-500/30 hover:-translate-y-1">
                {/* LINK ATTACHED HERE */}
                <Link href="/modules/flashcards" className="absolute inset-0 z-20" aria-label="Go to Flashcards"></Link>

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

              {/* Feature 6: Interview (Wide Card) -> /modules/interview-prep */}
              <Card className="group relative md:col-span-2 overflow-hidden border-border/50 bg-background/60 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 hover:-translate-y-1">
                {/* LINK ATTACHED HERE */}
                <Link href="/modules/interview-prep" className="absolute inset-0 z-20" aria-label="Go to Interview Prep"></Link>

                <div className="absolute inset-0 bg-gradient-to-bl from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="relative z-10 flex flex-row items-center gap-6 p-8 h-full">
                    <div className="w-16 h-16 shrink-0 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-300 border border-indigo-500/20">
                        <Code2 className="h-8 w-8" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold mb-2">Interview Simulator</CardTitle>
                        <CardDescription className="text-base leading-relaxed">
                            LLM-powered mock interviews. Practice technical and behavioral questions with real-time feedback.
                        </CardDescription>
                    </div>
                </CardHeader>
              </Card>

            </div>
          </div>
        </section> 
        
        {/* ================= TESTIMONIALS (Clean Cards) ================= */}
        <section className="py-24 bg-muted/20 border-y">
            <div className="container px-4 mx-auto">
                <h2 className="text-3xl font-bold text-center mb-16 tracking-tight">Loved by Students Worldwide</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            quote: "The PDF summarizer saved my life during finals. I summarized 500 pages in 10 minutes.",
                            author: "Sarah J.",
                            role: "Computer Science Student"
                        },
                        {
                            quote: "I landed my first internship using the AI Resume Builder. The templates are so professional!",
                            author: "Mike T.",
                            role: "Business Major"
                        },
                        {
                            quote: "Finally, a study planner that actually adapts when I miss a day. Highly recommended.",
                            author: "Emily R.",
                            role: "Med Student"
                        }
                    ].map((t, i) => (
                        <Card key={i} className="bg-background/80 backdrop-blur border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
                            <CardContent className="pt-8">
                                <div className="flex gap-1 text-yellow-500 mb-6">
                                    {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-current" />)}
                                </div>
                                <p className="text-muted-foreground mb-6 italic text-lg leading-relaxed">"{t.quote}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-400"></div>
                                    <div>
                                        <p className="font-bold text-sm">{t.author}</p>
                                        <p className="text-xs text-muted-foreground">{t.role}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

{/* ================= PRICING SECTION (Cards) ================= */}
        <section id="pricing" className="w-full py-32 bg-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-20">
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Simple, Transparent Pricing</h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Invest in your future for less than the price of a coffee.
              </p>
            </div>
            
            {/* Grid for cards — 3D animation handled by PricingCards client component */}
            <PricingCards />

          </div>
        </section>
{/* ================= FAQ SECTION (Premium Grid) ================= */}
        <section className="py-24 bg-muted/10 relative overflow-hidden">
            
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container px-4 max-w-6xl mx-auto relative z-10">
                
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
                        Common Queries
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Everything you need to know about the platform and billing.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    
                    {/* FAQ 1 */}
                    <Card className="group border-border/50 bg-background/50 backdrop-blur-lg hover:bg-primary/5 hover:border-primary/50 transition-all duration-300">
                        <CardHeader>
                            <div className="flex items-start gap-4">
                                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20 group-hover:scale-110 transition-transform">
                                    <Star className="h-5 w-5" />
                                </div>
                                <div className="space-y-2">
                                    <CardTitle className="text-lg font-bold">Is PrepNova really free?</CardTitle>
                                    <p className="text-muted-foreground leading-relaxed text-sm">
                                        Yes! Our Free plan gives you access to basic features like the Resume Builder (3 generations) and AI Summarizer (5/month). You can upgrade anytime.
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* FAQ 2 */}
                    <Card className="group border-border/50 bg-background/50 backdrop-blur-lg hover:bg-primary/5 hover:border-primary/50 transition-all duration-300">
                        <CardHeader>
                            <div className="flex items-start gap-4">
                                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20 group-hover:scale-110 transition-transform">
                                    <Brain className="h-5 w-5" />
                                </div>
                                <div className="space-y-2">
                                    <CardTitle className="text-lg font-bold">How does the PDF AI work?</CardTitle>
                                    <p className="text-muted-foreground leading-relaxed text-sm">
                                        Simply upload your lecture notes or textbook chapters (PDF). Our AI analyzes the text and provides a concise summary, key bullet points, and even generates flashcards from it.
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* FAQ 3 */}
                    <Card className="group md:col-span-2 border-border/50 bg-background/50 backdrop-blur-lg hover:bg-primary/5 hover:border-primary/50 transition-all duration-300">
                        <CardHeader>
                            <div className="flex items-start gap-4">
                                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-600 border border-green-500/20 group-hover:scale-110 transition-transform">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div className="space-y-2">
                                    <CardTitle className="text-lg font-bold">Can I cancel my subscription?</CardTitle>
                                    <p className="text-muted-foreground leading-relaxed text-sm max-w-3xl">
                                        Absolutely. You can cancel your monthly subscription at any time from your dashboard settings. You will retain access until the end of your billing cycle. No questions asked.
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                </div>
            </div>
        </section>
        
        {/* ================= FINAL CTA (Gradient) ================= */}
        <section className="py-32 relative overflow-hidden">
             <div className="absolute inset-0 bg-primary opacity-5 -z-10"></div>
            <div className="container px-4 text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Ready to Transform Your Grades?</h2>
                <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">Join thousands of students who are studying smarter, not harder.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/signup">
                        <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                            Get Started for Free
                        </Button>
                    </Link>
                </div>
                <p className="mt-6 text-sm text-muted-foreground">No credit card required for free plan.</p>
            </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}