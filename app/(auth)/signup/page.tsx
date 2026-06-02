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
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
    async function handleNext() {
        const valid = await form.trigger(['name', 'username', 'email', 'password'])
        if (!valid) return
        if (usernameAvailable === false) {
            toast.error("Please choose an available username.")
            return
        }
        const username = form.getValues('username')
        if (usernameAvailable === null && username.length >= 3) {
            toast.error("Still checking username availability — please wait a moment.")
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

            // Always complete profile + Firestore first — verification email is best-effort
            await updateProfile(user, { displayName: values.name })

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: values.name,
                username: values.username.toLowerCase(),
                email: values.email.trim().toLowerCase(),
                displayName: values.name,
                emailVerified: false,
                onboardingCompleted: true,
                createdAt: serverTimestamp(),
                userType,
                degree: userType === 'student' ? (degree || null) : null,
                gradeYear: userType === 'student' ? (gradeYear || null) : null,
                subjects: userType === 'student' ? subjects.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                profession: userType === 'professional' ? (profession || null) : null,
                industry: userType === 'professional' ? (industry || null) : null,
                educationLevel: userType === 'student' ? 'Student' : 'Professional',
                role: userType === 'student' ? 'Student' : 'Professional',
                plan: "free",
                streak: 0,
                resumeCount: 0,
                summaryCount: 0,
                flashcardCount: 0,
                monthlyResetAt: new Date(new Date().setMonth(new Date().getMonth() + 1))
            }, { merge: true })

            // Send verification email — failure here is non-fatal (e.g. unwhitelisted domain)
            try {
                await sendEmailVerification(user, {
                    url: `${window.location.origin}/login`,
                    handleCodeInApp: false,
                })
            } catch {
                // Verification email failed (common on non-whitelisted domains like ngrok).
                // Account is created — user will need to verify via Firebase Console or once domain is whitelisted.
            }

            // Sign out so login page enforces the email-verified check
            await auth.signOut()

            toast.success("Account created! Check your email to verify before logging in.")
            router.push("/login")

        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                toast.error("This email is already registered.")
                setStep(1)
            } else {
                console.error("Signup error:", error)
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
                                    Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUserType('professional')}
                                    className={`py-3 rounded-xl text-sm font-medium transition-all ${userType === 'professional' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border border-input'}`}
                                >
                                    Professional
                                </button>
                            </div>

                            {userType === 'student' ? (
                                <>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="degree">Degree / Program</Label>
                                        <select
                                            id="degree"
                                            value={degree}
                                            onChange={e => setDegree(e.target.value)}
                                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <option value="">Select your degree</option>
                                            <option value="Computer Science">Computer Science</option>
                                            <option value="Software Engineering">Software Engineering</option>
                                            <option value="Medicine / MBBS">Medicine / MBBS</option>
                                            <option value="Business Administration">Business Administration</option>
                                            <option value="Electrical Engineering">Electrical Engineering</option>
                                            <option value="Mechanical Engineering">Mechanical Engineering</option>
                                            <option value="Civil Engineering">Civil Engineering</option>
                                            <option value="Law / LLB">Law / LLB</option>
                                            <option value="Psychology">Psychology</option>
                                            <option value="Economics">Economics</option>
                                            <option value="Mathematics">Mathematics</option>
                                            <option value="Physics">Physics</option>
                                            <option value="Chemistry">Chemistry</option>
                                            <option value="Biology / Biosciences">Biology / Biosciences</option>
                                            <option value="Arts / Design">Arts / Design</option>
                                            <option value="Mass Communication">Mass Communication</option>
                                            <option value="High School">High School</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="grade">Year / Grade</Label>
                                        <select
                                            id="grade"
                                            value={gradeYear}
                                            onChange={e => setGradeYear(e.target.value)}
                                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <option value="">Select your year</option>
                                            <option value="High School Grade 9">High School — Grade 9</option>
                                            <option value="High School Grade 10">High School — Grade 10</option>
                                            <option value="High School Grade 11">High School — Grade 11 / O-Levels</option>
                                            <option value="High School Grade 12">High School — Grade 12 / A-Levels</option>
                                            <option value="Year 1">University — Year 1</option>
                                            <option value="Year 2">University — Year 2</option>
                                            <option value="Year 3">University — Year 3</option>
                                            <option value="Year 4">University — Year 4</option>
                                            <option value="Masters">Masters</option>
                                            <option value="PhD">PhD / Doctorate</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="subjects">Main Subjects <span className="text-muted-foreground font-normal">(optional)</span></Label>
                                        <Input
                                            id="subjects"
                                            placeholder="e.g. Calculus, OOP, Anatomy"
                                            value={subjects}
                                            onChange={e => setSubjects(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">Comma separated</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="profession">Job Title / Profession</Label>
                                        <Input
                                            id="profession"
                                            placeholder="e.g. Software Engineer, Doctor, Accountant"
                                            value={profession}
                                            onChange={e => setProfession(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="industry">Industry</Label>
                                        <select
                                            id="industry"
                                            value={industry}
                                            onChange={e => setIndustry(e.target.value)}
                                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <option value="">Select industry</option>
                                            <option value="Technology">Technology / IT</option>
                                            <option value="Healthcare">Healthcare / Medicine</option>
                                            <option value="Finance">Finance / Banking</option>
                                            <option value="Education">Education / Teaching</option>
                                            <option value="Engineering">Engineering</option>
                                            <option value="Marketing">Marketing / Advertising</option>
                                            <option value="Law">Law / Legal</option>
                                            <option value="Design">Design / Creative</option>
                                            <option value="Business">Business / Management</option>
                                            <option value="Other">Other</option>
                                        </select>
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