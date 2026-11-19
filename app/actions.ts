"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

function parseTags(raw: string): string[] {
  const tags = raw
    .split(/[,\s]+/)
    .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
    .filter((t) => /^[a-z0-9-]{1,32}$/.test(t));
  return [...new Set(tags)].slice(0, 8);
}

export async function addNote(formData: FormData) {
  const text = String(formData.get("text") ?? "")
    .trim()
    .slice(0, 280);
  if (!text) return;
  const tags = parseTags(String(formData.get("tags") ?? ""));

  await db().$transaction(async (tx) => {
    for (const name of tags) {
      await tx.tag.upsert({ where: { name }, create: { name }, update: {} });
    }
    await tx.note.create({
      data: { text, tags: { connect: tags.map((name) => ({ name })) } },
    });
  });
  revalidatePath("/");
}

export async function deleteNote(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (id) await db().note.deleteMany({ where: { id } });
  revalidatePath("/");
}
