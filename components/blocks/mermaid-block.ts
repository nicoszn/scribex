import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
});

let idCounter = 0;

export interface MermaidBlockData {
  code: string;
}

export class MermaidBlock {
  private data: MermaidBlockData;
  private wrapper!: HTMLElement;
  private textarea!: HTMLTextAreaElement;
  private preview!: HTMLElement;
  private errorEl!: HTMLElement;
  private renderedId: string;

  static get toolbox() {
    return {
      title: "Mermaid Diagram",
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    };
  }

  constructor({ data }: { data: MermaidBlockData }) {
    this.data = {
      code: data.code || "graph TD;\n    A[Start] --> B[End]",
    };
    this.renderedId = `mermaid-${++idCounter}`;
  }

  render(): HTMLElement {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "custom-block";

    this.textarea = document.createElement("textarea");
    this.textarea.className = "custom-block-textarea";
    this.textarea.value = this.data.code;
    this.textarea.placeholder =
      "Enter Mermaid diagram code...\n\ngraph TD; A-->B; B-->C";
    this.textarea.addEventListener("input", () => {
      this.data.code = this.textarea.value;
      this.renderDiagram();
    });

    this.preview = document.createElement("div");
    this.preview.className = "custom-block-preview";

    this.errorEl = document.createElement("div");
    this.errorEl.className = "custom-block-error";
    this.errorEl.style.display = "none";

    this.wrapper.appendChild(this.textarea);
    this.wrapper.appendChild(this.errorEl);
    this.wrapper.appendChild(this.preview);

    setTimeout(() => this.renderDiagram(), 50);

    return this.wrapper;
  }

  private async renderDiagram(): Promise<void> {
    this.errorEl.style.display = "none";
    this.preview.innerHTML = "";

    if (!this.data.code.trim()) {
      this.preview.innerHTML =
        '<span class="custom-block-placeholder">Enter diagram code above…</span>';
      return;
    }

    try {
      const { svg } = await mermaid.render(
        `mermaid-svg-${this.renderedId}`,
        this.data.code,
      );
      this.preview.innerHTML = svg;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid diagram syntax";
      this.errorEl.textContent = `⚠ ${message}`;
      this.errorEl.style.display = "block";
      this.preview.innerHTML =
        '<span class="custom-block-placeholder">Diagram preview unavailable</span>';
    }
  }

  save(): MermaidBlockData {
    return this.data;
  }
}
