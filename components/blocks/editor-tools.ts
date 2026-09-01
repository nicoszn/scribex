import type { ToolConstructable, ToolSettings } from "@editorjs/editorjs";

import Header from "@editorjs/header";
import ParagraphTool from "@editorjs/paragraph";
import ListTool from "@editorjs/list";
import Quote from "@editorjs/quote";
import CodeTool from "@editorjs/code";
import Table from "@editorjs/table";
import Delimiter from "@editorjs/delimiter";
import InlineCode from "@editorjs/inline-code";
import Marker from "@editorjs/marker";
import Underline from "@editorjs/underline";
import ImageTool from "@editorjs/image";
import LinkTool from "@editorjs/link";
import RawTool from "@editorjs/raw";
import Warning from "@editorjs/warning";
import AlignmentTune from "editorjs-text-alignment-blocktune";

import InlineMath from "./inlineMath";
import { LatexBlock } from "../blocks/latex-block";
import { MermaidBlock } from "../blocks/mermaid-block";
import { MathInlineBlock } from "../blocks/math-inline-block";
import { NotebookBlock } from "../blocks/notebook-block";

/**
 * Single source of truth for every tool available in the Scribex editor.
 * Imported by the Editor component so create/edit pages stay in sync
 * with whatever renders saved content elsewhere in the app.
 */
export const EDITOR_TOOLS: Record<string, ToolConstructable | ToolSettings> = {
  header: {
    class: Header as unknown as ToolConstructable,
    inlineToolbar: true,
    tunes: ["alignment"],
    config: {
      levels: [1, 2, 3, 4],
      defaultLevel: 2,
    },
  },
  paragraph: {
    class: ParagraphTool as unknown as ToolConstructable,
    inlineToolbar: true,
    tunes: ["alignment"],
  },
  list: {
    class: ListTool as unknown as ToolConstructable,
    inlineToolbar: true,
  },
  quote: {
    class: Quote as unknown as ToolConstructable,
    inlineToolbar: true,
  },
  warning: {
    class: Warning as unknown as ToolConstructable,
    inlineToolbar: true,
  },
  code: {
    class: CodeTool as unknown as ToolConstructable,
  },
  table: {
    class: Table as unknown as ToolConstructable,
    inlineToolbar: true,
  },
  delimiter: Delimiter as unknown as ToolConstructable,
  raw: RawTool as unknown as ToolConstructable,
  image: {
    class: ImageTool as unknown as ToolConstructable,
    config: {
      // Local-first: convert uploads to base64 data URLs, no server endpoint.
      uploader: {
        uploadByFile(file: File) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                success: 1,
                file: { url: reader.result as string },
              });
            };
            reader.readAsDataURL(file);
          });
        },
        uploadByUrl(url: string) {
          return Promise.resolve({
            success: 1,
            file: { url },
          });
        },
      },
    },
  },
  linkTool: {
    class: LinkTool as unknown as ToolConstructable,
    config: {
      endpoint: "/api/link-preview", // optional; safe no-op if unused/missing
    },
  },

  // Inline tools
  inlineCode: InlineCode as unknown as ToolConstructable,
  marker: Marker as unknown as ToolConstructable,
  underline: Underline as unknown as ToolConstructable,
  inlineMath: InlineMath as unknown as ToolConstructable,

  // Custom block tools
  latex: {
    class: LatexBlock as unknown as ToolConstructable,
  },
  mermaid: {
    class: MermaidBlock as unknown as ToolConstructable,
  },
  mathParagraph: {
    class: MathInlineBlock as unknown as ToolConstructable,
  },
  notebook: {
    class: NotebookBlock as unknown as ToolConstructable,
  },

  // Block tune
  alignment: {
    class: AlignmentTune as unknown as ToolConstructable,
    config: {
      default: "left",
      blocks: {
        header: "left",
        paragraph: "left",
      },
    },
  },
};
