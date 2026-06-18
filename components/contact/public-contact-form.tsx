"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Send, Lightbulb, AlertCircle, HelpCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const schema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    category: z.enum(["suggestion", "complaint", "general"] as const, {
        error: "Please select a category",
    }),
    subject: z.string().min(5, "Subject must be at least 5 characters").max(100, "Subject is too long"),
    message: z.string().min(20, "Message must be at least 20 characters").max(2000, "Message is too long"),
})

type FormData = z.infer<typeof schema>

const categories = [
    { value: "suggestion", label: "Suggestion", icon: Lightbulb, color: "text-yellow-500" },
    { value: "complaint", label: "Complaint", icon: AlertCircle, color: "text-red-500" },
    { value: "general", label: "General Inquiry", icon: HelpCircle, color: "text-blue-500" },
] as const

const hints: Record<string, string> = {
    suggestion: "We love new ideas! Describe your suggestion in as much detail as possible.",
    complaint: "We're sorry for the inconvenience. Please describe the issue and we'll resolve it as soon as we can.",
    general: "Feel free to ask anything. We'll get back to you at the email you provided.",
}

const hintStyles: Record<string, string> = {
    suggestion: "border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-300",
    complaint: "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10 text-red-800 dark:text-red-300",
    general: "border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-300",
}

export function PublicContactForm() {
    const [submitted, setSubmitted] = useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({ resolver: zodResolver(schema) })

    const selectedCategory = watch("category")

    async function onSubmit(data: FormData) {
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Submission failed")
            }
            setSubmitted(true)
            reset()
            toast.success("Message sent! We'll get back to you soon.")
        } catch (err: any) {
            toast.error(err.message || "Something went wrong. Please try again.")
        }
    }

    if (submitted) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center gap-4 py-20">
                    <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Send className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Message Received!</h2>
                    <p className="text-muted-foreground text-center max-w-sm">
                        Thanks for reaching out. We review every message and will respond to your email as soon as possible.
                    </p>
                    <Button variant="outline" onClick={() => setSubmitted(false)}>
                        Send Another Message
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="Your name"
                                {...register("name")}
                                className={cn(errors.name && "border-destructive")}
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                {...register("email")}
                                className={cn(errors.email && "border-destructive")}
                            />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>
                    </div>

                    <div className="grid gap-1.5">
                        <Label>Category</Label>
                        <Select
                            onValueChange={(val) =>
                                setValue("category", val as FormData["category"], { shouldValidate: true })
                            }
                        >
                            <SelectTrigger className={cn(errors.category && "border-destructive")}>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(({ value, label, icon: Icon, color }) => (
                                    <SelectItem key={value} value={value}>
                                        <span className="flex items-center gap-2">
                                            <Icon className={cn("h-4 w-4", color)} />
                                            {label}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
                    </div>

                    {selectedCategory && (
                        <div className={cn("flex items-start gap-2 rounded-lg border p-3 text-sm", hintStyles[selectedCategory])}>
                            {selectedCategory === "suggestion" && <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />}
                            {selectedCategory === "complaint" && <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                            {selectedCategory === "general" && <HelpCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                            <span>{hints[selectedCategory]}</span>
                        </div>
                    )}

                    <div className="grid gap-1.5">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            placeholder="Brief summary of your message"
                            {...register("subject")}
                            className={cn(errors.subject && "border-destructive")}
                        />
                        {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            placeholder="Tell us more..."
                            rows={6}
                            {...register("message")}
                            className={cn("resize-none", errors.message && "border-destructive")}
                        />
                        <div className="flex justify-between">
                            {errors.message
                                ? <p className="text-xs text-destructive">{errors.message.message}</p>
                                : <span />
                            }
                            <p className="text-xs text-muted-foreground">{watch("message")?.length ?? 0} / 2000</p>
                        </div>
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                        ) : (
                            <><Send className="mr-2 h-4 w-4" />Send Message</>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
