export type ViewMode = "edit" | "preview";

export const GLOBAL_MODE_EVENT = "scribex-mode-change";

export function broadcastMode(mode: ViewMode): void {
  window.dispatchEvent(
    new CustomEvent<{ mode: ViewMode }>(GLOBAL_MODE_EVENT, { detail: { mode } }),
  );
}
