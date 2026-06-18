import { getAdminSession } from "@/lib/admin-session"
import { AdminLoginForm } from "@/components/admin/login-form"
import { AdminDashboard } from "@/components/admin/dashboard"

export default async function AdminPage() {
  const authenticated = await getAdminSession()
  return authenticated ? <AdminDashboard /> : <AdminLoginForm />
}
