import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

declare global {
  var drizzle: {
    client: postgres.Sql | null;
    db: PostgresJsDatabase<typeof schema> | null;
  };
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("Please define the DATABASE_URL environment variable inside .env.local");
}

let cached = global.drizzle;

if (!cached) {
  cached = global.drizzle = { client: null, db: null };
}

export async function dbConnect(): Promise<PostgresJsDatabase<typeof schema>> {
  if (cached.db && cached.client) {
    return cached.db;
  }

  if (!cached.client) {
    cached.client = postgres(DATABASE_URL!, {
      prepare: false,
      max: 1,
      idle_timeout: 20,
      max_lifetime: 60 * 30,
    });
  }

  if (!cached.db) {
    cached.db = drizzle(cached.client, { schema });
  }

  console.log("Connected to Supabase PostgreSQL");
  return cached.db;
}
