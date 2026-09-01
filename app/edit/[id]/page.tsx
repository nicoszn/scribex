"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { OutputData } from "@editorjs/editorjs";
import Editor from "@/components/editor/Editor";
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
} from "@/lib/db";

type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 800;

export default function EditDocumentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "new";

  const [docId, setDocId] = useState<number | null>(
    isNew ? null : Number(params.id),
  );
  const [title, setTitle] = useState("Untitled");
  const [content, setContent] = useState<object | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [notFound, setNotFound] = useState(false);

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContent = useRef<object | null>(null);
  const titleRef = useRef(title);
  titleRef.current = title;

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (isNew) {
        const newId = await createDocument("Untitled");
        if (cancelled) return;
        setDocId(newId);
        setContent({ blocks: [], time: Date.now(), version: "2.31.6" });
        setLoading(false);
        router.replace(`/edit/${newId}`);
      } else {
        const id = Number(params.id);
        const existing = await getDocument(id);
        if (cancelled) return;
        if (!existing) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setDocId(id);
        setTitle(existing.title);
        setContent(existing.content);
        setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flushSave = useCallback(async () => {
    if (!docId) return;
    setSaveState("saving");
    try {
      await updateDocument(docId, {
        title: titleRef.current,
        content: pendingContent.current ?? content ?? {},
      });
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [docId, content]);

  const scheduleAutosave = useCallback(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      flushSave();
    }, AUTOSAVE_DELAY_MS);
  }, [flushSave]);

  function handleEditorChange(data: OutputData) {
    pendingContent.current = data;
    scheduleAutosave();
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    scheduleAutosave();
  }

  async function handleDelete() {
    if (!docId) return;
    const confirmed = window.confirm(
      "Delete this document? This can't be undone.",
    );
    if (!confirmed) return;
    await deleteDocument(docId);
    router.push("/documents");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg">Document not found.</p>
        <Link
          href="/documents"
          className="px-4 py-2 border border-black rounded-md hover:bg-black hover:text-white transition-colors"
        >
          Back to documents
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-black sticky top-0 bg-[var(--background)] z-30">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/documents" className="text-sm font-semibold hover:underline">
            ← Documents
          </Link>

          <span className="text-xs text-gray-400">
            {saveState === "saving" && "Saving…"}
            {saveState === "saved" && "Saved"}
            {saveState === "error" && "Save failed"}
            {saveState === "idle" && "\u00A0"}
          </span>

          <button
            onClick={handleDelete}
            className="ml-auto text-sm px-3 py-1.5 rounded-md border border-black hover:bg-black hover:text-white transition-colors"
          >
            Delete
          </button>
        </div>
      </header>

      <main className="flex-grow">
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="w-full text-4xl font-extrabold mb-8 outline-none placeholder:text-gray-300 bg-transparent"
          />

          {content !== undefined && (
            <Editor initialData={content} onChange={handleEditorChange} />
          )}
        </div>
      </main>
    </div>
  );
}
