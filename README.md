# Next.js + Cyphra starter

A small Next.js app on **Neo4j**, using [Cyphra](https://www.cyphra.dev), the typed ORM for Neo4j.
Notes link to tags through a `TAGGED` relationship. The app lists them with the generated typed
client, and finds related notes with a single Cypher query that walks the graph.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCyphra-dev%2Fnextjs-starter&env=NEO4J_URI,NEO4J_USERNAME,NEO4J_PASSWORD&envDescription=Connection%20details%20of%20your%20Neo4j%205.6%2B%20database&project-name=cyphra-nextjs-starter)

## What's inside

- `schema.cyphra` is the graph model. Cyphra generates a typed client from it (`lib/cyphra.gen.ts`) and
  migrations into `migrations/`.
- `app/page.tsx` reads notes with `db().note.findMany({ include: { tags: … } })`, and finds related notes
  with `db().$cypher`, which still sends every value as a query parameter.
- `app/actions.ts` holds the Server Actions: one creates a note and upserts its tags in a single
  `$transaction`, the other deletes a note.

## Run locally

Requires Node 20+, pnpm and Docker.

```bash
pnpm install          # also generates the typed client
pnpm db:dev           # starts Neo4j 5 in Docker and writes .env
pnpm db:migrate       # applies the migrations (constraints and indexes)
pnpm dev
```

Change `schema.cyphra`, then run `pnpm db:migrate --name <change>` to create a reviewable migration
and regenerate the client.

## Deploy

`pnpm build` runs `cyphra migrate deploy` before `next build`, so the database must be reachable at
build time. Set `NEO4J_URI`, `NEO4J_USERNAME` and `NEO4J_PASSWORD` on your Vercel project. Any Neo4j
5.6+ database works, including Neo4j Aura.

Learn more in the [Cyphra docs](https://www.cyphra.dev/getting-started).
