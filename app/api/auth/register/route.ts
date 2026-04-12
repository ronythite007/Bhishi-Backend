import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/lib/authRepository";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  orgName: z.string().optional(),
  contact: z.string().min(3),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid registration payload", errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const session = await registerUser(parsed.data);
    const response = NextResponse.json({ data: session.user }, { status: 201 });
    const isProduction = process.env.NODE_ENV === "production";
    response.cookies.set("auth_token", session.token, {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      path: "/",
      expires: new Date(session.expiresAt),
    });
    return response;
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Registration failed" }, { status: 400 });
  }
}
