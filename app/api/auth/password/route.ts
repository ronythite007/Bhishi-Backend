import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getUserFromSessionToken, updateUserPassword } from "@/lib/authRepository";

const passwordSchema = z.object({
  newPassword: z.string().min(6),
});

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserFromSessionToken(token);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = passwordSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid password payload", errors: parsed.error.flatten() }, { status: 400 });
  }

  await updateUserPassword(user.id, parsed.data.newPassword);
  return NextResponse.json({ data: true }, { status: 200 });
}
