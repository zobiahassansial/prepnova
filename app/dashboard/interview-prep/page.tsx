import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mic, Code, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function InterviewPrepPage() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold tracking-tight">Interview Preparation</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:bg-muted/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mic className="h-5 w-5 text-primary" /> Behavioral Mock
                        </CardTitle>
                        <CardDescription>Practice standard behavioral questions with an AI interviewer.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/interview-prep/practice/behavioral">
                            <Button className="w-full">Start Session</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="hover:bg-muted/50 transition-colors opacity-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Code className="h-5 w-5 text-primary" /> Technical Coding
                        </CardTitle>
                        <CardDescription>Solve algorithmic problems with real-time feedback. (Coming Soon)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" disabled>Coming Soon</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
