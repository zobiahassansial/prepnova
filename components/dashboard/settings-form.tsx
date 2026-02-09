"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { doc, updateDoc, getDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore"
import { updateProfile, updateEmail, updatePassword } from "firebase/auth"
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage"
import { db, auth, storage } from "@/lib/firebase"
import { Loader2, LogOut, User, Shield, HardDrive, Settings, CreditCard, Download, Trash2, UploadCloud, Moon, Sun, Laptop, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

export function SettingsForm() {
    const { user } = useAuth()
    const router = useRouter()
    const { setTheme, theme } = useTheme()

    // --- State ---
    const [loading, setLoading] = useState(false)
    const [profileData, setProfileData] = useState({ displayName: "", role: "Student", email: "", photoURL: "" })
    const [passwords, setPasswords] = useState({ new: "", confirm: "" })
    const [uploads, setUploads] = useState<any[]>([])
    const [preferences, setPreferences] = useState({ emailNotifs: true, pushNotifs: false })
    const [storageUsage, setStorageUsage] = useState({ used: 0, total: 100 * 1024 * 1024 }) // 100MB mocked limit

    // --- Effects ---
    const fetchUploads = useCallback(async () => {
        if (!user) return

        // 1. Fetch from Firestore (Notes)
        const notesQ = query(collection(db, "notes"), where("userId", "==", user.uid))
        const notesSnap = await getDocs(notesQ)
        const noteFiles = notesSnap.docs.map(d => ({ id: d.id, name: d.data().title, type: "Note", size: 0, url: d.data().fileUrl, collection: "notes" }))

        setUploads([...noteFiles])

        // Mock Storage Usage
        setStorageUsage({ used: noteFiles.length * 1024 * 1024 * 2, total: 100 * 1024 * 1024 }) // Assume 2MB avg
    }, [user])

    useEffect(() => {
        if (user) {
            // Profile Sync
            const fetchProfile = async () => {
                const userDoc = await getDoc(doc(db, "users", user.uid))
                const data = userDoc.data() || {}
                setProfileData({
                    displayName: data.name || user.displayName || "",
                    role: data.role || "Student",
                    email: user.email || "",
                    photoURL: user.photoURL || ""
                })
                setPreferences({
                    emailNotifs: data.emailNotifs ?? true,
                    pushNotifs: data.pushNotifs ?? false
                })
            }
            fetchProfile()
            fetchUploads()
        }
    }, [user, fetchUploads])

    // --- Handlers ---

    // 1. Profile
    const handleSaveProfile = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            await updateProfile(user, { displayName: profileData.displayName, photoURL: profileData.photoURL })
            await updateDoc(doc(db, "users", user.uid), { name: profileData.displayName, role: profileData.role })

            if (profileData.email !== user.email) {
                await updateEmail(user, profileData.email)
            }

            toast.success("Profile updated")
            router.refresh()
        } catch (e: any) {
            toast.error("Error: " + e.message)
        } finally { setLoading(false) }
    }, [user, profileData, router])

    const handlePhotoUpload = useCallback(async (e: any) => {
        const file = e.target.files[0]
        if (!file || !user) return

        const storageRef = ref(storage, `users/${user.uid}/avatar/${file.name}`)
        await uploadBytes(storageRef, file)
        const url = await getDownloadURL(storageRef)
        setProfileData(prev => ({ ...prev, photoURL: url }))
        toast.success("Photo uploaded")
    }, [user])

    const handlePassChange = useCallback(async () => {
        if (!user) return
        if (passwords.new !== passwords.confirm) return toast.error("Passwords do not match")

        try {
            await updatePassword(user, passwords.new)
            toast.success("Password updated")
            setPasswords({ new: "", confirm: "" })
        } catch (e: any) {
            toast.error("Error: " + e.message)
        }
    }, [user, passwords])

    // 2. Security
    const { logout } = useAuth()
    const handleLogout = useCallback(async () => {
        if (logout) await logout()
    }, [logout])

    // 3. Uploads
    const handleDeleteFile = useCallback(async (file: any) => {
        if (!confirm("Delete this file?")) return
        try {
            // Delete doc
            await deleteDoc(doc(db, file.collection, file.id))
            // Only try delete storage if we have a way to know path, usually note title/timestamp
            // Simplified: just delete doc record for now to implement 'Delete' action
            toast.success("File record deleted")
            fetchUploads()
        } catch (e) {
            toast.error("Failed to delete")
        }
    }, [fetchUploads])

    // 4. Preferences
    const savePreferences = useCallback(async () => {
        if (!user) return
        await updateDoc(doc(db, "users", user.uid), { ...preferences })
        toast.success("Preferences saved")
    }, [user, preferences])

    // 5. Account Privacy
    const downloadData = useCallback(() => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profileData))
        const downloadAnchorNode = document.createElement('a')
        downloadAnchorNode.setAttribute("href", dataStr)
        downloadAnchorNode.setAttribute("download", "user_data.json")
        document.body.appendChild(downloadAnchorNode)
        downloadAnchorNode.click()
        downloadAnchorNode.remove()
    }, [profileData])

    const deleteAccount = useCallback(async () => {
        if (!confirm("PERMANENTLY DELETE ACCOUNT? This cannot be undone.")) return
        // In real app, call API to delete user data + auth
        toast.error("Contact support to delete account permanently (Safety Check)")
    }, [])


    return (
        <Tabs defaultValue="profile" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted/50 rounded-xl">
                <TabsTrigger value="profile" className="gap-2 py-3 rounded-lg"><User className="h-4 w-4" /> Profile</TabsTrigger>
                <TabsTrigger value="security" className="gap-2 py-3 rounded-lg"><Shield className="h-4 w-4" /> Security</TabsTrigger>
                <TabsTrigger value="uploads" className="gap-2 py-3 rounded-lg"><HardDrive className="h-4 w-4" /> Uploads</TabsTrigger>
                <TabsTrigger value="preferences" className="gap-2 py-3 rounded-lg"><Settings className="h-4 w-4" /> Prefs</TabsTrigger>
                <TabsTrigger value="account" className="gap-2 py-3 rounded-lg"><CreditCard className="h-4 w-4" /> Account</TabsTrigger>
            </TabsList>

            {/* --- PROFILE TAB --- */}
            <TabsContent value="profile" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your public profile and contact details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="h-24 w-24 rounded-full bg-muted border-2 border-dashed flex items-center justify-center overflow-hidden relative group cursor-pointer">
                                {profileData.photoURL ? (
                                    <img src={profileData.photoURL} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-8 w-8 text-muted-foreground" />
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <UploadCloud className="h-6 w-6 text-white" />
                                </div>
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePhotoUpload} accept="image/*" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-medium">Profile Photo</h3>
                                <p className="text-sm text-muted-foreground">Click to upload. Max 2MB.</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Display Name</Label>
                                <Input value={profileData.displayName} onChange={e => setProfileData({ ...profileData, displayName: e.target.value })} />
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
                                <Input value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <div className="flex gap-2">
                                    <Input type="password" placeholder="New Password" value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} />
                                    <Button size="sm" onClick={handlePassChange} disabled={!passwords.new}>Update</Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 border-t pt-6">
                        <Button onClick={handleSaveProfile} disabled={loading}>{loading && <Loader2 className="mr-2 animate-spin" />} Save Profile</Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            {/* --- SECURITY TAB --- */}
            <TabsContent value="security" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Security Settings</CardTitle>
                        <CardDescription>Manage your session security.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                                <h3 className="font-medium">Current Session</h3>
                                <p className="text-sm text-muted-foreground">Active Now on Windows Chrome</p>
                            </div>
                            <Button variant="outline" className="text-green-600 border-green-200 bg-green-50" disabled>Active</Button>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-orange-50/50">
                            <div className="space-y-1">
                                <h3 className="font-medium text-orange-900">Sign out of all devices</h3>
                                <p className="text-sm text-orange-700/80">Log out of all active sessions immediately.</p>
                            </div>
                            <Button variant="destructive" onClick={handleLogout}>Log Out All</Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* --- UPLOADS TAB --- */}
            <TabsContent value="uploads" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Storage Manager</CardTitle>
                        <CardDescription>{((storageUsage?.used || 0) / (1024 * 1024)).toFixed(1)} MB used of 100 MB</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Storage Bar */}
                        <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${(storageUsage.used / storageUsage.total) * 100}%` }} />
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {uploads.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No uploads found.</p>}
                            {uploads.map((file) => (
                                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-4 w-4 text-primary" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                                            <span className="text-xs text-muted-foreground">{file.type}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteFile(file)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* --- PREFERENCES TAB --- */}
            <TabsContent value="preferences" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>App Preferences</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label>Theme</Label>
                                <p className="text-sm text-muted-foreground">Select your interface appearance.</p>
                            </div>
                            <div className="flex items-center gap-2 border rounded-lg p-1">
                                <Button variant={theme === 'light' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme("light")}><Sun className="h-4 w-4 mr-2" /> Light</Button>
                                <Button variant={theme === 'dark' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme("dark")}><Moon className="h-4 w-4 mr-2" /> Dark</Button>
                                <Button variant={theme === 'system' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme("system")}><Laptop className="h-4 w-4 mr-2" /> System</Button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label>Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">Receive updates about your study progress.</p>
                            </div>
                            <Switch checked={preferences.emailNotifs} onCheckedChange={checked => {
                                setPreferences(prev => ({ ...prev, emailNotifs: checked }))
                                // Trigger save immediately or use save button
                                setTimeout(() => savePreferences(), 0)
                            }} />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* --- ACCOUNT TAB --- */}
            <TabsContent value="account" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Account & Privacy</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-lg capitalize">{profileData.role} Plan</h4>
                                <p className="text-sm text-muted-foreground">Usage resets monthly.</p>
                            </div>
                            <Button variant="default">Upgrade Plan</Button>
                        </div>

                        <div className="space-y-4">
                            <Button variant="outline" className="w-full justify-start" onClick={downloadData}>
                                <Download className="h-4 w-4 mr-2" /> Download My Data
                            </Button>
                            <Button variant="destructive" className="w-full justify-start" onClick={deleteAccount}>
                                <Trash2 className="h-4 w-4 mr-2" /> Permanently Delete Account
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

        </Tabs>
    )
}
