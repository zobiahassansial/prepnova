import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Brain, FileText, Calendar, ScanLine, Code2, Layers, X, Star } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative overflow-hidden bg-gradient-to-b from-background via-blue-50/50 to-background dark:via-blue-950/20">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200 mb-4">
                  New: AI Interview Prep Hub 🚀
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Master Your Studies & Career <br className="hidden md:block" /> with <span className="text-primary">AI-Powered Structure</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  The all-in-one platform for students. Generate resumes, plan study schedules, summarize notes, and practice for interviews — all in one place.
                </p>
              </div>
              <div className="space-x-4 pt-4">
                <Link href="/signup">
                  <Button size="lg" className="h-12 px-8 text-lg shadow-lg shadow-primary/20">
                    Start Learning Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
                    Explore Features
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                Powerful Features
              </div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Everything you need to succeed
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Click on any tool to learn more.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: FileText,
                  title: "AI Resume Builder",
                  description: "Create ATS-friendly resumes and cover letters in minutes with smart templates.",
                  slug: "resume-builder"
                },
                {
                  icon: Calendar,
                  title: "Smart Study Planner",
                  description: "Get personalized study schedules that adapt to your deadlines and pace.",
                  slug: "study-planner"
                },
                {
                  icon: Brain,
                  title: "Note Summarizer",
                  description: "Turn hours of lectures into concise summaries and fresh insights.",
                  slug: "note-summarizer"
                },
                {
                  icon: ScanLine,
                  title: "Document Scanner",
                  description: "Scan, crop, and OCR your physical notes into digital text.",
                  slug: "document-scanner"
                },
                {
                  icon: Layers,
                  title: "Flashcard System",
                  description: "Master concepts with spaced repetition and AI-generated decks.",
                  slug: "flashcards"
                },
                {
                  icon: Code2,
                  title: "Interview Prep",
                  description: "Practice coding questions, MCQs, and system design with AI feedback.",
                  slug: "interview-prep"
                }
              ].map((feature, index) => (
                <Link key={index} href={`/modules/${feature.slug}`} className="block">
                  <Card className="bg-card border-muted hover:border-primary/50 transition-all hover:shadow-md group h-full cursor-pointer">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <CardDescription className="text-base">{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-20">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Simple, Transparent Pricing</h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Choose the plan that fits your study needs.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">

              {/* Free Plan */}
              <Card className="flex flex-col border-muted shadow-sm order-1">
                <CardHeader>
                  <CardTitle className="text-2xl">Free</CardTitle>
                  <CardDescription>Basic access</CardDescription>
                  <div className="text-4xl font-bold mt-4">$0<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm">
                    {[
                      "3 Resume Generations",
                      "5 AI Summaries / month",
                      "3 Flashcard Decks",
                      "Basic Study Planner"
                    ].map((item) => (
                      <li key={item} className="flex items-center">
                        <CheckCircle2 className="mr-3 h-4 w-4 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="p-6 pt-0">
                  <Link href="/signup">
                    <Button variant="outline" className="w-full">Start for Free</Button>
                  </Link>
                </div>
              </Card>

              {/* Standard Plan */}
              <Card className="flex flex-col border-blue-200 shadow-sm order-2">
                <CardHeader>
                  <CardTitle className="text-2xl text-blue-600">Standard</CardTitle>
                  <CardDescription>For serious students</CardDescription>
                  <div className="text-4xl font-bold mt-4">$7<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm">
                    {[
                      "10 Resume Generations",
                      "15 AI Summaries / month",
                      "Full Study Planner",
                      "Flashcards AI Generation"
                    ].map((item) => (
                      <li key={item} className="flex items-center">
                        <CheckCircle2 className="mr-3 h-4 w-4 text-blue-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="p-6 pt-0">
                  <Link href="/signup">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">Upgrade to Standard</Button>
                  </Link>
                </div>
              </Card>

              {/* Pro Plan */}
              <Card className="flex flex-col border-primary shadow-lg relative overflow-hidden scale-105 z-10 order-3">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg">
                  RECOMMENDED
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">Pro</CardTitle>
                  <CardDescription>Unlock everything</CardDescription>
                  <div className="text-4xl font-bold mt-4">$15<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm">
                    {[
                      "20 Resume Generations",
                      "25 AI Summaries / month",
                      "Interview Prep Full Access",
                      "All AI features",
                      "Priority Support"
                    ].map((item) => (
                      <li key={item} className="flex items-center">
                        <CheckCircle2 className="mr-3 h-4 w-4 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="p-6 pt-0">
                  <Link href="/signup">
                    <Button className="w-full">Upgrade to Pro</Button>
                  </Link>
                </div>
              </Card>

              {/* Lifetime Plan */}
              <Card className="flex flex-col border-yellow-400/50 shadow-sm order-4 bg-yellow-50/10">
                <div className="absolute top-0 right-0 bg-yellow-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                  BEST VALUE
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">Lifetime <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /></CardTitle>
                  <CardDescription>Pay once, own forever</CardDescription>
                  <div className="text-4xl font-bold mt-4">$199<span className="text-base font-normal text-muted-foreground">/once</span></div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm">
                    {[
                      "Unlimited Resumes",
                      "Unlimited Summaries",
                      "Unlimited Flashcards",
                      "Unlimited Study Planner",
                      "Unlimited Interview Prep",
                      "Future Updates Included"
                    ].map((item) => (
                      <li key={item} className="flex items-center font-medium">
                        <CheckCircle2 className="mr-3 h-4 w-4 text-yellow-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="p-6 pt-0">
                  <Link href="/signup">
                    <Button variant="outline" className="w-full border-yellow-500 text-yellow-700 hover:bg-yellow-50">Get Lifetime Access</Button>
                  </Link>
                </div>
              </Card>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
