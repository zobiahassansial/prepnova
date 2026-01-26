"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, Star } from "lucide-react"

interface UpgradeModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    featureName: string
}

export function UpgradeModal({ open, onOpenChange, featureName }: UpgradeModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        Upgrade to Unlock
                    </DialogTitle>
                    <DialogDescription>
                        You've reached your free limit for <strong>{featureName}</strong>. Upgrade to Standard or Pro to continue.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="border rounded-lg p-4 bg-muted/20">
                        <h4 className="font-semibold mb-2">Standard Plan ($7/mo)</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> 10 Resume Generations</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> 15 AI Summaries</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> Full Study Planner</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Link href="/#pricing" className="w-full sm:w-auto">
                        <Button className="w-full">View Upgrade Options</Button>
                    </Link>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
