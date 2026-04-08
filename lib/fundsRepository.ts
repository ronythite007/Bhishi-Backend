import { randomBytes } from "crypto";
import { getPrisma } from "@/lib/prisma";

function generateId(): string {
  return randomBytes(5).toString("hex");
}

export type ApiLedgerEntry = {
  memberId: string;
  paid: boolean;
};

export type ApiMonthlyLedger = {
  month: string;
  entries: ApiLedgerEntry[];
  done?: boolean;
};

export type ApiWinnerDetail = {
  memberId: string;
  name: string;
  contact: string;
  amountReceived: number;
  remainingShares: number;
  note?: string;
  signatureDataUrl?: string;
  signatureSignedAt?: string;
};

export type ApiWinnerRecord = {
  date: string;
  winners: string[];
  winnerIds?: string[];
  amount: number;
  month: string;
  winnerDetails?: ApiWinnerDetail[];
};

export type ApiMember = {
  id: string;
  name: string;
  contact: string;
  shares: number;
};

export type ApiFund = {
  id: string;
  name: string;
  sharePrice: number;
  members: ApiMember[];
  ledgers: ApiMonthlyLedger[];
  history: ApiWinnerRecord[];
};

type FundMemberRow = {
  id: string;
  name: string;
  contact: string;
  shares: number;
};

type FundMonthlyLedgerRow = {
  month: string;
  done: boolean;
};

type FundWinnerRow = {
  month: string;
  recordDate: Date;
  amount: { toNumber(): number };
  winners: string[];
  winnerIds: string[];
  winnerDetails: unknown;
};

type FundListRow = {
  id: string;
};

type CreateFundInput = {
  name: string;
  sharePrice: number;
};

type UpdateFundInput = {
  name: string;
  sharePrice: number;
  members: ApiMember[];
  ledgers: ApiMonthlyLedger[];
  history: ApiWinnerRecord[];
};

function parseWinnerDetails(value: unknown): ApiWinnerDetail[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is ApiWinnerDetail => typeof entry === "object" && entry !== null) as ApiWinnerDetail[];
}

async function loadFundById(fundId: string): Promise<ApiFund | null> {
  const prisma = getPrisma();

  const [fund, members, monthlyLedgers, ledgerEntries, winnerRows] = await Promise.all([
    prisma.fund.findUnique({
      where: { id: fundId },
      select: { id: true, name: true, sharePrice: true },
    }),
    prisma.member.findMany({
      where: { fundId },
      select: { id: true, name: true, contact: true, shares: true, orderIndex: true },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    }),
    prisma.monthlyLedger.findMany({
      where: { fundId },
      select: { month: true, done: true, orderIndex: true },
      orderBy: [{ orderIndex: "asc" }, { month: "asc" }],
    }),
    prisma.ledgerEntry.findMany({
      where: { fundId },
      select: { month: true, memberId: true, paid: true, orderIndex: true },
      orderBy: [{ month: "asc" }, { orderIndex: "asc" }, { memberId: "asc" }],
    }),
    prisma.winnerRecord.findMany({
      where: { fundId },
      select: {
        month: true,
        recordDate: true,
        amount: true,
        winners: true,
        winnerIds: true,
        winnerDetails: true,
        orderIndex: true,
      },
      orderBy: [{ orderIndex: "asc" }, { recordDate: "asc" }],
    }),
  ]);

  if (!fund) return null;

  const entriesByMonth = new Map<string, ApiLedgerEntry[]>();
  for (const entry of ledgerEntries) {
    const bucket = entriesByMonth.get(entry.month) ?? [];
    bucket.push({ memberId: entry.memberId, paid: entry.paid });
    entriesByMonth.set(entry.month, bucket);
  }

  return {
    id: fund.id,
    name: fund.name,
    sharePrice: fund.sharePrice.toNumber(),
    members: members.map((member: FundMemberRow) => ({
      id: member.id,
      name: member.name,
      contact: member.contact,
      shares: member.shares,
    })),
    ledgers: monthlyLedgers.map((ledger: FundMonthlyLedgerRow) => ({
      month: ledger.month,
      done: ledger.done,
      entries: entriesByMonth.get(ledger.month) ?? [],
    })),
    history: winnerRows.map((winner: FundWinnerRow) => ({
      date: winner.recordDate.toISOString(),
      winners: winner.winners,
      winnerIds: winner.winnerIds,
      amount: winner.amount.toNumber(),
      month: winner.month,
      winnerDetails: parseWinnerDetails(winner.winnerDetails),
    })),
  };
}

export async function listFunds(): Promise<ApiFund[]> {
  const rows = await getPrisma().fund.findMany({
    select: {
      id: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const funds: Array<ApiFund | null> = await Promise.all(rows.map((row: FundListRow) => loadFundById(row.id)));
  return funds.filter((fund): fund is ApiFund => fund !== null);
}

export async function addFund(input: CreateFundInput): Promise<ApiFund> {
  const id = generateId();

  await getPrisma().fund.create({
    data: {
      id,
      name: input.name,
      sharePrice: input.sharePrice,
    },
  });

  const fund = await loadFundById(id);
  if (!fund) {
    throw new Error("Failed to create fund");
  }

  return fund;
}

export async function getFundById(fundId: string): Promise<ApiFund | null> {
  return loadFundById(fundId);
}

export async function deleteFundById(fundId: string): Promise<boolean> {
  const deleted = await getPrisma().fund.deleteMany({ where: { id: fundId } });
  return deleted.count > 0;
}

export async function updateFundById(fundId: string, input: UpdateFundInput): Promise<ApiFund | null> {
  const prisma = getPrisma();

  const exists = await prisma.fund.findUnique({ where: { id: fundId }, select: { id: true } });
  if (!exists) return null;

  await prisma.$transaction(async (tx: any) => {
    await tx.fund.update({
      where: { id: fundId },
      data: {
        name: input.name,
        sharePrice: input.sharePrice,
      },
    });

    await tx.member.deleteMany({ where: { fundId } });
    if (input.members.length > 0) {
      await tx.member.createMany({
        data: input.members.map((member, index) => ({
          id: member.id,
          fundId,
          name: member.name,
          contact: member.contact,
          shares: member.shares,
          orderIndex: index,
        })),
      });
    }

    await tx.monthlyLedger.deleteMany({ where: { fundId } });
    if (input.ledgers.length > 0) {
      await tx.monthlyLedger.createMany({
        data: input.ledgers.map((ledger, index) => ({
          fundId,
          month: ledger.month,
          done: Boolean(ledger.done),
          orderIndex: index,
        })),
      });
    }

    await tx.ledgerEntry.deleteMany({ where: { fundId } });
    const ledgerEntries = input.ledgers.flatMap((ledger) =>
      ledger.entries.map((entry, index) => ({
        fundId,
        month: ledger.month,
        memberId: entry.memberId,
        paid: entry.paid,
        orderIndex: index,
      })),
    );
    if (ledgerEntries.length > 0) {
      await tx.ledgerEntry.createMany({ data: ledgerEntries });
    }

    await tx.winnerRecord.deleteMany({ where: { fundId } });
    if (input.history.length > 0) {
      await tx.winnerRecord.createMany({
        data: input.history.map((record, index) => ({
          id: generateId(),
          fundId,
          month: record.month,
          recordDate: new Date(record.date),
          amount: record.amount,
          winners: record.winners,
          winnerIds: record.winnerIds ?? [],
          winnerDetails: record.winnerDetails ?? [],
          orderIndex: index,
        })),
      });
    }
  });

  return loadFundById(fundId);
}
