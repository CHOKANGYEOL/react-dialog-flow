import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementType,
} from "react";
import type { CloseReason, RequestClose } from "../core/types";
import { useDialogEntryControl } from "../react/DialogEntryControl";
import { injectDialogBaseStyle } from "./baseStyle";
import { DialogHeader } from "./DialogHeader";

let scrollLockCount = 0;
let originalDocumentOverflow: string | null = null;

function lockScroll() {
  const { style } = document.documentElement;
  if (scrollLockCount === 0) originalDocumentOverflow = style.overflow;
  scrollLockCount += 1;
  style.overflow = "hidden";
}

function unlockScroll() {
  if (scrollLockCount === 0) return;
  scrollLockCount -= 1;
  if (scrollLockCount > 0) return;
  document.documentElement.style.overflow = originalDocumentOverflow ?? "";
  originalDocumentOverflow = null;
}

export type DialogPanelProps<C extends ElementType> = { as?: C } & Omit<
  ComponentPropsWithoutRef<C>,
  "children"
>;
export type DialogBackdropProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "children" | "type" | "onClick"
>;

type DialogA11yContextValue = {
  registerTitle: (id: string) => () => void;
  registerDescription: (id: string) => () => void;
};

const DialogA11yContext = createContext<DialogA11yContextValue | null>(null);

export type DialogProps<C extends ElementType = "div"> = {
  backdrop?: boolean;
  closeOnBackdrop?: boolean;
  /** Close this dialog when Escape is pressed. Defaults to true. */
  closeOnEscape?: boolean;
  backdropClassName?: string;
  backdropProps?: DialogBackdropProps;
  zIndex?: number;
  className?: string;
  style?: React.CSSProperties;
  panel?: DialogPanelProps<C>;
  /** Content rendered above the panel, useful for viewport-fixed controls. */
  overlay?: React.ReactNode;
  /** Element to focus after the dialog opens. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** Element to focus after the dialog closes. Defaults to the previously focused element. */
  finalFocusRef?: React.RefObject<HTMLElement | null>;
  motionDuration?: number;
  lockScroll?: boolean;
  children: React.ReactNode;
};

function DialogRoot<C extends ElementType = "div">({
  backdrop = true,
  closeOnBackdrop = false,
  closeOnEscape = true,
  backdropClassName,
  backdropProps,
  zIndex,
  className,
  style,
  panel,
  overlay,
  initialFocusRef,
  finalFocusRef,
  motionDuration = 180,
  lockScroll: shouldLockScroll = true,
  children,
}: DialogProps<C>) {
  useInsertionEffect(() => {
    injectDialogBaseStyle();
  }, []);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeFallbackTimerRef = useRef<number | null>(null);
  const enterFrameRef = useRef<number | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const initialFocusRefRef = useRef(initialFocusRef);
  const finalFocusRefRef = useRef(finalFocusRef);
  const closeReasonRef = useRef<CloseReason>("programmatic");
  const didFinishCloseRef = useRef(false);
  const [phase, setPhase] = useState<"enter" | "open" | "closing">("enter");
  const [titleId, setTitleId] = useState<string>();
  const [descriptionId, setDescriptionId] = useState<string>();
  const { closeEntry, setRequestClose } = useDialogEntryControl();
  const {
    as,
    className: panelClassName,
    style: panelStyle,
    ...panelProps
  } = (panel ?? {}) as DialogPanelProps<C>;
  const Panel = (as ?? "div") as ElementType;

  initialFocusRefRef.current = initialFocusRef;
  finalFocusRefRef.current = finalFocusRef;

  const registerTitle = useCallback((id: string) => {
    setTitleId(id);
    return () =>
      setTitleId((current) => (current === id ? undefined : current));
  }, []);
  const registerDescription = useCallback((id: string) => {
    setDescriptionId(id);
    return () =>
      setDescriptionId((current) => (current === id ? undefined : current));
  }, []);
  const a11yContext = useMemo(
    () => ({ registerTitle, registerDescription }),
    [registerDescription, registerTitle],
  );

  const finishClose = useCallback(() => {
    if (didFinishCloseRef.current) return;
    didFinishCloseRef.current = true;
    closeEntry(closeReasonRef.current);
  }, [closeEntry]);

  const requestClose = useCallback<RequestClose>(
    (reason: CloseReason = "programmatic") => {
      if (phase === "closing") return;
      if (reason === "esc" && !closeOnEscape) return;
      closeReasonRef.current = reason;
      didFinishCloseRef.current = false;
      setPhase("closing");
      if (motionDuration === 0) finishClose();
    },
    [closeOnEscape, finishClose, motionDuration, phase],
  );

  useEffect(() => {
    const element = dialogRef.current;
    if (!element) return;
    if (shouldLockScroll) lockScroll();
    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (!element.open) {
      try {
        element.showModal();
      } catch {
        element.setAttribute("open", "");
      }
    }
    enterFrameRef.current = requestAnimationFrame(() => {
      initialFocusRefRef.current?.current?.focus();
      setPhase((current) => (current === "enter" ? "open" : current));
    });
    return () => {
      if (enterFrameRef.current !== null)
        cancelAnimationFrame(enterFrameRef.current);
      if (closeFallbackTimerRef.current !== null)
        window.clearTimeout(closeFallbackTimerRef.current);
      if (element.open) element.close();
      if (shouldLockScroll) unlockScroll();
      const finalFocusElement = finalFocusRefRef.current?.current;
      const previouslyFocusedElement = previouslyFocusedElementRef.current;
      const focusTarget = finalFocusElement?.isConnected
        ? finalFocusElement
        : previouslyFocusedElement;
      if (focusTarget?.isConnected) focusTarget.focus();
    };
  }, [shouldLockScroll]);

  useEffect(() => {
    const element = dialogRef.current;
    if (!element) return;
    const onCancel = (event: Event) => {
      event.preventDefault();
      if (closeOnEscape) requestClose("esc");
    };
    element.addEventListener("cancel", onCancel);
    return () => element.removeEventListener("cancel", onCancel);
  }, [closeOnEscape, requestClose]);

  useEffect(() => {
    if (phase !== "closing" || motionDuration === 0) return;
    const panel =
      dialogRef.current?.querySelector<HTMLElement>(".rdf-dialog__panel");
    const onMotionEnd = (event: Event) => {
      if (event.target === panel) finishClose();
    };
    panel?.addEventListener("transitionend", onMotionEnd);
    panel?.addEventListener("animationend", onMotionEnd);
    closeFallbackTimerRef.current = window.setTimeout(
      finishClose,
      motionDuration + 100,
    );

    return () => {
      panel?.removeEventListener("transitionend", onMotionEnd);
      panel?.removeEventListener("animationend", onMotionEnd);
      if (closeFallbackTimerRef.current !== null)
        window.clearTimeout(closeFallbackTimerRef.current);
      closeFallbackTimerRef.current = null;
    };
  }, [finishClose, motionDuration, phase]);

  useLayoutEffect(() => {
    setRequestClose(requestClose);
    return () => setRequestClose(null);
  }, [requestClose, setRequestClose]);

  const rootStyle = useMemo<React.CSSProperties>(
    () =>
      ({
        ...style,
        "--dialog-motion-ms": `${Math.max(0, motionDuration)}ms`,
      }) as React.CSSProperties,
    [motionDuration, style],
  );
  const mergedPanelStyle = useMemo<React.CSSProperties>(
    () => ({ ...panelStyle, zIndex }),
    [panelStyle, zIndex],
  );

  return (
    <DialogA11yContext.Provider value={a11yContext}>
      <dialog
        ref={dialogRef}
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className={["rdf-dialog", className].filter(Boolean).join(" ")}
        data-backdrop={backdrop}
        data-state={phase}
        onKeyDownCapture={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            if (closeOnEscape) requestClose("esc");
          }
        }}
        style={rootStyle}
      >
        {backdrop && (
          <button
            {...backdropProps}
            aria-label={backdropProps?.["aria-label"] ?? "Close dialog"}
            className={[
              "rdf-dialog__backdrop",
              backdropClassName,
              backdropProps?.className,
            ]
              .filter(Boolean)
              .join(" ")}
            disabled={!closeOnBackdrop || backdropProps?.disabled}
            onClick={() => {
              if (closeOnBackdrop) requestClose("backdrop");
            }}
            type="button"
          />
        )}
        <Panel
          {...panelProps}
          className={["rdf-dialog__panel", panelClassName]
            .filter(Boolean)
            .join(" ")}
          style={mergedPanelStyle}
        >
          {children}
        </Panel>
        {overlay}
      </dialog>
    </DialogA11yContext.Provider>
  );
}

export type DialogTitleProps = React.ComponentPropsWithoutRef<"h2">;

function DialogTitle({
  id: providedId,
  className,
  ...props
}: DialogTitleProps) {
  const context = useContext(DialogA11yContext);
  const generatedId = useId();
  const id = providedId ?? generatedId;

  useEffect(() => context?.registerTitle(id), [context, id]);

  return (
    <h2
      {...props}
      className={["rdf-dialog__title", className].filter(Boolean).join(" ")}
      id={id}
    />
  );
}

export type DialogDescriptionProps = React.ComponentPropsWithoutRef<"p">;

function DialogDescription({
  id: providedId,
  className,
  ...props
}: DialogDescriptionProps) {
  const context = useContext(DialogA11yContext);
  const generatedId = useId();
  const id = providedId ?? generatedId;

  useEffect(() => context?.registerDescription(id), [context, id]);

  return (
    <p
      {...props}
      className={["rdf-dialog__description", className]
        .filter(Boolean)
        .join(" ")}
      id={id}
    />
  );
}

function DialogBody({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      className={["rdf-dialog__body", className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
function DialogFooter({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"footer">) {
  return (
    <footer
      {...props}
      className={["rdf-dialog__footer", className].filter(Boolean).join(" ")}
    >
      {children}
    </footer>
  );
}

export const Dialog = Object.assign(DialogRoot, {
  Header: DialogHeader,
  Title: DialogTitle,
  Description: DialogDescription,
  Body: DialogBody,
  Footer: DialogFooter,
});
