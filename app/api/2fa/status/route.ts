import { NextResponse } from "next/server"
export async function GET() {
    return NextResponse.json({ error: "2FA has been removed." }, { status: 410 })
}
