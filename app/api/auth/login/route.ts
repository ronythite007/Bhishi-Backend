import { NextResponse } from "next/server";
import { z } from "zod";
import { loginUser } from "@/lib/authRepository";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid login payload", errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await loginUser(parsed.data.email, parsed.data.password);
    const response = NextResponse.json({ data: session.user }, { status: 200 });
    response.cookies.set("auth_token", session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(session.expiresAt),
    });
    return response;
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Login failed" }, { status: 401 });
  }
}
