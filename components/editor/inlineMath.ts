import katex from "katex";
import type { InlineTool, API } from "@editorjs/editorjs";

export default class InlineMath implements InlineTool {
  private api: API;
  private button: HTMLButtonElement | null = null;
  private tag = "SPAN";
  private classname = "oro-inline-math";

  static get isInline() {
    return true;
  }

  /**
   * Scans the editor DOM canvas and processes plain text equations
   * into compiled math notation vectors on startup.
   */
  static hydrate(holderElement: HTMLElement) {
    const formulas = holderElement.querySelectorAll(".oro-inline-math");
    formulas.forEach((element) => {
      const texExpression = element.getAttribute("data-tex");
      if (texExpression) {
        (element as HTMLElement).contentEditable = "false";
        katex.render(texExpression, element as HTMLElement, {
          throwOnError: false,
        });
      }
    });
  }

  constructor({ api }: { api: API }) {
    this.api = api;
  }

  render() {
    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.classList.add(this.api.styles.inlineToolButton);
    this.button.innerHTML = `<span style="font-weight: bold; font-family: serif;">f(x)</span>`;
    return this.button;
  }

  surround(range: Range) {
    if (!range) return;

    // If clicking the tool while inside existing math, open for editing
    const termWrapper = this.api.selection.findParentTag(
      this.tag,
      this.classname,
    );
    if (termWrapper) {
      this.showFloatingInput(
        termWrapper.getAttribute("data-tex") || "",
        termWrapper as HTMLElement,
        null,
      );
      return;
    }

    // Otherwise, capture the selected text and open for new math insertion
    const selectedText = range.toString() || "\\chi^2";
    this.showFloatingInput(selectedText, null, range.cloneRange());
  }

  checkState(selection: Selection): boolean {
    const termWrapper = this.api.selection.findParentTag(this.tag, this.classname);
    const isActive = !!termWrapper;
    this.button?.classList.toggle(this.api.styles.inlineToolButtonActive, isActive);
    return isActive;
  }

  /**
   * Displays a floating input anchored to the current selection.
   * @param initialValue  Pre-filled LaTeX string
   * @param existingEl    If editing, the existing span element
   * @param rangeToInsert If creating, a cloned Range to insert into on confirm
   */
  private showFloatingInput(
    initialValue: string,
    existingEl: HTMLElement | null,
    rangeToInsert: Range | null,
  ) {
    // Dismiss any floating input already visible
    this.dismissFloatingInput();

    const sel = window.getSelection();
    const rect =
      existingEl?.getBoundingClientRect() ??
      (sel && sel.rangeCount > 0
        ? sel.getRangeAt(0).getBoundingClientRect()
        : null);

    if (!rect) return;

    const container = document.createElement("div");
    container.className = "oro-math-floating-input";
    container.style.cssText = `
      position: fixed;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px;
      background: var(--background, #fff);
      color: var(--foreground, #111);
      border: 1px solid var(--foreground, #ccc);
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      font-size: 14px;
    `;

    const input = document.createElement("input");
    input.type = "text";
    input.value = initialValue;
    input.placeholder = "LaTeX formula…";
    input.style.cssText = `
      flex: 1;
      padding: 6px 10px;
      border: 1px solid var(--foreground, #ccc);
      border-radius: 4px;
      font-family: ui-monospace, "SF Mono", Menlo, monospace;
      font-size: 13px;
      outline: none;
      background: var(--background, #fff);
      color: var(--foreground, #111);
      min-width: 220px;
    `;
    input.addEventListener("keydown", (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        this.confirmInput(container, input, existingEl, rangeToInsert);
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.dismissFloatingInput();
      }
    });
    input.addEventListener("input", (e: Event) => {
      e.stopPropagation();
    });

    container.appendChild(input);

    // Position below the selection, clamped to viewport
    let top = rect.bottom + 6;
    let left = rect.left;
    container.appendChild(document.createComment("layout probe"));
    document.body.appendChild(container);
    const inputRect = container.getBoundingClientRect();
    document.body.removeChild(container);

    if (left + inputRect.width > window.innerWidth - 8) {
      left = window.innerWidth - inputRect.width - 8;
    }
    if (top + inputRect.height > window.innerHeight - 8) {
      top = rect.top - inputRect.height - 6;
    }

    container.style.top = `${top}px`;
    container.style.left = `${left}px`;
    document.body.appendChild(container);

    // Dismiss on outside click (use timeout to skip the triggering click)
    setTimeout(() => {
      document.addEventListener("mousedown", this._outsideClickHandler);
    }, 0);

    requestAnimationFrame(() => input.focus());
  }

  /**
   * Handler for clicks outside the floating input.
   * Attached via bound reference so it can be removed cleanly.
   */
  private _outsideClickHandler = (e: MouseEvent) => {
    const floating = document.querySelector(".oro-math-floating-input");
    if (floating && !floating.contains(e.target as Node)) {
      this.dismissFloatingInput();
    }
  };

  /** Remove the floating input from the DOM. */
  private dismissFloatingInput() {
    document.removeEventListener("mousedown", this._outsideClickHandler);
    const existing = document.querySelector(".oro-math-floating-input");
    existing?.remove();
  }

  /**
   * Called when the user confirms (Enter) the floating input.
   * Inserts or updates the math element and re-renders KaTeX.
   */
  private confirmInput(
    container: HTMLDivElement,
    input: HTMLInputElement,
    existingEl: HTMLElement | null,
    rangeToInsert: Range | null,
  ) {
    const value = input.value.trim();
    this.dismissFloatingInput();

    if (existingEl) {
      // Editing existing math
      if (!value) {
        this.unwrap(existingEl);
      } else {
        existingEl.setAttribute("data-tex", value);
        katex.render(value, existingEl, { throwOnError: false });
      }
      return;
    }

    if (!value) return;

    // Inserting new math — restore the captured selection, then wrap it
    if (rangeToInsert) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(rangeToInsert);
      }
    }

    const mathSpan = document.createElement(this.tag);
    mathSpan.classList.add(this.classname);
    mathSpan.setAttribute("data-tex", value);
    mathSpan.contentEditable = "false";
    katex.render(value, mathSpan, { throwOnError: false });

    if (rangeToInsert) {
      rangeToInsert.deleteContents();
      rangeToInsert.insertNode(mathSpan);
    }
  }

  /** Replace a math wrapper span with its plain-text LaTeX source. */
  private unwrap(wrapper: HTMLElement) {
    const textNode = document.createTextNode(
      wrapper.getAttribute("data-tex") || "",
    );
    wrapper.parentNode?.replaceChild(textNode, wrapper);
  }
}
