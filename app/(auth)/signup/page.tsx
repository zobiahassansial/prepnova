"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { Brain, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { PhoneInput } from "react-international-phone"
import "react-international-phone/style.css"
import { useSession } from "next-auth/react"

const SignupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Invalid phone number"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    otp: z.string().optional()
})

export default function SignupPage() {
    const { status } = useSession()
    const [loading, setLoading] = useState(false)
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
    const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([])
    const [otpSent, setOtpSent] = useState(false)
    const [verifyingOtp, setVerifyingOtp] = useState(false)
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
    const [phoneVerified, setPhoneVerified] = useState(false)
    const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null)
    const router = useRouter()

    const form = useForm<z.infer<typeof SignupSchema>>({
        resolver: zodResolver(SignupSchema),
        defaultValues: {
            name: "",
            username: "",
            email: "",
            phone: "",
            password: "",
            otp: ""
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
        }, 500) // 500ms debounce

        return () => clearTimeout(timer)
    }, [watchUsername])

    async function checkUsername(username: string) {
        try {
            const res = await fetch(`/api/check-username?username=${username}`)
            const data = await res.json()

            if (data.available === true) {
                setUsernameAvailable(true)
                setUsernameSuggestions([])
                form.clearErrors("username")
            } else {
                setUsernameAvailable(false)
                setUsernameSuggestions(data.suggestions || [])
                form.setError("username", {
                    type: "manual",
                    message: "Username is already taken",
                })
            }
        } catch (error) {
            console.error("Username check failed:", error)
        }
    }

    const setupRecaptcha = () => {
        // Agar existing verifier hai, toh pehle usay clear karein taakay duplicate na banay
        if (recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current.clear();
            recaptchaVerifierRef.current = null;
        }

        try {
            const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response: any) => {
                    console.log("Recaptcha token generated");
                },
                'expired-callback': () => {
                    toast.error("reCAPTCHA expired. Please try again.");
                    // Expire hone par bhi clear kar dein
                    if (recaptchaVerifierRef.current) {
                        recaptchaVerifierRef.current.clear();
                        recaptchaVerifierRef.current = null;
                    }
                }
            });

            recaptchaVerifierRef.current = verifier;
            verifier.render();
            return verifier;

        } catch (error) {
            console.error("Recaptcha setup error:", error);
            return null;
        }
    }

    async function sendOTP() {
        const phone = form.getValues("phone")
        if (!phone || phone.length < 10) {
            toast.error("Please enter a valid phone number.")
            return
        }

        setLoading(true)
        const appVerifier = setupRecaptcha()

        if (!appVerifier) {
            setLoading(false)
            toast.error("Failed to initialize reCAPTCHA verifier.")
            return
        }

        try {
            const formattedPhone = phone.startsWith("+") ? phone : "+" + phone
            const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier)
            setConfirmationResult(result)
            setOtpSent(true)
            toast.success("OTP sent to your phone.")
        } catch (error: any) {
            console.error("Error sending OTP:", error)
            toast.error(error.message || "Failed to send OTP. Please try again.")
            // Reset reCAPTCHA if it fails
            if (recaptchaVerifierRef.current) {
                recaptchaVerifierRef.current.clear();
                recaptchaVerifierRef.current = null;
            }
        } finally {
            setLoading(false)
        }
    }

    async function verifyOTP() {
        const otp = form.getValues("otp")
        if (!otp || otp.length < 6) {
            toast.error("Please enter the 6-digit OTP.")
            return
        }

        if (!confirmationResult) {
            toast.error("OTP not sent yet.")
            return
        }

        setVerifyingOtp(true)
        try {
            await confirmationResult.confirm(otp)
            setPhoneVerified(true)
            toast.success("Phone number verified successfully!")
        } catch (error: any) {
            console.error("OTP verification failed:", error)
            toast.error("Invalid OTP. Please try again.")
        } finally {
            setVerifyingOtp(false)
        }
    }

    async function onSubmit(values: z.infer<typeof SignupSchema>) {
        if (!phoneVerified) {
            toast.error("Please verify your phone number first.")
            return
        }

        if (usernameAvailable === false) {
            toast.error("Please choose an available username.")
            return
        }

        setLoading(true)
        try {
            // 1. Create Firebase Auth User (This might link the phone auth if handled correctly, 
            // but for this flow we follow the requested structure: create with email/pass)
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password)
            const user = userCredential.user

            // 2. Send Verification Email
            await sendEmailVerification(user, {
                url: `${window.location.origin}/login`,
                handleCodeInApp: false,
            })

            // 3. Update Display Name
            await updateProfile(user, {
                displayName: values.name
            })

            // 4. Create Firestore User Profile
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: values.name,
                username: values.username.toLowerCase(),
                email: values.email,
                phoneNumber: values.phone,
                phoneVerified: true,
                emailVerified: false,
                onboardingCompleted: false,
                createdAt: new Date(),
                educationLevel: "Student",
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
                    <CardDescription>Join PrepNova and boost your studies</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <input
                                {...form.register("name")}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                                placeholder="John Doe"
                                disabled={otpSent && !phoneVerified}
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
                                    className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 ${usernameAvailable === true ? "border-green-500 ring-green-500" :
                                        usernameAvailable === false ? "border-red-500 ring-red-500" : "border-input"
                                        }`}
                                    placeholder="johndoe_123"
                                    disabled={otpSent && !phoneVerified}
                                />
                                {usernameAvailable === true && <CheckCircle2 className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />}
                                {usernameAvailable === false && <AlertCircle className="absolute right-3 top-2.5 h-5 w-5 text-red-500" />}
                            </div>

                            {usernameAvailable === true && (
                                <p className="text-xs text-green-600 font-medium">Username available — you can use this.</p>
                            )}

                            {usernameAvailable === false && (
                                <div className="space-y-2">
                                    <p className="text-xs text-red-600 font-medium">Username is already taken</p>
                                    {usernameSuggestions.length > 0 && (
                                        <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-lg">
                                            <p className="mb-1 font-semibold">Try these instead:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {usernameSuggestions.map(s => (
                                                    <span
                                                        key={s}
                                                        className="px-2 py-1 bg-background border rounded-md cursor-pointer hover:border-primary hover:text-primary transition-colors"
                                                        onClick={() => {
                                                            form.setValue("username", s)
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
                            {form.formState.errors.username && !usernameAvailable && (
                                <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
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
                                disabled={otpSent && !phoneVerified}
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
                                disabled={otpSent && !phoneVerified}
                            />
                            {form.formState.errors.password && (
                                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                            )}
                        </div>

                        {/* Phone Number Section */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone Number</label>
                            {!otpSent && !phoneVerified ? (
                                <div className="space-y-3">
                                    <PhoneInput
                                        defaultCountry="us"
                                        value={form.watch("phone")}
                                        onChange={(phone) => form.setValue("phone", phone)}
                                        className="w-full"
                                        inputClassName="!w-full !h-10 !text-sm !rounded-md !border-input !bg-background"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={sendOTP}
                                        disabled={loading || !form.watch("phone")}
                                    >
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Send OTP
                                    </Button>
                                </div>
                            ) : phoneVerified ? (
                                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-green-700">{form.getValues("phone")} (Verified)</span>
                                </div>
                            ) : otpSent && (
                                <div className="space-y-3">
                                    <p className="text-xs text-blue-600 font-medium bg-blue-50 p-2 rounded">OTP sent to your phone.</p>
                                    <div className="space-y-1">
                                        <input
                                            {...form.register("otp")}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            placeholder="Enter 6-digit OTP"
                                            maxLength={6}
                                        />
                                        <Button
                                            type="button"
                                            className="w-full"
                                            onClick={verifyOTP}
                                            disabled={verifyingOtp}
                                        >
                                            {verifyingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Verify OTP
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-xs"
                                            onClick={() => {
                                                setOtpSent(false)
                                                setConfirmationResult(null)
                                            }}
                                        >
                                            Change Number
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div id="recaptcha-container"></div>

                        <Button
                            className="w-full mt-6"
                            type="submit"
                            disabled={loading || !phoneVerified}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Account
                        </Button>
                    </form>
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
