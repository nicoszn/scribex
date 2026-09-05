import katex from "katex";
import "katex/dist/katex.min.css";
import { GLOBAL_MODE_EVENT, type ViewMode } from "../editor/global-mode";

export interface MathInlineBlockData {
  text: string;
  viewMode?: ViewMode;
}

function renderMixedContent(text: string): string {
  let html = text.replace(/\$\$(.*?)\$\$/g, (_, formula: string) => {
    try {
      return katex.renderToString(formula, {
        displayMode: true,
        throwOnError: false,
        trust: true,
      });
    } catch {
      return `<span class="custom-block-inline-error" title="Invalid LaTeX">${formula}</span>`;
    }
  });

  html = html.replace(
    /(?<!\$)\$(?!\$)(.*?)(?<!\$)\$(?!\$)/g,
    (_, formula: string) => {
      try {
        return katex.renderToString(formula, {
          displayMode: false,
          throwOnError: false,
          trust: true,
        });
      } catch {
        return `<span class="custom-block-inline-error" title="Invalid LaTeX">${formula}</span>`;
      }
    },
  );

  html = html.replace(/\n/g, "<br>");

  return html;
}

export class MathInlineBlock {
  private data: MathInlineBlockData;
  private wrapper!: HTMLElement;
  private textarea!: HTMLTextAreaElement;
  private preview!: HTMLElement;
  private viewToggle!: HTMLButtonElement;
  private mode: ViewMode;
  private isGlobalControlled = false;
  private onGlobalMode = (e: Event) => {
    const mode = (e as CustomEvent<{ mode: ViewMode }>).detail.mode;
    this.isGlobalControlled = true;
    this.setMode(mode);
  };

  static get toolbox() {
    return {
      title: "Math Paragraph",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>',
    };
  }

  constructor({ data }: { data: MathInlineBlockData }) {
    this.data = {
      text: data.text || "",
      viewMode: data.viewMode || "edit",
    };
    this.mode = this.data.viewMode || "edit";
    window.addEventListener(GLOBAL_MODE_EVENT, this.onGlobalMode);
  }

  render(): HTMLElement {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "custom-block";

    const header = document.createElement("div");
    header.className = "custom-block-header";

    const label = document.createElement("span");
    label.className = "custom-block-label";
    label.textContent = "Math Paragraph";

    this.viewToggle = document.createElement("button");
    this.viewToggle.type = "button";
    this.viewToggle.className = "custom-block-toggle";
    this.viewToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      this.isGlobalControlled = false;
      this.setMode(this.mode === "edit" ? "preview" : "edit");
    });

    header.appendChild(label);
    header.appendChild(this.viewToggle);

    this.textarea = document.createElement("textarea");
    this.textarea.className = "custom-block-textarea";
    this.textarea.value = this.data.text;
    this.textarea.placeholder =
      "Type text with inline math...\n\nExample: The equation $E = mc^2$ relates mass to energy.\n\nDisplay math: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$";
    this.textarea.addEventListener("input", () => {
      this.data.text = this.textarea.value;
    });

    this.preview = document.createElement("div");
    this.preview.className = "custom-block-preview";

    this.wrapper.appendChild(header);
    this.wrapper.appendChild(this.textarea);
    this.wrapper.appendChild(this.preview);

    this.setMode(this.mode);

    return this.wrapper;
  }

  private setMode(mode: ViewMode): void {
    this.mode = mode;
    this.data.viewMode = mode;
    this.viewToggle.style.display = this.isGlobalControlled ? "none" : "inline-block";
    if (mode === "edit") {
      this.textarea.style.display = "block";
      this.preview.style.display = "none";
      this.viewToggle.textContent = "Preview";
    } else {
      this.textarea.style.display = "none";
      this.preview.style.display = "block";
      this.viewToggle.textContent = "Edit";
      this.updatePreview();
    }
  }

  private updatePreview(): void {
    if (!this.data.text.trim()) {
      this.preview.innerHTML =
        '<span class="custom-block-placeholder">Preview will appear here…</span>';
      return;
    }
    this.preview.innerHTML = renderMixedContent(this.data.text);
  }

  save(): MathInlineBlockData {
    return this.data;
  }

  destroy(): void {
    window.removeEventListener(GLOBAL_MODE_EVENT, this.onGlobalMode);
  }
}
