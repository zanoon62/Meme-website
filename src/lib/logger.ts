/**
 * Structured logger — small, zero-dep, production-ready.
 *
 * - All output is JSON one-line per log.
 * - Levels: debug, info, warn, error.
 * - In production: level=info. In dev: level=debug.
 * - Safe to ship to Vercel logs / Datadog / Logflare.
 */

type Level = "debug" | "info" | "warn" | "error";
const LEVELS: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const MIN_LEVEL: Level =
  (process.env.LOG_LEVEL as Level | undefined) ??
  (process.env.NODE_ENV === "production" ? "info" : "debug");

function emit(level: Level, msg: string, meta?: Record<string, unknown>) {
  if (LEVELS[level] < LEVELS[MIN_LEVEL]) return;
  const line = JSON.stringify({
    t: new Date().toISOString(),
    level,
    msg,
    ...(meta ?? {}),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit("error", msg, meta),
};

/** Wrap an async route handler with try/catch + structured error logging. */
export function withErrorLog<TArgs extends unknown[], TRes>(
  fn: (...args: TArgs) => Promise<TRes>,
  label: string,
): (...args: TArgs) => Promise<TRes> {
  return async (...args: TArgs) => {
    try {
      return await fn(...args);
    } catch (err) {
      logger.error(`${label} failed`, {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      throw err;
    }
  };
}
