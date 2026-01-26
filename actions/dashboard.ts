"use server"

import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, limit, getCountFromServer, Timestamp } from "firebase/firestore"

export async function getDashboardStats(userId: string) {
  if (!userId) return null

  try {
    const now = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(now.getDate() - 7)

    // 1. Parallel Count Queries
    const tasksQuery = query(collection(db, "tasks"), where("userId", "==", userId), where("isCompleted", "==", true))
    const decksQuery = query(collection(db, "decks"), where("userId", "==", userId))
    const resumesQuery = query(collection(db, "resumes"), where("userId", "==", userId))

    // 2. Activity Logs (Last 7 Days)
    const logsQuery = query(
      collection(db, "activity_logs"),
      where("userId", "==", userId),
      where("createdAt", ">=", Timestamp.fromDate(sevenDaysAgo))
      // orderBy("createdAt", "desc") // Removed to avoid index error, sorting in memory
    )

    const [tasksSnap, decksSnap, resumesSnap, logsSnap] = await Promise.all([
      getCountFromServer(tasksQuery),
      getCountFromServer(decksQuery),
      getCountFromServer(resumesQuery),
      getDocs(logsQuery)
    ])

    // 3. Process Activity Logs
    const activityLogs = logsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate() // Convert Timestamp to Date for client serialization
    })).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime()) as any[]

    // Calculate Study Hours from logs
    // Assuming logs with action 'study_session' have a 'value' field in minutes
    const studyMinutes = activityLogs
      .filter(log => log.action === 'study_session')
      .reduce((acc, log) => acc + (log.value || 0), 0)

    const studyHours = Math.round((studyMinutes / 60) * 10) / 10 // 1 decimal place

    // 4. Calculate Weekly Chart Data
    const chartDataMap = new Map<string, number>()
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      const dayName = days[d.getDay()]
      chartDataMap.set(dayName, 0)
    }

    // Fill with data
    activityLogs.forEach(log => {
      if (log.action === 'study_session') {
        const dayName = days[new Date(log.createdAt).getDay()]
        if (chartDataMap.has(dayName)) {
          const hours = (log.value || 0) / 60
          chartDataMap.set(dayName, (chartDataMap.get(dayName) || 0) + hours)
        }
      }
    })

    const chartData = Array.from(chartDataMap).map(([name, total]) => ({ name, total: Math.round(total * 10) / 10 }))

    return {
      tasksCompleted: tasksSnap.data().count,
      flashcardsMastered: decksSnap.data().count,
      resumesCreated: resumesSnap.data().count,
      studyHours,
      recentActivity: activityLogs.slice(0, 5), // Top 5 recent
      chartData
    }

  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    // Return safe defaults to prevent crash
    return {
      tasksCompleted: 0,
      flashcardsMastered: 0,
      resumesCreated: 0,
      studyHours: 0,
      recentActivity: [],
      chartData: []
    }
  }
}
