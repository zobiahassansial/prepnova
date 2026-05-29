"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import {
    doc, updateDoc, getDoc, collection, getDocs, deleteDoc,
    setDoc, onSnapshot, query, Timestamp
} from "firebase/firestore"
import {
    updateProfile, updatePassword, reauthenticateWithCredential,
    EmailAuthProvider, deleteUser as firebaseDeleteUser, sendPasswordResetEmail
} from "firebase/auth"
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, listAll, getMetadata } from "firebase/storage"
import { db, auth, storage } from "@/lib/firebase"
import {
    Loader2, LogOut, User, Shield, HardDrive, Settings, CreditCard,
    Download, Trash2, UploadCloud, Moon, Sun, Laptop, FileText, CheckCircle2,
    Lock, AlertTriangle, ExternalLink, Languages, Bell, Target
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useUserPlan } from "@/hooks/useUserPlan"
import Link from "next/link"

const STORAGE_LIMIT = 3 * 1024 * 1024 * 1024 // 3 GB

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function AutoSaveConfirmation({ show }: { show: boolean }) {
    if (!show) return null
    return (
        <span className="inline-flex items-center gap-1 text-xs text-green-600 animate-in fade-in duration-200">
            <CheckCircle2 className="h-3 w-3" /> Saved ✓
        </span>
    )
}

export function SettingsForm() {
    const { user } = useAuth()
    const router = useRouter()
    const { setTheme, theme } = useTheme()
    const { plan, limits, usage } = useUserPlan()

    // ── State ─────────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(false)
    const [profileData, setProfileData] = useState({
        displayName: "", role: "Student", email: "", photoURL: ""
    })
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" })
    const [deleteConfirm, setDeleteConfirm] = useState("")
    const [uploads, setUploads] = useState<any[]>([])
    const [storageUsed, setStorageUsed] = useState(0)
    const [storageLoading, setStorageLoading] = useState(true)
    const [preferences, setPreferences] = useState({
        emailNotifs: true,
        weeklyReport: true,
        taskReminders: true,
        featureAnnouncements: true,
        studyTarget: 40,
        language: "English"
    })
    const [prefSaved, setPrefSaved] = useState(false)
    const [subscription, setSubscription] = useState<any>(null)
    const [billingHistory, setBillingHistory] = useState<any[]>([])
    const [photoProgress, setPhotoProgress] = useState(0)
    const [photoUploading, setPhotoUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [resetEmailSent, setResetEmailSent] = useState(false)
    const [resetEmailError, setResetEmailError] = useState('')
    const [showChangePassword, setShowChangePassword] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordMsg, setPasswordMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
    const [passwordLoading, setPasswordLoading] = useState(false)

    // ── Effects ───────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!user) return

        // Profile
        const fetchProfile = async () => {
            const userDoc = await getDoc(doc(db, "users", user.uid))
            const data = userDoc.data() || {}
            setProfileData({
                displayName: data.name || user.displayName || "",
                role: data.role || "Student",
                email: user.email || "",
                photoURL: user.photoURL || data.photoURL || ""
            })
            setPreferences({
                emailNotifs: data.emailNotifs ?? true,
                weeklyReport: data.weeklyReport ?? true,
                taskReminders: data.taskReminders ?? true,
                featureAnnouncements: data.featureAnnouncements ?? true,
                studyTarget: data.studyTarget ?? 40,
                language: data.language ?? "English"
            })
        }
        fetchProfile()

        // Subscription
        const unsubSub = onSnapshot(doc(db, "users", user.uid, "subscription", "info"), (snap) => {
            setSubscription(snap.exists() ? snap.data() : { plan: "free" })
        })

        // Billing
        const fetchBilling = async () => {
            const billingSnap = await getDocs(collection(db, "users", user.uid, "billing"))
            setBillingHistory(billingSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        }
        fetchBilling()

        // Storage — list all uploaded files
        const loadStorage = async () => {
            setStorageLoading(true)
            try {
                const storageRef = ref(storage, `users/${user.uid}/uploads`)
                const list = await listAll(storageRef)
                const metaList = await Promise.all(list.items.map(item => getMetadata(item)))
                const files = metaList.map((meta, i) => ({
                    ref: list.items[i],
                    name: meta.name,
                    size: meta.size,
                    contentType: meta.contentType,
                    timeCreated: meta.timeCreated,
                    fullPath: meta.fullPath,
                }))
                setUploads(files)
                setStorageUsed(files.reduce((acc, f) => acc + f.size, 0))
            } catch {
                // Storage folder may not exist yet
                setUploads([])
                setStorageUsed(0)
            } finally {
                setStorageLoading(false)
            }
        }
        loadStorage()

        return () => unsubSub()
    }, [user])

    // ── Profile Handlers ──────────────────────────────────────────────────────
    const handleSaveProfile = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            await updateProfile(user, {
                displayName: profileData.displayName,
                photoURL: profileData.photoURL
            })
            await updateDoc(doc(db, "users", user.uid), {
                name: profileData.displayName,
                role: profileData.role,
                photoURL: profileData.photoURL,
                updatedAt: Timestamp.now()
            })
            toast.success("Profile updated successfully!")
            router.refresh()
        } catch (e: any) {
            toast.error("Failed to update profile: " + e.message)
        } finally {
            setLoading(false)
        }
    }, [user, profileData, router])

    const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        if (file.size > 2 * 1024 * 1024) {
            toast.error("Photo must be under 2MB")
            return
        }
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file")
            return
        }

        setPhotoUploading(true)
        setPhotoProgress(0)

        try {
            const storageRef = ref(storage, `users/${user.uid}/avatar/profile`)
            const uploadTask = uploadBytesResumable(storageRef, file)

            uploadTask.on("state_changed",
                (snapshot) => {
                    setPhotoProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100))
                },
                (error) => {
                    toast.error("Upload failed: " + error.message)
                    setPhotoUploading(false)
                },
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref)
                    await updateProfile(user, { photoURL: url })
                    await updateDoc(doc(db, "users", user.uid), { photoURL: url })
                    setProfileData(prev => ({ ...prev, photoURL: url }))
                    toast.success("Profile photo updated!")
                    setPhotoUploading(false)
                    setPhotoProgress(0)
                }
            )
        } catch (e: any) {
            toast.error("Upload failed: " + e.message)
            setPhotoUploading(false)
        }
    }, [user])

    // ── Password Handlers ─────────────────────────────────────────────────────
    const handlePassChange = useCallback(async () => {
        if (!user || !user.email) return
        if (passwords.new !== passwords.confirm) {
            toast.error("New passwords do not match")
            return
        }
        if (passwords.new.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }
        if (!passwords.current) {
            toast.error("Please enter your current password to verify identity")
            return
        }

        setLoading(true)
        try {
            // Re-authenticate first
            const credential = EmailAuthProvider.credential(user.email, passwords.current)
            await reauthenticateWithCredential(user, credential)
            await updatePassword(user, passwords.new)
            toast.success("Password updated successfully!")
            setPasswords({ current: "", new: "", confirm: "" })
        } catch (e: any) {
            if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
                toast.error("Current password is incorrect")
            } else {
                toast.error("Failed: " + e.message)
            }
        } finally {
            setLoading(false)
        }
    }, [user, passwords])

    // ── Send Reset Email ──────────────────────────────────────────────────────
    const handleSendResetEmail = useCallback(async () => {
        const currentUser = auth.currentUser
        if (!currentUser?.email) return
        setResetEmailError('')
        setResetEmailSent(false)
        setPasswordMsg(null)
        try {
            await sendPasswordResetEmail(auth, currentUser.email)
            setPasswordMsg({ type: 'success', text: `Password reset email sent to ${currentUser.email}` })
            setResetEmailSent(true)
            setTimeout(() => { setResetEmailSent(false); setPasswordMsg(null) }, 5000)
        } catch (err: unknown) {
            setPasswordMsg({ type: 'error', text: 'Failed to send reset email. Please try again.' })
        }
    }, [])

    // ── Change Password ───────────────────────────────────────────────────────
    const handleChangePassword = useCallback(async () => {
        setPasswordMsg(null)
        if (newPassword !== confirmPassword) {
            setPasswordMsg({ type: 'error', text: 'New passwords do not match.' })
            return
        }
        if (newPassword.length < 6) {
            setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
            return
        }
        const currentUser = auth.currentUser
        if (!currentUser?.email) return
        setPasswordLoading(true)
        try {
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword)
            await reauthenticateWithCredential(currentUser, credential)
            await updatePassword(currentUser, newPassword)
            setPasswordMsg({ type: 'success', text: 'Password changed successfully.' })
            setShowChangePassword(false)
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
        } catch (err: any) {
            const code = err?.code
            if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                setPasswordMsg({ type: 'error', text: 'Current password is incorrect.' })
            } else if (code === 'auth/too-many-requests') {
                setPasswordMsg({ type: 'error', text: 'Too many attempts. Try again later.' })
            } else {
                setPasswordMsg({ type: 'error', text: 'Failed to change password. Please try again.' })
            }
        } finally {
            setPasswordLoading(false)
        }
    }, [currentPassword, newPassword, confirmPassword])

    // ── Logout ────────────────────────────────────────────────────────────────
    const { logout } = useAuth()
    const handleLogout = useCallback(async () => {
        if (logout) await logout()
    }, [logout])

    // ── Upload File Delete ────────────────────────────────────────────────────
    const handleDeleteFile = useCallback(async (file: any) => {
        if (!confirm(`Delete "${file.name}"?`)) return
        try {
            await deleteObject(file.ref)
            setUploads(prev => prev.filter(f => f.name !== file.name))
            setStorageUsed(prev => prev - file.size)
            toast.success("File deleted")
        } catch (e: any) {
            toast.error("Failed to delete: " + e.message)
        }
    }, [])

    // ── Preferences ───────────────────────────────────────────────────────────
    const savePref = useCallback(async (updates: Partial<typeof preferences>) => {
        if (!user) return
        const merged = { ...preferences, ...updates }
        setPreferences(merged)
        try {
            await updateDoc(doc(db, "users", user.uid), {
                ...updates,
                updatedAt: Timestamp.now()
            })
            // Also sync studyTarget to settings subcollection
            if ("studyTarget" in updates) {
                await setDoc(doc(db, "users", user.uid, "settings", "studyTarget"), { value: updates.studyTarget })
            }
            setPrefSaved(true)
            setTimeout(() => setPrefSaved(false), 2500)
        } catch (e: any) {
            toast.error("Failed to save preferences")
        }
    }, [user, preferences])

    // ── Export My Data ────────────────────────────────────────────────────────
    const handleExportData = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            const [tasksSnap, resumesSnap, decksSnap, summariesSnap] = await Promise.all([
                getDocs(collection(db, "users", user.uid, "tasks")),
                getDocs(collection(db, "users", user.uid, "resumes")),
                getDocs(collection(db, "users", user.uid, "flashcardDecks")),
                getDocs(collection(db, "users", user.uid, "summaries")),
            ])

            const exportData = {
                exportedAt: new Date().toISOString(),
                profile: profileData,
                tasks: tasksSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                resumes: resumesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                flashcardDecks: decksSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                summaries: summariesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            }

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `prepnova_data_${new Date().toISOString().split("T")[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success("Data exported!")
        } catch (e: any) {
            toast.error("Export failed: " + e.message)
        } finally {
            setLoading(false)
        }
    }, [user, profileData])

    // ── Delete Account ────────────────────────────────────────────────────────
    const handleDeleteAccount = useCallback(async () => {
        if (!user || !user.email) return
        if (deleteConfirm !== "DELETE") {
            toast.error('Type "DELETE" to confirm')
            return
        }
        if (!passwords.current) {
            toast.error("Enter your current password to confirm deletion")
            return
        }

        setLoading(true)
        try {
            const credential = EmailAuthProvider.credential(user.email, passwords.current)
            await reauthenticateWithCredential(user, credential)

            // Delete user data
            const collections = ["tasks", "resumes", "flashcardDecks", "summaries", "activityLog", "studySessions"]
            for (const col of collections) {
                const snap = await getDocs(collection(db, "users", user.uid, col))
                await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
            }
            await deleteDoc(doc(db, "users", user.uid))
            await firebaseDeleteUser(user)

            toast.success("Account deleted. Goodbye!")
            router.push("/")
        } catch (e: any) {
            if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
                toast.error("Incorrect password")
            } else {
                toast.error("Failed: " + e.message)
            }
        } finally {
            setLoading(false)
        }
    }, [user, deleteConfirm, passwords.current, router])

    const storagePercent = Math.min(100, (storageUsed / STORAGE_LIMIT) * 100)
    const currentPlan = subscription?.plan || plan || "free"

    const planDisplayNames: Record<string, string> = {
        free: "Free Plan",
        standard: "Standard Plan",
        pro: "Pro Plan",
        lifetime: "Lifetime Plan",
    }

    return (
        <Tabs defaultValue="profile" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted/50 rounded-xl">
                <TabsTrigger value="profile" className="gap-2 py-3 rounded-lg"><User className="h-4 w-4" /> Profile</TabsTrigger>
                <TabsTrigger value="security" className="gap-2 py-3 rounded-lg"><Shield className="h-4 w-4" /> Security</TabsTrigger>
                <TabsTrigger value="uploads" className="gap-2 py-3 rounded-lg"><HardDrive className="h-4 w-4" /> Uploads</TabsTrigger>
                <TabsTrigger value="preferences" className="gap-2 py-3 rounded-lg"><Settings className="h-4 w-4" /> Prefs</TabsTrigger>
                <TabsTrigger value="account" className="gap-2 py-3 rounded-lg"><CreditCard className="h-4 w-4" /> Account</TabsTrigger>
            </TabsList>

            {/* ─── PROFILE TAB ───────────────────────────────────────────────────── */}
            <TabsContent value="profile" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your public profile and contact details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Avatar */}
                        <div className="flex items-center gap-6">
                            <div
                                className="h-24 w-24 rounded-full bg-muted border-2 border-dashed flex items-center justify-center overflow-hidden relative group cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {profileData.photoURL ? (
                                    <img src={profileData.photoURL} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-8 w-8 text-muted-foreground" />
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <UploadCloud className="h-6 w-6 text-white" />
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-medium">Profile Photo</h3>
                                <p className="text-sm text-muted-foreground">Click avatar to upload. Max 2MB.</p>
                                {photoUploading && (
                                    <div className="space-y-1">
                                        <div className="h-1.5 w-40 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-primary transition-all" style={{ width: `${photoProgress}%` }} />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Uploading... {photoProgress}%</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Display Name</Label>
                                <Input
                                    value={profileData.displayName}
                                    onChange={e => setProfileData({ ...profileData, displayName: e.target.value })}
                                    placeholder="Your name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select value={profileData.role} onValueChange={val => setProfileData({ ...profileData, role: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Student">Student</SelectItem>
                                        <SelectItem value="Professional">Professional</SelectItem>
                                        <SelectItem value="Lifelong Learner">Lifelong Learner</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    value={profileData.email}
                                    onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                                    type="email"
                                    disabled
                                    className="opacity-60"
                                />
                                <p className="text-xs text-muted-foreground">Email cannot be changed here for security.</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 border-t pt-6">
                        <Button onClick={handleSaveProfile} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Profile
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            {/* ─── SECURITY TAB ──────────────────────────────────────────────────── */}
            <TabsContent value="security" className="space-y-6">
                {/* Password & Security */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Password &amp; Security</CardTitle>
                        <CardDescription>Manage your password and account access.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3 flex-wrap">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => { setShowChangePassword(!showChangePassword); setPasswordMsg(null) }}
                            >
                                {showChangePassword ? 'Cancel' : 'Change Password'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleSendResetEmail}
                                disabled={passwordLoading}
                            >
                                Send Reset Email
                            </Button>
                        </div>

                        {showChangePassword && (
                            <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
                                <div className="space-y-2">
                                    <Label>Current Password</Label>
                                    <Input
                                        type="password"
                                        placeholder="Enter current password"
                                        value={currentPassword}
                                        onChange={e => setCurrentPassword(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>New Password</Label>
                                    <Input
                                        type="password"
                                        placeholder="At least 6 characters"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Confirm New Password</Label>
                                    <Input
                                        type="password"
                                        placeholder="Repeat new password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                                <Button
                                    onClick={handleChangePassword}
                                    disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                                    className="w-full"
                                >
                                    {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Password
                                </Button>
                            </div>
                        )}

                        {passwordMsg && (
                            <p className={`text-xs font-medium ${passwordMsg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                                {passwordMsg.type === 'success' ? '✓ ' : '⚠ '}{passwordMsg.text}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Active Sessions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Active Sessions</CardTitle>
                        <CardDescription>Manage your signed-in devices.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                                <h3 className="font-medium">Current Session</h3>
                                <p className="text-sm text-muted-foreground">
                                    Last sign-in: {user?.metadata?.lastSignInTime
                                        ? new Date(user.metadata.lastSignInTime).toLocaleDateString("en-US", {
                                            weekday: "long", year: "numeric", month: "short", day: "numeric",
                                            hour: "2-digit", minute: "2-digit"
                                        })
                                        : "Unknown"
                                    }
                                </p>
                            </div>
                            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-orange-50/50 dark:bg-orange-950/20">
                            <div className="space-y-1">
                                <h3 className="font-medium text-orange-900 dark:text-orange-200">Sign out of all devices</h3>
                                <p className="text-sm text-orange-700/80 dark:text-orange-400">Immediately log out all active sessions.</p>
                            </div>
                            <Button variant="destructive" size="sm" onClick={handleLogout}>Sign Out All</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Two-Factor Auth */}
                <Card>
                    <CardHeader>
                        <CardTitle>Two-Factor Authentication</CardTitle>
                        <CardDescription>Add an extra layer of security to your account.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <Shield className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">SMS / Authenticator App</p>
                                    <p className="text-sm text-muted-foreground">2FA is coming soon to PrepNova.</p>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">Coming Soon</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-red-200 dark:border-red-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" /> Danger Zone
                        </CardTitle>
                        <CardDescription>Permanently delete your account. This cannot be undone.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800 space-y-3">
                            <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                                ⚠️ All your data (tasks, resumes, flashcards, summaries) will be permanently deleted.
                            </p>
                            <div className="space-y-2">
                                <Label className="text-red-700 dark:text-red-400">
                                    Type <strong>DELETE</strong> to confirm:
                                </Label>
                                <Input
                                    value={deleteConfirm}
                                    onChange={e => setDeleteConfirm(e.target.value)}
                                    placeholder="DELETE"
                                    className="border-red-300 focus:ring-red-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-red-700 dark:text-red-400">Current Password:</Label>
                                <Input
                                    type="password"
                                    value={passwords.current}
                                    onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                    placeholder="Verify your identity"
                                    className="border-red-300"
                                />
                            </div>
                            <Button
                                variant="destructive"
                                className="w-full"
                                disabled={deleteConfirm !== "DELETE" || !passwords.current || loading}
                                onClick={handleDeleteAccount}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Permanently Delete My Account
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ─── UPLOADS TAB ───────────────────────────────────────────────────── */}
            <TabsContent value="uploads" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Storage Manager</CardTitle>
                        <CardDescription>
                            {storageLoading
                                ? "Calculating storage..."
                                : `${formatBytes(storageUsed)} used of 3 GB`
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Storage Bar */}
                        <div className="space-y-1">
                            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${storagePercent > 80 ? "bg-red-500" : storagePercent > 60 ? "bg-yellow-500" : "bg-primary"}`}
                                    style={{ width: `${storagePercent}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{formatBytes(storageUsed)} used</span>
                                <span>3 GB total</span>
                            </div>
                        </div>

                        {/* Files List */}
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {storageLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : uploads.length === 0 ? (
                                <div className="flex flex-col items-center py-12 text-center">
                                    <HardDrive className="h-10 w-10 text-muted-foreground/30 mb-3" />
                                    <p className="text-sm text-muted-foreground">No uploads yet.</p>
                                    <p className="text-xs text-muted-foreground mt-1">Files you upload in modules will appear here.</p>
                                </div>
                            ) : (
                                uploads.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <FileText className="h-4 w-4 text-primary shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatBytes(file.size)} · {new Date(file.timeCreated).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                                            onClick={() => handleDeleteFile(file)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ─── PREFERENCES TAB ───────────────────────────────────────────────── */}
            <TabsContent value="preferences" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            App Preferences
                            <AutoSaveConfirmation show={prefSaved} />
                        </CardTitle>
                        <CardDescription>All changes save automatically.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Theme */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="font-medium">Theme</Label>
                                <p className="text-sm text-muted-foreground">Select your interface appearance.</p>
                            </div>
                            <div className="flex items-center gap-1 border rounded-lg p-1">
                                <Button variant={theme === "light" ? "secondary" : "ghost"} size="sm" onClick={() => setTheme("light")}>
                                    <Sun className="h-4 w-4 mr-1" /> Light
                                </Button>
                                <Button variant={theme === "dark" ? "secondary" : "ghost"} size="sm" onClick={() => setTheme("dark")}>
                                    <Moon className="h-4 w-4 mr-1" /> Dark
                                </Button>
                                <Button variant={theme === "system" ? "secondary" : "ghost"} size="sm" onClick={() => setTheme("system")}>
                                    <Laptop className="h-4 w-4 mr-1" /> System
                                </Button>
                            </div>
                        </div>

                        <div className="border-t pt-6 space-y-4">
                            <Label className="font-medium flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</Label>
                            {[
                                { key: "weeklyReport", label: "Weekly Study Report", desc: "Receive a summary of your weekly progress" },
                                { key: "taskReminders", label: "Task Reminders", desc: "Get reminded about upcoming due dates" },
                                { key: "featureAnnouncements", label: "New Feature Announcements", desc: "Stay updated on new PrepNova features" },
                                { key: "emailNotifs", label: "General Email Notifications", desc: "Receive email updates about your account" },
                            ].map(({ key, label, desc }) => (
                                <div key={key} className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium">{label}</p>
                                        <p className="text-xs text-muted-foreground">{desc}</p>
                                    </div>
                                    <Switch
                                        checked={preferences[key as keyof typeof preferences] as boolean}
                                        onCheckedChange={checked => savePref({ [key]: checked })}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-6 space-y-3">
                            <Label className="font-medium flex items-center gap-2"><Target className="h-4 w-4" /> Default Study Goal</Label>
                            <div className="flex items-center gap-3">
                                <Input
                                    type="number"
                                    min={1}
                                    max={200}
                                    value={preferences.studyTarget}
                                    onChange={e => setPreferences(prev => ({ ...prev, studyTarget: Number(e.target.value) }))}
                                    onBlur={() => savePref({ studyTarget: preferences.studyTarget })}
                                    className="w-24"
                                />
                                <span className="text-sm text-muted-foreground">hours per week</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Synced with your dashboard study target.</p>
                        </div>

                        <div className="border-t pt-6 space-y-3">
                            <Label className="font-medium flex items-center gap-2"><Languages className="h-4 w-4" /> Language</Label>
                            <Select value={preferences.language} onValueChange={val => savePref({ language: val })}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="English">🇺🇸 English</SelectItem>
                                    <SelectItem value="Spanish" disabled>🇪🇸 Español (soon)</SelectItem>
                                    <SelectItem value="French" disabled>🇫🇷 Français (soon)</SelectItem>
                                    <SelectItem value="Arabic" disabled>🇸🇦 العربية (soon)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* ─── ACCOUNT TAB ───────────────────────────────────────────────────── */}
            <TabsContent value="account" className="space-y-6">
                {/* Current Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle>Current Plan</CardTitle>
                        <CardDescription>Your subscription and usage details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-lg">{planDisplayNames[currentPlan] || "Free Plan"}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {subscription?.currentPeriodEnd
                                        ? `Renews ${new Date(subscription.currentPeriodEnd.toDate()).toLocaleDateString()}`
                                        : "Usage resets monthly."
                                    }
                                </p>
                            </div>
                            <Link href="/#pricing">
                                <Button className="gap-2">
                                    Upgrade Plan <ExternalLink className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>

                        {/* Usage Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: "Resumes", used: usage.resumes ?? 0, limit: limits.resumes },
                                { label: "Summaries", used: usage.summaries ?? 0, limit: limits.summaries },
                                { label: "Flashcard Decks", used: usage.flashcards ?? 0, limit: limits.flashcards },
                            ].map(({ label, used, limit }) => (
                                <div key={label} className="p-3 border rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                                    <p className="font-bold text-sm">{used} / {limit >= 9999 ? "∞" : limit}</p>
                                    <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all"
                                            style={{ width: `${limit >= 9999 ? 0 : Math.min(100, (used / limit) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Billing History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Billing History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {billingHistory.length === 0 ? (
                            <div className="flex flex-col items-center py-8 text-center">
                                <CreditCard className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">No billing history.</p>
                                {currentPlan === "free" && (
                                    <p className="text-xs text-muted-foreground mt-1">Upgrade to a paid plan to see invoices here.</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {billingHistory.map(bill => (
                                    <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium capitalize">{bill.plan} Plan</p>
                                            <p className="text-xs text-muted-foreground">
                                                {bill.date?.toDate ? new Date(bill.date.toDate()).toLocaleDateString() : "N/A"}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">${(bill.amount / 100).toFixed(2)}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${bill.status === "paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                {bill.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Cancel Subscription */}
                {subscription?.plan && subscription.plan !== "free" && subscription.plan !== "lifetime" && (
                    <Card className="border-orange-200 dark:border-orange-900">
                        <CardHeader>
                            <CardTitle className="text-orange-700 dark:text-orange-400">Cancel Subscription</CardTitle>
                            <CardDescription>You'll retain access until end of billing cycle.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                variant="outline"
                                className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                onClick={() => {
                                    if (confirm("Are you sure you want to cancel your subscription? You'll keep access until the end of your current billing period.")) {
                                        toast.info("Cancellation requested. Contact support@prepnova.app to complete cancellation.")
                                    }
                                }}
                            >
                                Cancel Subscription
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Export Data */}
                <Card>
                    <CardHeader>
                        <CardTitle>Export My Data</CardTitle>
                        <CardDescription>Download all your PrepNova data as a JSON file.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" onClick={handleExportData} disabled={loading} className="gap-2">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            Export My Data
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
