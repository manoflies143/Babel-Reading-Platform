import express, { type Express } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
let authSchemaReady: Promise<void> | null = null;

async function ensureAuthSchema() {
  if (authSchemaReady) return authSchemaReady;
  authSchemaReady = (async () => {
    await db.execute(sql.raw(
      "CREATE TABLE IF NOT EXISTS accounts (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('reader', 'publisher')), password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, email_verified BOOLEAN NOT NULL DEFAULT FALSE, founding_reader_number INTEGER, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ);" +
      "CREATE UNIQUE INDEX IF NOT EXISTS accounts_email_unique ON accounts (email);" +
      "CREATE UNIQUE INDEX IF NOT EXISTS accounts_founding_reader_unique ON accounts (founding_reader_number) WHERE founding_reader_number IS NOT NULL;" +
      "CREATE TABLE IF NOT EXISTS sessions (id SERIAL PRIMARY KEY, account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, token_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), expires_at TIMESTAMPTZ NOT NULL);" +
      "CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_hash_unique ON sessions (token_hash);"
    ));
  })();
  try {
    await authSchemaReady;
  } catch (error) {
    authSchemaReady = null;
    throw error;
  }
}


app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", async (_req, res, next) => {
  try {
    await ensureAuthSchema();
    next();
  } catch {
    res.status(503).json({ error: "Account service is unavailable because the database could not be initialized." });
  }
});

app.use("/api", router);

// Serve the built Babel frontend from the same production process as the API.
// This keeps /api/auth/* and the reader UI on one origin in deployments.
const frontendDist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../babel-reading-platform/dist/public",
);
app.use(express.static(frontendDist));
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  return res.sendFile(path.join(frontendDist, "index.html"));
});

export default app;
