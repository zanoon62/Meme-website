/**
 * Shallow camelCase -> snake_case key converter for API responses.
 *
 * Drizzle returns row objects with camelCase keys (matching the TS schema),
 * but the frontend still expects the snake_case shape the old
 * Supabase-js client returned (matching raw Postgres column names) — this
 * migration deliberately keeps that contract instead of touching every
 * frontend call site. Only TOP-LEVEL keys are renamed: jsonb columns
 * (colors, sizes, shipping_address, config, payload, ...) keep their
 * internal structure completely untouched, since those are opaque payloads
 * the frontend already reads by their own (non-column) key names.
 */
export function toSnakeCase<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    out[snakeKey] = value;
  }
  return out;
}

export function toSnakeCaseArray<T extends Record<string, unknown>>(rows: T[]): Record<string, unknown>[] {
  return rows.map(toSnakeCase);
}
