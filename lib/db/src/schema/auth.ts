import { boolean, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const accountsTable = pgTable(
  "accounts",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    role: text("role", { enum: ["reader", "publisher"] }).notNull(),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    foundingReaderNumber: integer("founding_reader_number"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    emailUnique: uniqueIndex("accounts_email_unique").on(table.email),
    foundingReaderUnique: uniqueIndex("accounts_founding_reader_unique").on(table.foundingReaderNumber),
  }),
);

export const sessionsTable = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id").notNull().references(() => accountsTable.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    tokenUnique: uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
  }),
);
