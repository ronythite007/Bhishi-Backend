import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  let dbStatus: "ok" | "error" = "ok";

  try {
    await getPrisma().fund.findFirst({
      select: {
        id: true,
      },
    });
  } catch {
    dbStatus = "error";
  }

  return NextResponse.json({
    status: "ok",
    service: "chitti-bhishi-api",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
}
