"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Brain } from "lucide-react"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { updateProfile } from "firebase/auth"


const UsernameSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
})

export default function UsernameOnboardingPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
    const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([])
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser)
                setPageLoading(false)
            } else {
                router.push("/login")
            }
        })
        return () => unsubscribe()
    }, [router])

    const form = useForm<z.infer<typeof UsernameSchema>>({
        resolver: zodResolver(UsernameSchema),
        defaultValues: {
            username: "",
        },
    })

    async function checkUsername(username: string) {
        if (!username || username.length < 3) return

        try {
            const res = await fetch(`/api/check-username?username=${username}`)
            const data = await res.json()

            if (data.available) {
                setUsernameAvailable(true)
                setUsernameSuggestions([])
                form.clearErrors("username")
            } else {
                setUsernameAvailable(false)
                setUsernameSuggestions(data.suggestions || [])
                form.setError("username", {
                    type: "manual",
                    message: "Username is already taken"
                })
            }
        } catch (error) {
            console.error("Error checking username:", error)
        }
    }

    async function onSubmit(values: z.infer<typeof UsernameSchema>) {
        if (!user) return
        setLoading(true)
        try {
            // Check availability one last time? Or trust the onBlur/state.
            // We'll proceed.

            await setDoc(
                doc(db, "users", user.uid),
                {
                    username: values.username.toLowerCase(),
                },
                { merge: true }
            )
            await updateProfile(user, {
                displayName: values.username,
            })



            toast.success("Username set successfully!")
            router.push("/onboarding")
        } catch (error) {
            console.error(error)
            toast.error("Failed to save username.")
        } finally {
            setLoading(false)
        }
    }

    if (pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Brain className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Choose a Username</CardTitle>
                    <CardDescription>Create a unique username to continue</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Username</label>
                            <input
                                {...form.register("username")}
                                onBlur={(e) => checkUsername(e.target.value)}
                                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${usernameAvailable === true ? "border-green-500" :
                                    usernameAvailable === false ? "border-red-500" : "border-input"
                                    }`}
                                placeholder="johndoe_123"
                            />
                            {usernameAvailable === true && (
                                <p className="text-xs text-green-500 mt-1">Username is available!</p>
                            )}
                            {usernameAvailable === false && (
                                <div className="mt-1">
                                    <p className="text-xs text-red-500">Username is taken.</p>
                                    {usernameSuggestions.length > 0 && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Suggestions:
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {usernameSuggestions.map(s => (
                                                    <span
                                                        key={s}
                                                        className="px-2 py-0.5 bg-muted rounded-md cursor-pointer hover:bg-muted/80"
                                                        onClick={() => {
                                                            form.setValue("username", s)
                                                            checkUsername(s)
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
                        <Button className="w-full" type="submit" disabled={loading || usernameAvailable === false}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Continue
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
