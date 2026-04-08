import { randomBytes } from "crypto";
import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function generateId(): string {
  return randomBytes(5).toString("hex");
}

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  orgName: string | null;
  contact: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
  expiresAt: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  orgName?: string;
  contact: string;
};

const SESSION_DAYS = 30;

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function mapUser(row: {
  id: string;
  email: string;
  fullName: string;
  orgName: string | null;
  contact: string;
}): AuthUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    orgName: row.orgName,
    contact: row.contact,
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthSession> {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 10);
  const userId = generateId();
  const token = generateId();
  const expiresAt = addDays(new Date(), SESSION_DAYS);

  const database = getPrisma();

  const existing = await database.appUser.findFirst({
    select: {
      id: true,
    },
    where: {
      email,
    },
  });

  if (existing) {
    throw new Error("Email is already registered.");
  }

  const user = await database.appUser.create({
    data: {
      id: userId,
      email,
      passwordHash,
      fullName: input.fullName.trim(),
      orgName: input.orgName?.trim() || null,
      contact: input.contact.trim(),
    },
  });

  await database.appSession.create({
    data: {
      id: token,
      userId,
      expiresAt,
    },
  });

  return {
    token,
    user: mapUser(user),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function loginUser(emailInput: string, password: string): Promise<AuthSession> {
  const email = emailInput.trim().toLowerCase();

  const database = getPrisma();

  const user = await database.appUser.findFirst({
    where: {
      email,
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      fullName: true,
      orgName: true,
      contact: true,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid email or password.");
  }

  const token = generateId();
  const expiresAt = addDays(new Date(), SESSION_DAYS);

  await database.appSession.create({
    data: {
      id: token,
      userId: user.id,
      expiresAt,
    },
  });

  return {
    token,
    user: mapUser(user),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function getUserFromSessionToken(token: string): Promise<AuthUser | null> {
  const now = new Date();

  const row = await getPrisma().appSession.findFirst({
    where: {
      id: token,
      expiresAt: {
        gt: now,
      },
    },
    select: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          orgName: true,
          contact: true,
        },
      },
    },
  });

  if (!row) return null;

  return mapUser(row.user);
}

export async function logoutSession(token: string): Promise<void> {
  await getPrisma().appSession.deleteMany({
    where: {
      id: token,
    },
  });
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await getPrisma().appUser.update({
    where: {
      id: userId,
    },
    data: {
      passwordHash,
    },
  });
}
