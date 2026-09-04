"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type EditorJS from "@editorjs/editorjs";
import type { OutputData } from "@editorjs/editorjs";
import { EDITOR_TOOLS } from "./editor-tools";
import InlineMath from "./inlineMath";

export interface EditorHandle {
  save: () => Promise<OutputData>;
}

interface EditorProps {
  /** Existing content to hydrate the editor with (Editor.js OutputData shape). */
  initialData?: object;
  /** Called with the current OutputData whenever the editor content changes. */
  onChange?: (data: OutputData) => void;
  /** Fired once the editor instance is ready. Useful for manual save triggers. */
  onReady?: (editor: EditorJS) => void;
  placeholder?: string;
  readOnly?: boolean;
}

/**
 * The Scribex editor component.
 *
 * Wraps Editor.js in a React-friendly way: mounts once, hydrates from
 * initialData, and exposes onChange so parent pages (create/edit) can
 * debounce-save into IndexedDB. Editor.js manages its own DOM inside the
 * holder div, so React is never allowed to re-render into it directly.
 */
export default function Editor({
  initialData,
  onChange,
  onReady,
  placeholder = "Start writing...",
  readOnly = false,
}: EditorProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorJS | null>(null);
  const [isReady, setIsReady] = useState(false);

  const handleChange = useCallback(async () => {
    if (!editorRef.current || !onChange) return;
    try {
      const data = await editorRef.current.save();
      onChange(data);
    } catch {
      // Editor mid-teardown or block in an invalid state; ignore this tick.
    }
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;

    async function initEditor() {
      // Editor.js touches `window`/`document` at import time, so it must
      // only ever be constructed client-side.
      const { default: EditorJSClass } = await import("@editorjs/editorjs");

      if (cancelled || !holderRef.current) return;

      const editor = new EditorJSClass({
        holder: holderRef.current,
        tools: EDITOR_TOOLS,
        data: (initialData as OutputData) || { blocks: [] },
        placeholder,
        readOnly,
        minHeight: 200,
        onChange: handleChange,
        onReady: () => {
          if (holderRef.current) {
            InlineMath.hydrate(holderRef.current);
          }
        },
      });

      editorRef.current = editor;
      await editor.isReady;
      if (cancelled) return;
      setIsReady(true);
      onReady?.(editor);
    }

    initEditor();

    return () => {
      cancelled = true;
      if (editorRef.current && typeof editorRef.current.destroy === "function") {
        editorRef.current.destroy();
      }
      editorRef.current = null;
    };
    // Intentionally mount once; initialData is only used for first hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function insertBlock(type: string) {
    editorRef.current?.blocks.insert(type);
  }

  return (
    <div className="editor-wrapper">
      {!isReady && (
        <div className="text-sm text-gray-400 px-1 py-2">Loading editor…</div>
      )}

      {isReady && (
        <div className="editor-floating-bar">
          <button type="button" onClick={() => insertBlock("header")}>
            H
          </button>
          {/* 
          <button type="button" onClick={() => insertBlock("list")}>
            List
          </button>
          <button type="button" onClick={() => insertBlock("quote")}>
            Quote
          </button>
          <button type="button" onClick={() => insertBlock("code")}>
            Code
          </button>
          <button type="button" onClick={() => insertBlock("table")}>
            Table
          </button>
          <button type="button" onClick={() => insertBlock("image")}>
            Image
          </button>
          */}
          <button type="button" onClick={() => insertBlock("latex")}>
            Math
          </button>
          <button type="button" onClick={() => insertBlock("mermaid")}>
            Diagram
          </button>
          <button type="button" onClick={() => insertBlock("notebook")}>
            Notebook
          </button>
        </div>
      )}

      <div ref={holderRef} className="editorjs-holder" />
    </div>
  );
}
