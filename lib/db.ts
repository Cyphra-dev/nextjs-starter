import "server-only";
import { createClient } from "./cyphra.gen";

// One client per server instance. Vercel's Cyphra integration sets these variables;
// locally, `pnpm db:dev` writes them to .env.
function env(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(
    `Missing ${names.join(" or ")}. Run \`pnpm db:dev\` or connect a Cyphra database.`,
  );
}

const globalForDb = globalThis as unknown as {
  cyphra?: ReturnType<typeof createClient>;
};

export function db() {
  globalForDb.cyphra ??= createClient({
    uri: env("NEO4J_URI"),
    user: env("NEO4J_USERNAME", "NEO4J_USER"),
    password: env("NEO4J_PASSWORD"),
  });
  return globalForDb.cyphra;
}
