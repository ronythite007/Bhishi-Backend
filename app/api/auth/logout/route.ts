import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logoutSession } from "@/lib/authRepository";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (token) {
    await logoutSession(token);
  }

  const response = NextResponse.json({ data: true }, { status: 200 });
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
    expires: new Date(0),
  });
  return response;
}
