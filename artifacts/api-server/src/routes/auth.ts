import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { and, count, eq, gt, isNull } from "drizzle-orm";
import { Router, type IRouter, type Request } from "express";
import { db, accountsTable, sessionsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 256;

router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(password: string, salt: string, expectedHex: string) {
  const actual = Buffer.from(hashPassword(password, salt), "hex");
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function publicAccount(account: typeof accountsTable.$inferSelect) {
  const creatorEmail = normalizeEmail(process.env.BABEL_CREATOR_EMAIL);
  return {
    name: account.name,
    email: account.email,
    role: account.role,
    createdAt: account.createdAt.toISOString(),
    emailVerified: account.emailVerified,
    serverBadgeEntitlements: {
      creator: Boolean(creatorEmail && account.email === creatorEmail),
      ...(account.foundingReaderNumber ? { foundingReaderNumber: account.foundingReaderNumber } : {}),
    },
  };
}

async function createSession(accountId: number) {
  const token = randomBytes(32).toString("base64url");
  await db.insert(sessionsTable).values({
    accountId,
    tokenHash: tokenHash(token),
    expiresAt: new Date(Date.now() + SESSION_MS),
  });
  return token;
}

async function authenticatedAccount(req: Request) {
  const auth = String(req.headers.authorization ?? "");
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  const [row] = await db
    .select({ account: accountsTable })
    .from(sessionsTable)
    .innerJoin(accountsTable, eq(sessionsTable.accountId, accountsTable.id))
    .where(and(eq(sessionsTable.tokenHash, tokenHash(token)), gt(sessionsTable.expiresAt, new Date()), isNull(accountsTable.deletedAt)))
    .limit(1);
  return row?.account ?? null;
}

router.post("/auth/register", async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password ?? "");
  const role = req.body?.role === "publisher" ? "publisher" : "reader";

  if (!name || name.length > MAX_NAME_LENGTH || !email || email.length > MAX_EMAIL_LENGTH || !email.includes("@") || password.length < 8 || password.length > MAX_PASSWORD_LENGTH) {
    return res.status(400).json({ error: "Name, valid email, and password of at least 8 characters are required." });
  }

  try {
    const account = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(424242)`);
      const [existing] = await tx.select({ id: accountsTable.id }).from(accountsTable).where(eq(accountsTable.email, email)).limit(1);
      if (existing) throw new Error("EMAIL_EXISTS");

      let foundingReaderNumber: number | null = null;
      if (role === "reader") {
        const [readerTotal] = await tx.select({ value: count() }).from(accountsTable).where(eq(accountsTable.role, "reader"));
        if (Number(readerTotal?.value ?? 0) < 10) foundingReaderNumber = Number(readerTotal?.value ?? 0) + 1;
      }

      const salt = randomBytes(16).toString("hex");
      const [created] = await tx.insert(accountsTable).values({
        name,
        email,
        role,
        passwordSalt: salt,
        passwordHash: hashPassword(password, salt),
        foundingReaderNumber,
      }).returning();
      return created;
    });

    const token = await createSession(account.id);
    return res.status(201).json({ account: publicAccount(account), token });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    req.log?.error({ error }, "Registration failed");
    return res.status(500).json({ error: "Could not create account." });
  }
});

router.post("/auth/login", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password ?? "");
  if (email.length > MAX_EMAIL_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return res.status(400).json({ error: "Invalid account credentials." });
  }
  const [account] = await db.select().from(accountsTable).where(and(eq(accountsTable.email, email), isNull(accountsTable.deletedAt))).limit(1);

  if (!account || !verifyPassword(password, account.passwordSalt, account.passwordHash)) {
    return res.status(401).json({ error: "Email or password is incorrect." });
  }

  const token = await createSession(account.id);
  return res.json({ account: publicAccount(account), token });
});

router.get("/auth/me", async (req, res) => {
  const account = await authenticatedAccount(req);
  if (!account) return res.status(401).json({ error: "Session is invalid or expired." });
  return res.json({ account: publicAccount(account) });
});

router.patch("/auth/me", async (req, res) => {
  const account = await authenticatedAccount(req);
  if (!account) return res.status(401).json({ error: "Session is invalid or expired." });
  const name = String(req.body?.name ?? "").trim();
  if (!name || name.length > MAX_NAME_LENGTH) {
    return res.status(400).json({ error: "Name is required and must be 80 characters or fewer." });
  }
  const [updated] = await db.update(accountsTable)
    .set({ name })
    .where(eq(accountsTable.id, account.id))
    .returning();
  return res.json({ account: publicAccount(updated) });
});

router.get("/auth/data", async (req, res) => {
  const account = await authenticatedAccount(req);
  if (!account) return res.status(401).json({ error: "Session is invalid or expired." });
  const result = await db.execute(sql`SELECT data FROM account_data WHERE account_id = ${account.id} LIMIT 1`);
  const row = result.rows[0] as { data?: unknown } | undefined;
  return res.json({ data: row?.data ?? {} });
});

router.put("/auth/data", async (req, res) => {
  const account = await authenticatedAccount(req);
  if (!account) return res.status(401).json({ error: "Session is invalid or expired." });
  const patch = req.body?.data;
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return res.status(400).json({ error: "Account data must be an object." });
  }
  const serialized = JSON.stringify(patch);
  if (serialized.length > 2_000_000) return res.status(413).json({ error: "Account data is too large." });
  await db.execute(sql`
    INSERT INTO account_data (account_id, data, updated_at)
    VALUES (${account.id}, ${serialized}::jsonb, NOW())
    ON CONFLICT (account_id)
    DO UPDATE SET data = account_data.data || EXCLUDED.data, updated_at = NOW()
  `);
  return res.status(204).end();
});

router.post("/auth/logout", async (req, res) => {
  const auth = String(req.headers.authorization ?? "");
  if (auth.startsWith("Bearer ")) {
    await db.delete(sessionsTable).where(eq(sessionsTable.tokenHash, tokenHash(auth.slice(7).trim())));
  }
  return res.status(204).end();
});

router.delete("/auth/account", async (req, res) => {
  const account = await authenticatedAccount(req);
  if (!account) return res.status(401).json({ error: "Session is invalid or expired." });

  const password = String(req.body?.password ?? "");
  if (password.length > MAX_PASSWORD_LENGTH || !password || !verifyPassword(password, account.passwordSalt, account.passwordHash)) {
    return res.status(403).json({ error: "Password confirmation is required to delete the account." });
  }

  await db.transaction(async (tx) => {
    await tx.update(accountsTable)
      .set({ deletedAt: new Date() })
      .where(eq(accountsTable.id, account.id));
    await tx.delete(sessionsTable).where(eq(sessionsTable.accountId, account.id));
    await tx.execute(sql`DELETE FROM account_data WHERE account_id = ${account.id}`);
  });

  return res.status(204).end();
});

export default router;
