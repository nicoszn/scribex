"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getAllDocuments,
  deleteDocument,
  duplicateDocument,
  createDocument,
  type Document,
} from "@/lib/db";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    const docs = await getAllDocuments();
    setDocuments(docs);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleCreate() {
    setCreating(true);
    const id = await createDocument("Untitled");
    router.push(`/edit/${id}`);
  }

  async function handleDelete(id: number | undefined, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    const confirmed = window.confirm("Delete this document? This can't be undone.");
    if (!confirmed) return;
    await deleteDocument(id);
    refresh();
  }

  async function handleDuplicate(id: number | undefined, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    await duplicateDocument(id);
    refresh();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-black">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Scribex
          </Link>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-4 py-2 border border-black rounded-md font-semibold hover:bg-black hover:text-white transition-colors disabled:opacity-50"
          >
            + New Document
          </button>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-10 max-w-4xl w-full">
        <h1 className="text-3xl font-bold mb-8">Your Documents</h1>

        {loading && <p className="text-gray-500">Loading…</p>}

        {!loading && documents.length === 0 && (
          <div className="border border-dashed border-black rounded-lg p-12 text-center">
            <p className="text-lg mb-4">No documents yet.</p>
            <button
              onClick={handleCreate}
              className="px-4 py-2 border border-black rounded-md font-semibold hover:bg-black hover:text-white transition-colors"
            >
              Create your first document
            </button>
          </div>
        )}

        <ul className="flex flex-col gap-3">
          {documents.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/edit/${doc.id}`}
                className="group flex items-center justify-between gap-4 p-4 border border-black rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <h2 className="font-semibold truncate mb-1">
                    {doc.title || "Untitled"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Updated {formatDate(doc.updatedAt)}
                  </p>
                </div>

                <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDuplicate(doc.id, e)}
                    className="text-xs px-3 py-1.5 rounded-md border border-black hover:bg-black hover:text-white transition-colors"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    className="text-xs px-3 py-1.5 rounded-md border border-black hover:bg-black hover:text-white transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
