import katex from "katex";
import "katex/dist/katex.min.css";

export interface MathInlineBlockData {
  text: string;
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

  static get toolbox() {
    return {
      title: "Math Paragraph",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>',
    };
  }

  constructor({ data }: { data: MathInlineBlockData }) {
    this.data = {
      text: data.text || "",
    };
  }

  render(): HTMLElement {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "custom-block";

    this.textarea = document.createElement("textarea");
    this.textarea.className = "custom-block-textarea";
    this.textarea.value = this.data.text;
    this.textarea.placeholder =
      "Type text with inline math...\n\nExample: The equation $E = mc^2$ relates mass to energy.\n\nDisplay math: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$";
    this.textarea.addEventListener("input", () => {
      this.data.text = this.textarea.value;
      this.updatePreview();
    });

    this.preview = document.createElement("div");
    this.preview.className = "custom-block-preview";

    this.wrapper.appendChild(this.textarea);
    this.wrapper.appendChild(this.preview);

    setTimeout(() => this.updatePreview(), 10);

    return this.wrapper;
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
}
