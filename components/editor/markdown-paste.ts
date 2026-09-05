import type EditorJS from "@editorjs/editorjs";
import type { OutputBlockData } from "@editorjs/editorjs";

/**
 * MarkdownPasteInterceptor
 *
 * Intercepts paste events on the Editor.js holder element. When the clipboard
 * contains plain-text content with markdown block-level syntax, the content is
 * parsed into native Editor.js blocks and inserted into the editor.
 *
 * Rich HTML pastes (e.g. from a web browser) are left to the default handler.
 */

type ParsedMarkdownBlock =
  | { type: "header"; data: { text: string; level: number } }
  | { type: "paragraph"; data: { text: string } }
  | { type: "list"; data: { style: "unordered" | "ordered"; items: string[] } }
  | { type: "code"; data: { code: string; lang?: string } }
  | { type: "quote"; data: { text: string; caption: string; alignment: string } }
  | { type: "table"; data: { withHeadings: boolean; content: string[][] } }
  | { type: "delimiter" };

export class MarkdownPasteInterceptor {
  private editor: EditorJS;
  private holder: HTMLElement;
  private handler: ((e: ClipboardEvent) => void) | null = null;

  constructor(editor: EditorJS, holder: HTMLElement) {
    this.editor = editor;
    this.holder = holder;
  }

  /** Attach the capture-phase paste listener. */
  attach(): void {
    this.handler = (e: ClipboardEvent) => this.handlePaste(e);
    this.holder.addEventListener("paste", this.handler, true);
  }

  /** Remove the paste listener. */
  detach(): void {
    if (this.handler) {
      this.holder.removeEventListener("paste", this.handler, true);
      this.handler = null;
    }
  }

  // ─── Core handler ────────────────────────────────────────────────────────

  private handlePaste(e: ClipboardEvent): void {
    const dt = e.clipboardData;
    if (!dt) return;

    // If the clipboard contains rich HTML from a web page / editor, let
    // the default handler (or Editor.js) deal with it.
    if (this.isRichHtml(dt)) return;

    const plain = dt.getData("text/plain");
    if (!plain || !looksLikeMarkdown(plain)) return;

    e.preventDefault();
    e.stopPropagation();

    const mdBlocks = parseMarkdown(plain);
    if (mdBlocks.length === 0) return;

    this.insertBlocks(mdBlocks);
  }

  /**
   * Returns true when the clipboard contains substantial rich HTML that
   * was likely produced by a web page or rich-text editor.
   */
  private isRichHtml(dt: DataTransfer): boolean {
    const html = dt.getData("text/html");
    if (!html) return false;
    const stripped = html
      .replace(/<meta[^>]*>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, "")
      .trim();
    return stripped.length > 20;
  }

  // ─── Block insertion ─────────────────────────────────────────────────────

  private async insertBlocks(mdBlocks: ParsedMarkdownBlock[]): Promise<void> {
    const outputBlocks = mdBlocks.map((b) =>
      'data' in b
        ? ({ type: b.type, data: b.data } as OutputBlockData)
        : ({ type: b.type } as OutputBlockData),
    );

    const currentBlockIndex = this.getCurrentBlockIndex();
    const insertAt = currentBlockIndex + 1;

    try {
      (this.editor.blocks as any).insertMany(outputBlocks, insertAt);
    } catch {
      // Fallback: insert one-by-one in reverse so order is preserved
      // (insert() places the new block *above* the given index).
      for (let i = outputBlocks.length - 1; i >= 0; i--) {
        const b = outputBlocks[i];
        this.editor.blocks.insert(b.type, b.data as any);
      }
    }

    // Tell the parent page so autosave fires.
    try {
      const data = await this.editor.save();
      const event = new CustomEvent("editorchange", { detail: data });
      this.holder.dispatchEvent(event);
    } catch {
      /* save failed – non-critical */
    }
  }

  private getCurrentBlockIndex(): number {
    try {
      const current = (this.editor as any).selection?.currentBlock;
      if (current) {
        const count = this.editor.blocks.getBlocksCount();
        for (let i = 0; i < count; i++) {
          const block = (this.editor.blocks as any).getByIndex?.(i);
          if (block && (block.id === current.id || block === current)) return i;
        }
      }
    } catch {
      /* fall through */
    }
    return this.editor.blocks.getBlocksCount() - 1;
  }
}

// ─── Markdown detection ─────────────────────────────────────────────────────

function looksLikeMarkdown(text: string): boolean {
  const lines = text.split("\n");
  const mdPatterns = [
    /^#{1,6}\s+/, // headings
    /^```/, // fenced code
    /^~~~/, // alt fence
    /^\s*[-*+]\s+/, // unordered list
    /^\s*\d+\.\s+/, // ordered list
    /^\s*>/, // blockquote
    /^\|.*\|/, // table
    /^\$[$]?[^\n]+[$]?\$$/, // display math
    /^---+\s*$/, // hr or yaml frontmatter
    /^\*{3,}\s*$/, // hr
    /^_{3,}\s*$/, // hr
    /\*\*[^*]+\*\*/, // bold
    /(?<!\*)\*(?!\*)[^*]+\*(?!\*)/, // italic
    /~~[^~]+~~/, // strikethrough
    /`[^`]+`/, // inline code
  ];

  let score = 0;
  for (const line of lines) {
    for (const re of mdPatterns) {
      if (re.test(line)) {
        score++;
        break;
      }
    }
    if (score >= 2) return true;
  }
  return false;
}

// ─── Markdown → Editor.js block parser ─────────────────────────────────────

function parseMarkdown(source: string): ParsedMarkdownBlock[] {
  const lines = source.split("\n");
  const blocks: ParsedMarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Fenced code block ──────────────────────────────────────────────
    if (line.trimStart().startsWith("```") || line.trimStart().startsWith("~~~")) {
      const fenceChar = line.trimStart().startsWith("```") ? "`" : "~";
      const fenceLen = line.trimStart().startsWith("```") ? 3 : 4;
      const lang = line.trimStart().slice(fenceLen).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith(fenceChar.repeat(fenceLen))) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push({ type: "code", data: { code: codeLines.join("\n"), lang: lang || undefined } });
      continue;
    }

    // ── Heading ────────────────────────────────────────────────────────
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push({ type: "header", data: { text: headingMatch[2], level } });
      i++;
      continue;
    }

    // ── Horizontal rule ────────────────────────────────────────────────
    if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line.trim())) {
      blocks.push({ type: "delimiter" });
      i++;
      continue;
    }

    // ── Table ──────────────────────────────────────────────────────────
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*[-:]+[-|:\s]*$/.test(lines[i + 1])) {
      const result = parseTable(lines, i);
      blocks.push(result.block);
      i = result.nextLine;
      continue;
    }

    // ── Blockquote ─────────────────────────────────────────────────────
    if (line.trimStart().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({
        type: "quote",
        data: { text: quoteLines.join("\n"), caption: "", alignment: "left" },
      });
      continue;
    }

    // ── Unordered list ─────────────────────────────────────────────────
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", data: { style: "unordered", items } });
      continue;
    }

    // ── Ordered list ───────────────────────────────────────────────────
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", data: { style: "ordered", items } });
      continue;
    }

    // ── Empty line ─────────────────────────────────────────────────────
    if (line.trim() === "") {
      i++;
      continue;
    }

    // ── Paragraph (default) ────────────────────────────────────────────
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trimStart().startsWith("#") &&
      !lines[i].trimStart().startsWith("```") &&
      !lines[i].trimStart().startsWith("~~~") &&
      !lines[i].trimStart().startsWith(">") &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^(\*{3,}|-{3,}|_{3,})\s*$/.test(lines[i].trim()) &&
      !(lines[i].includes("|") && /^\s*\|?\s*[-:]+[-|:\s]*$/.test(lines[i + 1] ?? ""))
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", data: { text: paraLines.join("\n") } });
    }
  }

  return blocks;
}

// ─── Table parsing ──────────────────────────────────────────────────────────

function parseTable(
  lines: string[],
  startIndex: number,
): { block: ParsedMarkdownBlock; nextLine: number } {
  let i = startIndex;
  const rawRows: string[][] = [];

  while (i < lines.length && lines[i].includes("|")) {
    rawRows.push(parsePipeRow(lines[i]));
    i++;
  }

  if (rawRows.length < 2) {
    return { block: { type: "paragraph", data: { text: lines[startIndex] } }, nextLine: i };
  }

  const headerRow = rawRows[0];
  const withHeadings = rawRows[1].every((c) => /^\s*:?-+:?\s*$/.test(c));
  const dataStart = withHeadings ? 2 : 1;
  const tableData: string[][] = [];

  for (let r = dataStart; r < rawRows.length; r++) {
    const row = rawRows[r];
    // Pad row to match header width
    while (row.length < headerRow.length) row.push("");
    tableData.push(row.slice(0, headerRow.length));
  }

  return {
    block: { type: "table", data: { withHeadings, content: tableData } },
    nextLine: i,
  };
}

function parsePipeRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  return trimmed.split("|").map((c) => c.trim());
}
