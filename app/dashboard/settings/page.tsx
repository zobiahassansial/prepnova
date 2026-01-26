import { SettingsForm } from "@/components/dashboard/settings-form"

export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>
            <SettingsForm />
        </div>
    )
}
