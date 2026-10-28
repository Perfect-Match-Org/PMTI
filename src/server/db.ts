import "server-only";
import postgres from "postgres";

const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

// Transaction pooler in production: prepared statements must stay off.
export const sql =
  globalForDb.sql ??
  postgres(process.env.DATABASE_URL!, {
    max: 5,
    idle_timeout: 20,
    prepare: false,
    transform: postgres.camel,
  });

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export type Tx = Parameters<Parameters<typeof sql.begin>[1]>[0];
export type Db = typeof sql | Tx;
