import { NextResponse } from "next/server"
export async function POST() {
    return NextResponse.json({ error: "2FA has been removed." }, { status: 410 })
}
