"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { doc, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/components/providers/auth-provider"
import { Loader2, GraduationCap, Briefcase, CheckCircle2 } from "lucide-react"

export function OnboardingForm() {
    const { user } = useAuth()
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [role, setRole] = useState("")

    // Form States
    const [studentData, setStudentData] = useState({
        institute: "",
        degree: "",
        subjects: ""
    })

    const [proData, setProData] = useState({
        jobTitle: "",
        careerGoal: "",
        targetRole: ""
    })

    const handleSave = async () => {
        if (!user) return
        setLoading(true)

        try {
            const userRef = doc(db, "users", user.uid)

            await setDoc(userRef, {
                educationLevel: role,
                ...(role === "student" ? studentData : proData),
                onboardingCompleted: true,
                updatedAt: new Date()
            }, { merge: true })

            toast.success("Profile updated!")
            router.push("/dashboard")
        } catch (error) {
            console.error(error)
            toast.error("Failed to save profile")
        } finally {
            setLoading(false)
        }
    }

    if (!user) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
            <Card className="max-w-xl w-full">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`h-2 w-full rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`}></div>
                        <div className={`h-2 w-full rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
                        <div className={`h-2 w-full rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
                    </div>
                    <CardTitle>Welcome to PrepNova! 👋</CardTitle>
                    <CardDescription>Let's personalize your experience.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {step === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button
                                variant={role === "student" ? "default" : "outline"}
                                className="h-32 flex flex-col gap-2"
                                onClick={() => setRole("student")}
                            >
                                <GraduationCap className="h-8 w-8" />
                                Student
                            </Button>
                            <Button
                                variant={role === "postgrad" ? "default" : "outline"}
                                className="h-32 flex flex-col gap-2"
                                onClick={() => setRole("postgrad")}
                            >
                                <GraduationCap className="h-8 w-8" />
                                Postgraduate
                            </Button>
                            <Button
                                variant={role === "professional" ? "default" : "outline"}
                                className="h-32 flex flex-col gap-2"
                                onClick={() => setRole("professional")}
                            >
                                <Briefcase className="h-8 w-8" />
                                Professional
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            {role === "student" && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Institute Name</Label>
                                        <Input value={studentData.institute} onChange={e => setStudentData({ ...studentData, institute: e.target.value })} placeholder="University of Technology" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Degree / Major</Label>
                                        <Input value={studentData.degree} onChange={e => setStudentData({ ...studentData, degree: e.target.value })} placeholder="Computer Science" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Key Subjects</Label>
                                        <Input value={studentData.subjects} onChange={e => setStudentData({ ...studentData, subjects: e.target.value })} placeholder="Data Structures, Algorithms" />
                                    </div>
                                </>
                            )}
                            {(role === "professional" || role === "postgrad") && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Current Job Title</Label>
                                        <Input value={proData.jobTitle} onChange={e => setProData({ ...proData, jobTitle: e.target.value })} placeholder="Software Engineer" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Career Goal</Label>
                                        <Input value={proData.careerGoal} onChange={e => setProData({ ...proData, careerGoal: e.target.value })} placeholder="Senior Developer / Manager" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Target Role</Label>
                                        <Input value={proData.targetRole} onChange={e => setProData({ ...proData, targetRole: e.target.value })} placeholder="Tech Lead" />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center space-y-4 py-8">
                            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full inline-flex">
                                <CheckCircle2 className="h-12 w-12 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold">You're all set!</h3>
                            <p className="text-muted-foreground">We've customized your dashboard based on your goals.</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    {step === 1 && (
                        <Button className="w-full" disabled={!role} onClick={() => setStep(2)}>Continue</Button>
                    )}
                    {step === 2 && (
                        <>
                            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                            <Button onClick={() => setStep(3)}>Continue</Button>
                        </>
                    )}
                    {step === 3 && (
                        <Button className="w-full" onClick={handleSave} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Go to Dashboard
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
