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
import { Brain, Loader2 } from "lucide-react"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

const SignupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

import { useSession } from "next-auth/react"

export default function SignupPage() {
    const { status } = useSession()
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/dashboard')
        }
    }, [status, router])

    const form = useForm<z.infer<typeof SignupSchema>>({
        resolver: zodResolver(SignupSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    })

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    async function onSubmit(values: z.infer<typeof SignupSchema>) {
        setLoading(true)

        try {
            // 1. Create Firebase Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password)
            const user = userCredential.user

            // 2. Update Display Name
            await updateProfile(user, {
                displayName: values.name
            })

            // 3. Create Firestore User Profile
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: values.name,
                email: values.email,
                createdAt: new Date(),
                educationLevel: "Student",
                plan: "free", // Default to free
                streak: 0,
                onboardingCompleted: false,
                // Quota Tracking
                resumeCount: 0,
                summaryCount: 0,
                flashcardCount: 0,
                monthlyResetAt: new Date(new Date().setMonth(new Date().getMonth() + 1)) // Reset next month
            })

            // 4. Success Feedback
            toast.success("Account created successfully!")

            // 5. Redirect to Dashboard
            router.push("/dashboard")

        } catch (error: any) {
            console.error(error)
            if (error.code === 'auth/email-already-in-use') {
                toast.error("This email is already registered.")
            } else {
                toast.error(error.message || "Failed to create account")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Brain className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Create an account</CardTitle>
                    <CardDescription>Get started with PrepNova today</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <input
                                {...form.register("name")}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="John Doe"
                            />
                            {form.formState.errors.name && (
                                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <input
                                {...form.register("email")}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="student@example.com"
                            />
                            {form.formState.errors.email && (
                                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <input
                                {...form.register("password")}
                                type="password"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="••••••••"
                            />
                            {form.formState.errors.password && (
                                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                            )}
                        </div>
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign Up
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account? <Link href="/login" className="text-primary hover:underline">Login</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
