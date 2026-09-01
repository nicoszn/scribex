import Dexie, { type EntityTable } from "dexie";

export interface Document {
  id?: number;
  title: string;
  content: object; // Editor.js output data
  createdAt: Date;
  updatedAt: Date;
}

const db = new Dexie("DocflowDB") as Dexie & {
  documents: EntityTable<Document, "id">;
};

db.version(1).stores({
  documents: "++id, title, createdAt, updatedAt",
});

// v2 previously added a draft/published flag; that concept was removed, but
// the version bump stays so anyone who already upgraded to v2 locally still
// opens cleanly (Dexie requires version numbers to only increase).
db.version(2).stores({
  documents: "++id, title, createdAt, updatedAt",
});

export default db;

// --- Convenience helpers ---

export async function createDocument(
  title: string = "Untitled",
): Promise<number> {
  const now = new Date();
  const id = await db.documents.add({
    title,
    content: { blocks: [], time: Date.now(), version: "2.31.6" },
    createdAt: now,
    updatedAt: now,
  });
  return id as number;
}

export async function updateDocument(
  id: number,
  data: Partial<Pick<Document, "title" | "content">>,
): Promise<void> {
  await db.documents.update(id, {
    ...data,
    updatedAt: new Date(),
  });
}

export async function getDocument(id: number): Promise<Document | undefined> {
  return db.documents.get(id);
}

export async function getAllDocuments(): Promise<Document[]> {
  return db.documents.orderBy("updatedAt").reverse().toArray();
}

export async function deleteDocument(id: number): Promise<void> {
  await db.documents.delete(id);
}

export async function duplicateDocument(id: number): Promise<number | undefined> {
  const original = await db.documents.get(id);
  if (!original) return undefined;
  const now = new Date();
  const newId = await db.documents.add({
    title: `${original.title} (copy)`,
    content: original.content,
    createdAt: now,
    updatedAt: now,
  });
  return newId as number;
}
