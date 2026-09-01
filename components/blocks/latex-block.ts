import katex from "katex";
import "katex/dist/katex.min.css";

export interface LatexBlockData {
  formula: string;
  displayMode: boolean;
}

export class LatexBlock {
  private data: LatexBlockData;
  private wrapper!: HTMLElement;
  private textarea!: HTMLTextAreaElement;
  private preview!: HTMLElement;
  private errorEl!: HTMLElement;

  static get toolbox() {
    return {
      title: "LaTeX Math",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6v6H4z"/><path d="M14 4h6v6h-6z"/><path d="M4 14h6v6H4z"/><path d="M17 14v7"/><path d="M14 17h6"/></svg>',
    };
  }

  constructor({ data }: { data: LatexBlockData }) {
    this.data = {
      formula: data.formula || "",
      displayMode: data.displayMode ?? true,
    };
  }

  render(): HTMLElement {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "custom-block";

    const header = document.createElement("div");
    header.className = "custom-block-header";

    const label = document.createElement("span");
    label.className = "custom-block-label";
    label.textContent = "LaTeX Formula";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "custom-block-toggle";
    toggle.textContent = this.data.displayMode ? "Display" : "Inline";
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      this.data.displayMode = !this.data.displayMode;
      toggle.textContent = this.data.displayMode ? "Display" : "Inline";
      this.renderFormula();
    });

    header.appendChild(label);
    header.appendChild(toggle);

    this.textarea = document.createElement("textarea");
    this.textarea.className = "custom-block-textarea";
    this.textarea.value = this.data.formula;
    this.textarea.placeholder =
      "Enter LaTeX formula...\n\nE = mc^2\n\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}";
    this.textarea.addEventListener("input", () => {
      this.data.formula = this.textarea.value;
      this.renderFormula();
    });

    this.preview = document.createElement("div");
    this.preview.className = "custom-block-preview";

    this.errorEl = document.createElement("div");
    this.errorEl.className = "custom-block-error";
    this.errorEl.style.display = "none";

    this.wrapper.appendChild(header);
    this.wrapper.appendChild(this.textarea);
    this.wrapper.appendChild(this.errorEl);
    this.wrapper.appendChild(this.preview);

    setTimeout(() => this.renderFormula(), 10);

    return this.wrapper;
  }

  private renderFormula(): void {
    this.errorEl.style.display = "none";

    if (!this.data.formula.trim()) {
      this.preview.innerHTML =
        '<span class="custom-block-placeholder">Enter a formula above…</span>';
      return;
    }

    try {
      const html = katex.renderToString(this.data.formula, {
        displayMode: this.data.displayMode,
        throwOnError: true,
        trust: true,
      });
      this.preview.innerHTML = html;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid LaTeX syntax";
      this.errorEl.textContent = `⚠ ${message}`;
      this.errorEl.style.display = "block";
      this.preview.innerHTML =
        '<span class="custom-block-placeholder">Formula preview unavailable</span>';
    }
  }

  save(): LatexBlockData {
    return this.data;
  }
}
