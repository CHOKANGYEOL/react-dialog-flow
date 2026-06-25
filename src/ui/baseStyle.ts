const DIALOG_BASE_STYLE_ID = "react-dialog-flow-base-style";

const DIALOG_BASE_STYLE = `
dialog.rdf-dialog {
  background: transparent;
  border: 0;
  color: inherit;
  height: 100dvh;
  inset: 0;
  margin: 0;
  max-height: none;
  max-width: none;
  overflow: hidden;
  padding: 0;
  position: fixed;
  width: 100vw;
}

dialog.rdf-dialog[open] {
  align-items: center;
  display: flex;
  justify-content: center;
}

dialog.rdf-dialog::backdrop {
  background: transparent;
}

.rdf-dialog__backdrop {
  border: 0;
  height: 100%;
  inset: 0;
  opacity: 1;
  padding: 0;
  position: absolute;
  transition: opacity var(--dialog-motion-ms) var(--rdf-dialog-motion-easing, ease);
  width: 100%;
}

.rdf-dialog__backdrop:not(:disabled) {
  cursor: pointer;
}

.rdf-dialog__panel {
  max-height: 100%;
  max-width: min(100%, var(--rdf-dialog-panel-max-width, 32rem));
  opacity: 1;
  position: relative;
  transform: none;
  transition:
    opacity var(--dialog-motion-ms) var(--rdf-dialog-motion-easing, ease),
    transform var(--dialog-motion-ms) var(--rdf-dialog-motion-easing, ease);
  width: min(100%, var(--rdf-dialog-panel-width, 32rem));
  z-index: var(--rdf-dialog-panel-z-index, 1);
}

.rdf-dialog__header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.rdf-dialog__close-button {
  align-items: center;
  border: 0;
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 auto;
  justify-content: center;
}

.rdf-dialog__close-icon {
  height: var(--rdf-dialog-close-icon-size, 1.25rem);
  width: var(--rdf-dialog-close-icon-size, 1.25rem);
}

.rdf-dialog[data-state="enter"] .rdf-dialog__backdrop,
.rdf-dialog[data-state="closing"] .rdf-dialog__backdrop {
  opacity: 0;
}

.rdf-dialog[data-state="enter"] .rdf-dialog__panel,
.rdf-dialog[data-state="closing"] .rdf-dialog__panel {
  opacity: 0;
  transform: var(--rdf-dialog-enter-transform, translateY(0.5rem) scale(0.98));
}

@media (prefers-reduced-motion: reduce) {
  .rdf-dialog__backdrop,
  .rdf-dialog__panel {
    transition: none;
  }
}
`;

let injected = false;

export function injectDialogBaseStyle() {
  if (typeof document === "undefined") return;

  if (injected || document.getElementById(DIALOG_BASE_STYLE_ID)) {
    injected = true;
    return;
  }

  const style = document.createElement("style");
  style.id = DIALOG_BASE_STYLE_ID;
  style.textContent = DIALOG_BASE_STYLE;
  document.head.appendChild(style);
  injected = true;
}
