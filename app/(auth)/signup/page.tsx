"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { Brain, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useSession } from "next-auth/react"

const SignupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function SignupPage() {
    const { status } = useSession()
    const [loading, setLoading] = useState(false)
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
    const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([])
    const router = useRouter()

    // Step 2 fields
    const [step, setStep] = useState<1 | 2>(1)
    const [userType, setUserType] = useState<'student' | 'professional'>('student')
    const [degree, setDegree] = useState('')
    const [gradeYear, setGradeYear] = useState('')
    const [subjects, setSubjects] = useState('')
    const [profession, setProfession] = useState('')
    const [industry, setIndustry] = useState('')

    const form = useForm<z.infer<typeof SignupSchema>>({
        resolver: zodResolver(SignupSchema),
        defaultValues: {
            name: "",
            username: "",
            email: "",
            password: "",
        },
    })

    const watchUsername = form.watch("username")

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/dashboard')
        }
    }, [status, router])

    // Real-time debounced username validation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (watchUsername && watchUsername.length >= 3) {
                checkUsername(watchUsername.toLowerCase())
            } else {
                setUsernameAvailable(null)
                setUsernameSuggestions([])
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [watchUsername])

    async function checkUsername(username: string) {
        if (!username || username.length < 3) return
        try {
            const res = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`)
            const data = await res.json()

            if (data.available === true) {
                setUsernameAvailable(true)
                setUsernameSuggestions([])
                form.clearErrors("username")
            } else {
                setUsernameAvailable(false)
                setUsernameSuggestions(data.suggestions || [])
                form.setError("username", { type: "manual", message: "Username is already taken" })
            }
        } catch (error) {
            console.error("Username check failed:", error)
        }
    }

    // Step 1: validate and advance to step 2
    function handleNext() {
        const values = form.getValues()
        if (!values.email || !values.email.includes('@')) {
            form.setError('email', { message: 'Please enter a valid email' })
            return
        }
        if (!values.password || values.password.length < 6) {
            form.setError('password', { message: 'Password must be at least 6 characters' })
            return
        }
        if (usernameAvailable === false) {
            toast.error("Please choose an available username.")
            return
        }
        setStep(2)
    }

    async function onSubmit(values: z.infer<typeof SignupSchema>) {
        if (step === 1) {
            handleNext()
            return
        }

        if (usernameAvailable === false) {
            toast.error("Please choose an available username.")
            return
        }

        setLoading(true)
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password)
            const user = userCredential.user

            await sendEmailVerification(user, {
                url: `${window.location.origin}/login`,
                handleCodeInApp: false,
            })

            await updateProfile(user, {
                displayName: values.name
            })

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: values.name,
                username: values.username.toLowerCase(),
                email: values.email,
                emailVerified: false,
                onboardingCompleted: false,
                createdAt: new Date(),
                userType,
                // Student fields
                degree: userType === 'student' ? degree : '',
                gradeYear: userType === 'student' ? gradeYear : '',
                subjects: userType === 'student' ? subjects : '',
                // Professional fields
                profession: userType === 'professional' ? profession : '',
                industry: userType === 'professional' ? industry : '',
                educationLevel: userType === 'student' ? 'Student' : 'Professional',
                plan: "free",
                streak: 0,
                resumeCount: 0,
                summaryCount: 0,
                flashcardCount: 0,
                monthlyResetAt: new Date(new Date().setMonth(new Date().getMonth() + 1))
            })

            toast.success("Account created! Verify your email before logging in.")
            router.push("/login")

        } catch (error: any) {
            console.error(error)
            if (error.code === 'auth/email-already-in-use') {
                toast.error("This email is already registered.")
                setStep(1)
            } else {
                toast.error(error.message || "Failed to create account")
            }
        } finally {
            setLoading(false)
        }
    }

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 py-12 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Brain className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Create an account</CardTitle>
                    <CardDescription>
                        {step === 1 ? "Join PrepNova and boost your studies" : "Tell us about yourself"}
                    </CardDescription>
                    {/* Step indicator */}
                    <div className="flex items-center justify-center gap-2 mt-3">
                        <div className={`h-2 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                        <div className={`h-2 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                    </div>
                </CardHeader>
                <CardContent>
                    {step === 1 ? (
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* Name Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <input
                                    {...form.register("name")}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                                    placeholder="John Doe"
                                    disabled={loading}
                                />
                                {form.formState.errors.name && (
                                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                                )}
                            </div>
                            
                            {/* Username Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Username</label>
                                <div className="relative">
                                    <input
                                        {...form.register("username")}
                                        onChange={(e) => {
                                            form.setValue("username", e.target.value)
                                            setUsernameAvailable(null)
                                            setUsernameSuggestions([])
                                        }}
                                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm pr-10
                                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                                            disabled:opacity-50 transition-colors
                                            ${usernameAvailable === true
                                                ? "border-green-500 focus-visible:ring-green-500"
                                                : usernameAvailable === false
                                                    ? "border-red-500 focus-visible:ring-red-500"
                                                    : "border-input focus-visible:ring-ring"
                                            }`}
                                        placeholder="johndoe_123"
                                        disabled={loading}
                                    />
                                    {usernameAvailable === true && (
                                        <CheckCircle2 className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
                                    )}
                                    {usernameAvailable === false && (
                                        <AlertCircle className="absolute right-3 top-2.5 h-5 w-5 text-red-500" />
                                    )}
                                </div>

                                {watchUsername.length >= 3 && usernameAvailable === true && (
                                    <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Username is available
                                    </p>
                                )}

                                {watchUsername.length >= 3 && usernameAvailable === false && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Username is already taken
                                        </p>
                                        {usernameSuggestions.length > 0 && (
                                            <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-lg">
                                                <p className="mb-1 font-semibold">Try these instead:</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {usernameSuggestions.map(s => (
                                                        <span
                                                            key={s}
                                                            className="px-2 py-1 bg-background border rounded-md cursor-pointer
                                                                hover:border-primary hover:text-primary transition-colors"
                                                            onClick={() => {
                                                                form.setValue("username", s)
                                                                checkUsername(s.toLowerCase())
                                                            }}
                                                        >
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {form.formState.errors.username?.type !== "manual" && watchUsername.length > 0 && (
                                    <p className="text-sm text-red-500">{form.formState.errors.username?.message}</p>
                                )}
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <input
                                    {...form.register("email")}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                                    placeholder="student@example.com"
                                    type="email"
                                    disabled={loading}
                                />
                                {form.formState.errors.email && (
                                    <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password</label>
                                <input
                                    {...form.register("password")}
                                    type="password"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                                {form.formState.errors.password && (
                                    <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                                )}
                            </div>

                            <Button
                                className="w-full mt-6"
                                type="button"
                                onClick={handleNext}
                                disabled={loading}
                            >
                                Next →
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            {/* User type toggle */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setUserType('student')}
                                    className={`py-3 rounded-xl text-sm font-medium transition-all ${userType === 'student' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border border-input'}`}
                                >
                                    🎓 Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUserType('professional')}
                                    className={`py-3 rounded-xl text-sm font-medium transition-all ${userType === 'professional' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border border-input'}`}
                                >
                                    💼 Professional
                                </button>
                            </div>

                            {userType === 'student' ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Degree / Program</label>
                                        <input
                                            value={degree}
                                            onChange={e => setDegree(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            placeholder="e.g. BSc Computer Science"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Year / Grade</label>
                                        <input
                                            value={gradeYear}
                                            onChange={e => setGradeYear(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            placeholder="e.g. Year 2, Grade 10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Main Subjects (optional)</label>
                                        <input
                                            value={subjects}
                                            onChange={e => setSubjects(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            placeholder="e.g. Math, Physics, Chemistry"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Profession / Job Title</label>
                                        <input
                                            value={profession}
                                            onChange={e => setProfession(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            placeholder="e.g. Software Engineer"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Industry</label>
                                        <input
                                            value={industry}
                                            onChange={e => setIndustry(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            placeholder="e.g. Technology, Finance, Healthcare"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setStep(1)}
                                    disabled={loading}
                                >
                                    ← Back
                                </Button>
                                <Button
                                    className="flex-1"
                                    type="button"
                                    onClick={form.handleSubmit(onSubmit)}
                                    disabled={loading}
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Account
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center flex-col gap-4">
                    <p className="text-sm text-muted-foreground">
                        Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Login</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}