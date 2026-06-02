export const PLAN_LIMITS = {
    free: {
        resumes: 1,
        summaries: 3,
        flashcards: 3,
        interviews: 0,
        scanPages: 0,
        summaryMaxWords: 1000,
        studyPlanner: "basic" as const,
        interviewPrep: false,
        liveInterview: false,
    },
    standard: {
        resumes: 5,
        summaries: 20,
        flashcards: 15,
        interviews: 5,
        scanPages: 20,
        summaryMaxWords: 4000,
        studyPlanner: "full" as const,
        interviewPrep: true,
        liveInterview: false,
    },
    pro: {
        resumes: 15,
        summaries: 50,
        flashcards: 40,
        interviews: 10,
        scanPages: 100,
        summaryMaxWords: 6000,
        studyPlanner: "full" as const,
        interviewPrep: true,
        liveInterview: true,
    },
    max: {
        resumes: 30,
        summaries: 120,
        flashcards: 100,
        interviews: 20,
        scanPages: 300,
        summaryMaxWords: 10000,
        studyPlanner: "full" as const,
        interviewPrep: true,
        liveInterview: true,
    },
} as const

export type PlanKey = keyof typeof PLAN_LIMITS
export type FeatureKey = "resumes" | "summaries" | "flashcards" | "interviews" | "scanPages"

export const PLAN_DISPLAY_NAMES: Record<PlanKey, string> = {
    free: "Free",
    standard: "Standard",
    pro: "Pro",
    max: "Max",
}

export function getUpgradePlan(current: PlanKey): string {
    const order: PlanKey[] = ["free", "standard", "pro", "max"]
    const next = order[order.indexOf(current) + 1]
    return next ? PLAN_DISPLAY_NAMES[next] : "Max"
}
