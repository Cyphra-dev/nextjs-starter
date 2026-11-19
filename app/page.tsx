import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { addNote, deleteNote } from "./actions";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-4 py-16">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          Next.js + Cyphra + Neo4j
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Tagged notes, as a graph
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Each note links to its tags with a{" "}
          <code className="font-mono">TAGGED</code> relationship. The list uses
          the typed client; &ldquo;related&rdquo; notes come from one Cypher
          query that walks the graph.
        </p>
      </header>

      <form
        action={addNote}
        className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <label className="flex flex-col gap-1 text-sm font-medium">
          Note
          <textarea
            name="text"
            required
            maxLength={280}
            rows={3}
            placeholder="Graphs make relationships first-class."
            className="rounded-lg border border-zinc-300 bg-transparent p-2 font-normal dark:border-zinc-700"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tags
          <input
            name="tags"
            placeholder="neo4j, typescript"
            className="rounded-lg border border-zinc-300 bg-transparent p-2 font-normal dark:border-zinc-700"
          />
        </label>
        <button className="self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
          Add note
        </button>
      </form>

      <Suspense
        fallback={<p className="text-sm text-zinc-500">Loading notes…</p>}
      >
        <Notes />
      </Suspense>
    </main>
  );
}

type Related = { id: string; related: { text: string; shared: number }[] };

async function Notes() {
  await connection();
  const notes = await db().note.findMany({
    include: { tags: { orderBy: { name: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  if (notes.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No notes yet. Add one with a few tags.
      </p>
    );
  }

  // Notes that share at least one tag, ranked by how many: a two-hop graph walk.
  const rows = await db().$cypher<Related>`
    MATCH (n:Note) WHERE n.id IN ${notes.map((n) => n.id)}
    OPTIONAL MATCH (n)-[:TAGGED]->(:Tag)<-[:TAGGED]-(other:Note)
    WITH n, other, count(*) AS shared WHERE other IS NOT NULL
    ORDER BY shared DESC
    RETURN n.id AS id, collect({ text: other.text, shared: shared })[0..3] AS related`;
  const related = new Map(rows.map((r) => [r.id, r.related]));

  return (
    <ul className="flex flex-col gap-4">
      {notes.map((note) => (
        <li
          key={note.id}
          className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <div className="flex items-start justify-between gap-4">
            <p>{note.text}</p>
            <form action={deleteNote}>
              <input type="hidden" name="id" value={note.id} />
              <button
                className="text-xs text-zinc-500 hover:text-red-600"
                aria-label="Delete note"
              >
                Delete
              </button>
            </form>
          </div>
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {note.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
          {(related.get(note.id) ?? []).length > 0 && (
            <p className="text-xs text-zinc-500">
              Related:{" "}
              {related
                .get(note.id)!
                .map(
                  (r) =>
                    `${r.text.slice(0, 40)}${r.text.length > 40 ? "…" : ""} (${r.shared})`,
                )
                .join(" · ")}
            </p>
          )}
          <time
            className="text-xs text-zinc-400"
            dateTime={note.createdAt.toISOString()}
          >
            {note.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC
          </time>
        </li>
      ))}
    </ul>
  );
}
