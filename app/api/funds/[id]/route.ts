import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteFundById, getFundById, updateFundById } from "@/lib/fundsRepository";

const ledgerEntrySchema = z.object({
  memberId: z.string().min(1),
  paid: z.boolean(),
});

const memberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  contact: z.string(),
  shares: z.number().int().positive(),
});

const ledgerSchema = z.object({
  month: z.string().min(1),
  entries: z.array(ledgerEntrySchema),
  done: z.boolean().optional(),
});

const winnerDetailSchema = z.object({
  memberId: z.string().min(1),
  name: z.string().min(1),
  contact: z.string(),
  amountReceived: z.number(),
  remainingShares: z.number(),
  note: z.string().optional(),
  signatureDataUrl: z.string().optional(),
  signatureSignedAt: z.string().optional(),
});

const winnerRecordSchema = z.object({
  date: z.string().min(1),
  winners: z.array(z.string()),
  winnerIds: z.array(z.string()).optional(),
  amount: z.number(),
  month: z.string().min(1),
  winnerDetails: z.array(winnerDetailSchema).optional(),
});

const updateFundSchema = z.object({
  name: z.string().min(2),
  sharePrice: z.number().positive(),
  members: z.array(memberSchema),
  ledgers: z.array(ledgerSchema),
  history: z.array(winnerRecordSchema),
});

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const fund = await getFundById(id);
    if (!fund) {
      return NextResponse.json({ message: "Fund not found" }, { status: 404 });
    }

    return NextResponse.json({ data: fund }, { status: 200 });
  } catch (error) {
    console.error(`GET /api/funds/${id} failed`, error);
    return NextResponse.json({ message: "Failed to fetch fund" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const json = await request.json().catch(() => null);
  const parsed = updateFundSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid fund payload", errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const updated = await updateFundById(id, parsed.data);
    if (!updated) {
      return NextResponse.json({ message: "Fund not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    console.error(`PUT /api/funds/${id} failed`, error);
    return NextResponse.json({ message: "Failed to update fund" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const deleted = await deleteFundById(id);
    if (!deleted) {
      return NextResponse.json({ message: "Fund not found" }, { status: 404 });
    }

    return NextResponse.json({ data: true }, { status: 200 });
  } catch (error) {
    console.error(`DELETE /api/funds/${id} failed`, error);
    return NextResponse.json({ message: "Failed to delete fund" }, { status: 500 });
  }
}
