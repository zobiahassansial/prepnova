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
import { Brain, Loader2, Eye, EyeOff } from "lucide-react"
import { signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"

const LoginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
})

import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"

export default function LoginPage() {
    const { status } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        if (status === 'authenticated') {
            router.push(callbackUrl)
        }
    }, [status, router, callbackUrl])



    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof LoginSchema>) {
        setLoading(true)
        try {
            const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password)
            const idToken = await userCredential.user.getIdToken()

            // Exchange Firebase ID Token for NextAuth Session Cookie
            console.log("[Login] Exchanging ID token for session...", { idTokenLength: idToken.length });
            const result = await import("next-auth/react").then(mod =>
                mod.signIn("credentials", {
                    idToken,
                    redirect: false,
                })
            )
            console.log("[Login] signIn result:", result);

            if (result?.error) {
                toast.error("Session creation failed.")
                return
            }

            toast.success("Logged in successfully!")
            router.push(callbackUrl)
        } catch (error: any) {
            console.error(error)
            if (error.code === 'auth/invalid-credential') {
                toast.error("Invalid email or password.")
            } else {
                toast.error("Login failed. Please try again.")
            }
        } finally {
            setLoading(false)
        }
    }

    const handleForgotPassword = async () => {
        const email = form.getValues("email")
        if (!email || !z.string().email().safeParse(email).success) {
            toast.error("Please enter a valid email address first.")
            return
        }

        try {
            await sendPasswordResetEmail(auth, email)
            toast.success("Password reset email sent! Check your inbox.")
        } catch (error) {
            toast.error("Failed to send reset email.")
        }
    }
    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider()
            const result = await signInWithPopup(auth, provider)
            const user = result.user

            // 1. Get ID Token
            const idToken = await user.getIdToken()

            // 2. Sync with NextAuth Session
            console.log("[Login] Google ID Token obtained, syncing session...", { idTokenLength: idToken.length });
            // We use redirect: false to prevent NextAuth from redirecting automatically, 
            // allowing us to control the flow and wait for the session to be established.
            const signInResult = await import("next-auth/react").then(mod =>
                mod.signIn("credentials", {
                    idToken,
                    redirect: false,
                })
            )
            console.log("[Login] Google signIn result:", signInResult);

            if (signInResult?.error) {
                toast.error("Failed to create session.")
                return
            }

            // 3. User & Onboarding Check
            const userRef = doc(db, "users", user.uid)
            const snap = await getDoc(userRef)

            toast.success("Logged in with Google!")

            if (!snap.exists() || !snap.data()?.onboardingCompleted) {
                router.push("/onboarding")
            } else {
                router.push(callbackUrl)
            }
            // Ensure we don't return before redirect happens
            return

        } catch (error: any) {
            console.error(error)
            if (error.code === 'auth/operation-not-allowed') {
                toast.error("Google Sign-In is not enabled in Firebase Console.")
            } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                // User closed popup or clicked multiple times, just ignore
                console.log("Sign-in cancelled by user")
            } else if (error.code === 'auth/popup-blocked') {
                toast.error("Popup blocked. Please allow popups for this site.")
            } else {
                toast.error("Google Login failed. Check console for details.")
            }
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
        <div className="min-h-screen flex items-center justify-center bg-muted/50">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Brain className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Welcome back</CardTitle>
                    <CardDescription>Login to your PrepNova account</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Password</label>
                                <button type="button" onClick={handleForgotPassword} className="text-sm text-primary hover:underline">Forgot password?</button>
                            </div>
                            <div className="relative">
                                <input
                                    {...form.register("password")}
                                    type={showPassword ? "text" : "password"}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {form.formState.errors.password && (
                                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                            )}
                        </div>
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin}>
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                            Google
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account? <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
