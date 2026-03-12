"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, CheckCircle2, Zap, Star, ShieldCheck } from "lucide-react" // Added icons
import { toast } from "sonner"
import { useAuth } from "@/components/providers/auth-provider"
import { Badge } from "@/components/ui/badge"

export default function SubscriptionPage() {
    const { user } = useAuth()

    const handleUpgrade = (plan: string) => {
        toast.info(`Upgrading to ${plan}... (Integration in progress)`)
    }

    return (
        <div className="container max-w-6xl py-10 space-y-10">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Choose Your Success Path</h1>
                <p className="text-xl text-muted-foreground">Unlock the full potential of your study, career, and interview prep.</p>
            </div>

            {/* Added 'group' class to the grid container */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 group">
                {/* Free Plan */}
                <Card className="flex flex-col border-muted relative transition-all duration-300 ease-in-out group-hover:scale-[0.96] group-hover:opacity-50 group-hover:blur-[1px] hover:!scale-105 hover:!opacity-100 hover:!blur-none hover:z-50 hover:shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-xl">Free</CardTitle>
                        <CardDescription>Essential basics</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">$0</span>
                            <span className="text-muted-foreground">/mo</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 3 Resume Generations</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 5 AI Summaries / mo</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> 3 Flashcard Decks</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Basic Study Planner</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant="outline" disabled>Current Plan</Button>
                    </CardFooter>
                </Card>

                {/* Standard Plan */}
                <Card className="flex flex-col border-blue-200 dark:border-blue-800 relative hover:border-blue-500/50 transition-all duration-300 ease-in-out group-hover:scale-[0.96] group-hover:opacity-50 group-hover:blur-[1px] hover:!scale-105 hover:!opacity-100 hover:!blur-none hover:z-50 hover:shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-xl text-blue-600 dark:text-blue-400">Standard</CardTitle>
                        <CardDescription>For serious students</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">$7</span>
                            <span className="text-muted-foreground">/mo</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-500" /> 10 Resume Generations</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-500" /> 15 AI Summaries / mo</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-500" /> Full Study Planner</li>
                            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-blue-500" /> Flashcard AI Gen</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleUpgrade("Standard")}>Upgrade to Standard</Button>
                    </CardFooter>
                </Card>

                {/* Pro Plan */}
                <Card className="flex flex-col border-primary shadow-lg relative transform scale-105 z-10 transition-all duration-300 ease-in-out group-hover:!scale-[0.96] group-hover:opacity-50 group-hover:blur-[1px] hover:!scale-110 hover:!opacity-100 hover:!blur-none hover:!z-50 hover:shadow-2xl">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground px-3 py-1">MOST POPULAR</Badge>
                    </div>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">Pro <Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" /></CardTitle>
                        <CardDescription>Maximum potential</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">$15</span>
                            <span className="text-muted-foreground">/mo</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> 20 Resume Generations</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> 25 AI Summaries / mo</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Interview Prep Full</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> All AI Features</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Priority Support</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" size="lg" onClick={() => handleUpgrade("Pro")}>Get Pro</Button>
                    </CardFooter>
                </Card>

                {/* Lifetime Plan */}
                <Card className="flex flex-col border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/10 relative transition-all duration-300 ease-in-out group-hover:scale-[0.96] group-hover:opacity-50 group-hover:blur-[1px] hover:!scale-105 hover:!opacity-100 hover:!blur-none hover:z-50 hover:shadow-2xl">
                    <div className="absolute top-0 right-0 bg-orange-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                        BEST VALUE
                    </div>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">Lifetime <Star className="h-4 w-4 fill-orange-500 text-orange-500" /></CardTitle>
                        <CardDescription>Pay once, own forever</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">$199</span>
                            <span className="text-muted-foreground"> one-time</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ul className="space-y-3 text-sm font-medium">
                            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-orange-500" /> Unlimited Resumes</li>
                            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-orange-500" /> Unlimited Summaries</li>
                            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-orange-500" /> Unlimited Flashcards</li>
                            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-orange-500" /> Unlimited Interview Prep</li>
                            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-orange-500" /> Lifetime Updates</li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white" onClick={() => handleUpgrade("Lifetime")}>Buy Lifetime</Button>
                    </CardFooter>
                </Card>
            </div>

            <div className="bg-muted p-8 rounded-lg text-center max-w-3xl mx-auto">
                <h3 className="font-semibold mb-2">Enterprise or Institution?</h3>
                <p className="text-sm text-muted-foreground mb-4">Get custom pricing for your university or organization.</p>
                <Button variant="outline">Contact Sales</Button>
            </div>
        </div>
    )
}