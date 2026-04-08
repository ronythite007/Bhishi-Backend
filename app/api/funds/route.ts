import { NextResponse } from "next/server";
import { z } from "zod";
import { addFund, listFunds } from "@/lib/fundsRepository";

const createFundSchema = z.object({
  name: z.string().min(2),
  sharePrice: z.number().positive(),
});

export async function GET() {
  try {
    const funds = await listFunds();
    return NextResponse.json({ data: funds }, { status: 200 });
  } catch (error) {
    console.error("GET /api/funds failed", error);
    return NextResponse.json({ message: "Failed to list funds" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = createFundSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid fund payload",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const fund = await addFund(parsed.data);
    return NextResponse.json({ data: fund }, { status: 201 });
  } catch (error) {
    console.error("POST /api/funds failed", error);
    return NextResponse.json({ message: "Failed to create fund" }, { status: 500 });
  }
}
