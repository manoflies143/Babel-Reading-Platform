import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

type Database = ReturnType<typeof drizzle<typeof schema>>;

export const pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : null;

// Keep the API process startable in environments where a database has not yet
// been provisioned (for example, a frontend-only Replit preview). Database
// operations still fail explicitly at the point of use instead of crashing
// the entire server during module initialization.
const unavailableDb = new Proxy(
  {},
  {
    get() {
      throw new Error(
        "DATABASE_URL must be set before using database-backed features.",
      );
    },
  },
) as Database;

export const db: Database = databaseUrl
  ? drizzle(pool!, { schema })
  : unavailableDb;

export * from "./schema";
