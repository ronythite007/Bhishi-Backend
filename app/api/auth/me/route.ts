import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromSessionToken } from "@/lib/authRepository";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ data: null }, { status: 200 });
  }

  const user = await getUserFromSessionToken(token);
  return NextResponse.json({ data: user }, { status: 200 });
}
