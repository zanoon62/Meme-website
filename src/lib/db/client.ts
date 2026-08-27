import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Single pooled Postgres connection + Drizzle instance, replacing
 * createSupabaseServerClient/ServiceClient/StaticClient — there's no more
 * RLS-vs-service-role distinction at the client level, authorization is
 * enforced by the query helpers in src/lib/db/queries/* instead.
 *
 * Cached on globalThis so Next.js dev-mode hot reload doesn't open a new
 * connection pool on every module reload.
 */
declare global {
  // eslint-disable-next-line no-var
  var __memeDbClient: postgres.Sql | undefined;
}

function createConnection() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — cannot connect to Postgres.");
  }
  return postgres(connectionString, { max: 10 });
}

const client = globalThis.__memeDbClient ?? createConnection();
if (process.env.NODE_ENV !== "production") {
  globalThis.__memeDbClient = client;
}

export const db = drizzle(client, { schema });
export type Database = typeof db;
