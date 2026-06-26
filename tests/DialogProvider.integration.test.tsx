import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import type { RefObject } from "react";
import { DialogProvider, useDialog, useDialogInstance } from "../src";
import { Dialog } from "../src/ui";

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value() {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value() {
      this.removeAttribute("open");
    },
  });
});

afterEach(cleanup);

function ResultDialog() {
  const { complete } = useDialogInstance<boolean>();
  return (
    <Dialog motionDuration={180}>
      <Dialog.Header>
        <Dialog.Title>Confirm action</Dialog.Title>
      </Dialog.Header>
      <Dialog.Description>This action needs a decision.</Dialog.Description>
      <button onClick={() => complete(true)}>Accept</button>
    </Dialog>
  );
}

function HeaderOnlyDialog() {
  return (
    <Dialog>
      <Dialog.Header />
    </Dialog>
  );
}

function EscapeDisabledDialog() {
  return (
    <Dialog closeOnEscape={false}>
      <Dialog.Header>
        <Dialog.Title>Required decision</Dialog.Title>
      </Dialog.Header>
    </Dialog>
  );
}

function ImmediateDialog() {
  const { complete } = useDialogInstance<boolean>();
  return (
    <Dialog motionDuration={0}>
      <Dialog.Header>
        <Dialog.Title>Immediate dialog</Dialog.Title>
      </Dialog.Header>
      <button onClick={() => complete(true)}>Resolve now</button>
    </Dialog>
  );
}

function BackdropDismissDialog() {
  return (
    <Dialog closeOnBackdrop motionDuration={180}>
      <Dialog.Header>
        <Dialog.Title>Backdrop dismissal</Dialog.Title>
      </Dialog.Header>
      <Dialog.Description>Click outside to dismiss.</Dialog.Description>
    </Dialog>
  );
}

function DefaultBackdropDialog() {
  return (
    <Dialog>
      <Dialog.Header>
        <Dialog.Title>Default backdrop</Dialog.Title>
      </Dialog.Header>
    </Dialog>
  );
}

function FallbackMotionDialog() {
  return (
    <Dialog closeOnBackdrop motionDuration={1}>
      <Dialog.Header>
        <Dialog.Title>Fallback motion</Dialog.Title>
      </Dialog.Header>
    </Dialog>
  );
}

function FocusDialog({
  finalFocusRef,
}: {
  finalFocusRef?: RefObject<HTMLButtonElement | null>;
}) {
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const { close } = useDialogInstance();
  return (
    <Dialog
      finalFocusRef={finalFocusRef}
      initialFocusRef={initialFocusRef}
      motionDuration={0}
    >
      <Dialog.Header>
        <Dialog.Title>Focus dialog</Dialog.Title>
      </Dialog.Header>
      <button ref={initialFocusRef}>Initial target</button>
      <button onClick={() => close()}>Finish focus dialog</button>
    </Dialog>
  );
}

function NoScrollLockDialog() {
  return (
    <Dialog lockScroll={false}>
      <Dialog.Header>
        <Dialog.Title>No scroll lock</Dialog.Title>
      </Dialog.Header>
    </Dialog>
  );
}

function StackDialog({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  const { complete } = useDialogInstance<string>();
  return (
    <Dialog closeOnBackdrop motionDuration={180}>
      <Dialog.Header>
        <Dialog.Title>{title}</Dialog.Title>
      </Dialog.Header>
      <button onClick={() => complete(value)}>Complete {title}</button>
    </Dialog>
  );
}

function OpenImmediateFlow({
  onResult,
}: {
  onResult: (value: boolean) => void;
}) {
  const { openAsync } = useDialog();
  return (
    <button
      onClick={async () =>
        onResult(
          await openAsync<boolean>(ImmediateDialog, {
            onDismiss: () => false,
          }),
        )
      }
    >
      Open immediate
    </button>
  );
}

function OpenAsyncFlow({ onResult }: { onResult: (value: boolean) => void }) {
  const { openAsync } = useDialog();
  return (
    <button
      onClick={async () =>
        onResult(
          await openAsync<boolean>(ResultDialog, { onDismiss: () => false }),
        )
      }
    >
      Open async
    </button>
  );
}

function OpenDefaultBackdropFlow({
  onResult,
}: {
  onResult: (value: unknown) => void;
}) {
  const { openAsyncResult } = useDialog();
  return (
    <button
      onClick={async () =>
        onResult(await openAsyncResult<boolean>(DefaultBackdropDialog))
      }
    >
      Open default backdrop
    </button>
  );
}

function OpenBackdropDismissFlow({
  onResult,
}: {
  onResult: (value: string) => void;
}) {
  const { openAsync } = useDialog();
  return (
    <button
      onClick={async () =>
        onResult(
          await openAsync<string>(BackdropDismissDialog, {
            onDismiss: (reason) => reason,
          }),
        )
      }
    >
      Open backdrop async
    </button>
  );
}

function OpenFallbackMotionFlow({
  onResult,
}: {
  onResult: (value: unknown) => void;
}) {
  const { openAsyncResult } = useDialog();
  return (
    <button
      onClick={async () =>
        onResult(await openAsyncResult<boolean>(FallbackMotionDialog))
      }
    >
      Open fallback motion
    </button>
  );
}

function OpenBackdropResultFlow({
  onResult,
}: {
  onResult: (value: unknown) => void;
}) {
  const { openAsyncResult } = useDialog();
  return (
    <button
      onClick={async () =>
        onResult(await openAsyncResult<string>(BackdropDismissDialog))
      }
    >
      Open backdrop result
    </button>
  );
}

function OpenResultFlow({ onResult }: { onResult: (value: unknown) => void }) {
  const { openAsyncResult } = useDialog();
  return (
    <button
      onClick={async () =>
        onResult(await openAsyncResult<boolean>(ResultDialog))
      }
    >
      Open result
    </button>
  );
}

function OpenStackedAsyncFlow({
  onFirst,
  onSecond,
}: {
  onFirst: (value: string) => void;
  onSecond: (value: string) => void;
}) {
  const { openAsync } = useDialog();
  return (
    <button
      onClick={() => {
        void openAsync<string>(StackDialog, {
          title: "First dialog",
          value: "first",
          onDismiss: (reason) => `first:${reason}`,
        }).then(onFirst);
        void openAsync<string>(StackDialog, {
          title: "Second dialog",
          value: "second",
          onDismiss: (reason) => `second:${reason}`,
        }).then(onSecond);
      }}
    >
      Open stacked async
    </button>
  );
}

function OpenFocusFlow({
  onFallbackReady,
}: {
  onFallbackReady?: (element: HTMLButtonElement) => void;
}) {
  const { open } = useDialog();
  const finalFocusRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button>Previous focus</button>
      <button
        onClick={() => open(FocusDialog, { finalFocusRef })}
        type="button"
      >
        Open focus dialog
      </button>
      <button
        ref={(element) => {
          finalFocusRef.current = element;
          if (element) onFallbackReady?.(element);
        }}
        type="button"
      >
        Focus fallback
      </button>
    </>
  );
}

function OpenHeaderOnlyFlow() {
  const { open } = useDialog();
  return (
    <button onClick={() => open(HeaderOnlyDialog)}>Open header only</button>
  );
}

function OpenNoScrollLockFlow() {
  const { open } = useDialog();
  return <button onClick={() => open(NoScrollLockDialog)}>Open no lock</button>;
}

function OpenEscapeDisabledFlow() {
  const { open } = useDialog();
  return (
    <button onClick={() => open(EscapeDisabledDialog)}>
      Open escape disabled
    </button>
  );
}

function PendingAsyncFlow({
  onResult,
}: {
  onResult: (value: unknown) => void;
}) {
  const { openAsyncResult } = useDialog();
  return (
    <button
      onClick={async () =>
        onResult(await openAsyncResult<boolean>(ResultDialog))
      }
    >
      Open pending async
    </button>
  );
}

function OpenAndCloseTopFlow({
  onDismiss,
}: {
  onDismiss: (reason: string) => void;
}) {
  const { closeTop, openAsync } = useDialog();
  return (
    <>
      <button
        onClick={async () => {
          await openAsync<boolean>(ResultDialog, {
            onDismiss: (reason) => {
              onDismiss(reason);
              return false;
            },
          });
        }}
      >
        Open async
      </button>
      <button onClick={() => closeTop()}>Close top</button>
    </>
  );
}

function OpenAndCloseAllFlow({
  onDismiss,
}: {
  onDismiss: (reason: string) => void;
}) {
  const { closeAll, openAsync } = useDialog();
  return (
    <>
      <button
        onClick={async () => {
          await openAsync<boolean>(ResultDialog, {
            onDismiss: (reason) => {
              onDismiss(reason);
              return false;
            },
          });
        }}
      >
        Open async
      </button>
      <button onClick={() => closeAll()}>Close all</button>
    </>
  );
}

function finishDialogExit() {
  const panel =
    document.querySelector('dialog[data-state="closing"] .rdf-dialog__panel') ??
    document.querySelector(".rdf-dialog__panel");
  if (!panel) throw new Error("Dialog panel was not rendered.");
  fireEvent.transitionEnd(panel);
}

function clickTopBackdrop() {
  const backdrops = document.querySelectorAll<HTMLButtonElement>(
    ".rdf-dialog__backdrop",
  );
  const backdrop = backdrops[backdrops.length - 1];
  if (!backdrop) throw new Error("Dialog backdrop was not rendered.");
  fireEvent.click(backdrop);
}

function clickHeaderClose() {
  const closeButton = document.querySelector<HTMLButtonElement>(
    ".rdf-dialog__close-button",
  );
  if (!closeButton) throw new Error("Header close button was not rendered.");
  fireEvent.click(closeButton);
}

describe("DialogProvider integration", () => {
  it("resolves motionDuration=0 dialogs immediately without waiting for motion events", async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <DialogProvider>
        <OpenImmediateFlow onResult={onResult} />
      </DialogProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open immediate" }));
    await user.click(
      await screen.findByRole("button", { name: "Resolve now" }),
    );

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true));
    await waitFor(() => expect(document.querySelector("dialog")).toBeNull());
  });

  it("resolves openAsync with a completed value after the exit transition", async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <DialogProvider>
        <OpenAsyncFlow onResult={onResult} />
      </DialogProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open async" }));
    await user.click(await screen.findByRole("button", { name: "Accept" }));
    await waitFor(() =>
      expect(document.querySelector("dialog")?.dataset.state).toBe("closing"),
    );
    expect(onResult).not.toHaveBeenCalled();
    finishDialogExit();
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true));
  });

  it("resolves an openAsync dismissal only after the exit transition", async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <DialogProvider>
        <OpenBackdropDismissFlow onResult={onResult} />
      </DialogProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Open backdrop async" }),
    );
    await screen.findByRole("heading", { name: "Backdrop dismissal" });
    clickTopBackdrop();

    await waitFor(() =>
      expect(document.querySelector("dialog")?.dataset.state).toBe("closing"),
    );
    expect(onResult).not.toHaveBeenCalled();
    finishDialogExit();
    await waitFor(() => expect(onResult).toHaveBeenCalledWith("backdrop"));
  });

  it("uses the motion fallback timer when no transition or animation event fires", async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <DialogProvider>
        <OpenFallbackMotionFlow onResult={onResult} />
      </DialogProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Open fallback motion" }),
    );
    await screen.findByRole("heading", { name: "Fallback motion" });
    clickTopBackdrop();

    await waitFor(() =>
      expect(document.querySelector("dialog")?.dataset.state).toBe("closing"),
    );
    await waitFor(() =>
      expect(onResult).toHaveBeenCalledWith({
        status: "dismissed",
        reason: "backdrop",
      }),
    );
    expect(document.querySelector("dialog")).toBeNull();
  });

  it("finishes closing on animationend as well as transitionend", async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <DialogProvider>
        <OpenBackdropResultFlow onResult={onResult} />
      </DialogProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Open backdrop result" }),
    );
    await screen.findByRole("heading", { name: "Backdrop dismissal" });
    clickTopBackdrop();
    await waitFor(() =>
      expect(document.querySelector("dialog")?.dataset.state).toBe("closing"),
    );

    const panel = document.querySelector(".rdf-dialog__panel");
    if (!panel) throw new Error("Dialog panel was not rendered.");
    fireEvent.animationEnd(panel);

    await waitFor(() =>
      expect(onResult).toHaveBeenCalledWith({
        status: "dismissed",
        reason: "backdrop",
      }),
    );
  });

  it("returns a dismiss reason for Escape through openAsyncResult", async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <DialogProvider>
        <OpenResultFlow onResult={onResult} />
      </DialogProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open result" }));
    await screen.findByRole("button", { name: "Accept" });
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() =>
      expect(document.querySelector("dialog")?.dataset.state).toBe("closing"),
    );
    finishDialogExit();
    await waitFor(() =>
      expect(onResult).toHaveBeenCalledWith({
        status: "dismissed",
        reason: "esc",
      }),
    );
  });

  it("keeps the dialog open when the default backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <DialogProvider>
        <OpenDefaultBackdropFlow onResult={onResult} />
      </DialogProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Open default backdrop" }),
    );
    await screen.findByRole("heading", { name: "Default backdrop" });

    const backdrop = document.querySelector<HTMLButtonElement>(
      ".rdf-dialog__backdrop",
    );
    expect(backdrop?.disabled).toBe(true);
    await waitFor(() =>
      expect(document.querySelector("dialog")?.dataset.state).toBe("open"),
    );
    await user.click(backdrop!);

    expect(document.querySelector("dialog")?.dataset.state).toBe("open");
    expect(onResult).not.toHaveBeenCalled();

    clickHeaderClose();
    finishDialogExit();
    await waitFor(() =>
      expect(onResult).toHaveBeenCalledWith({
        status: "dismissed",
        reason: "header",
      }),
    );
  });

  it("returns a dismiss reason for backdrop through openAsyncResult", async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <DialogProvider>
        <OpenBackdropResultFlow onResult={onResult} />
      </DialogProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Open backdrop result" }),
    );
    await screen.findByRole("heading", { name: "Backdrop dismissal" });
    clickTopBackdrop();
    await waitFor(() =>
      expect(document.querySelector("dialog")?.dataset.state).toBe("closing"),
    );
    finishDialogExit();
    await waitFor(() =>
      expect(onResult).toHaveBeenCalledWith({
        status: "dismissed",
        reason: "backdrop",
      }),
    );
  });

  it("closes only the top dialog in a stacked async flow on Escape", async () => {
    const user = userEvent.setup();
    const onFirst = vi.fn();
    const onSecond = vi.fn();
    render(
      <DialogProvider>
        <OpenStackedAsyncFlow onFirst={onFirst} onSecond={onSecond} />
      </DialogProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Open stacked async" }),
    );
    await screen.findByRole("heading", { name: "First dialog" });
    await screen.findByRole("heading", { name: "Second dialog" });

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => {
      const dialogs = document.querySelectorAll("dialog");
      expect(dialogs).toHaveLength(2);
      expect(dialogs[1]?.dataset.state).toBe("closing");
    });
    expect(onFirst).not.toHaveBeenCalled();
    expect(onSecond).not.toHaveBeenCalled();

    finishDialogExit();
    await waitFor(() => expect(onSecond).toHaveBeenCalledWith("second:esc"));
    expect(onFirst).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "First dialog" })).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Second dialog" }),
    ).toBeNull();
  });

  it("keeps lower stacked dialogs open when the top backdrop closes", async () => {
    const user = userEvent.setup();
    const onFirst = vi.fn();
    const onSecond = vi.fn();
    render(
      <DialogProvider>
        <OpenStackedAsyncFlow onFirst={onFirst} onSecond={onSecond} />
      </DialogProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Open stacked async" }),
    );
    await screen.findByRole("heading", { name: "First dialog" });
    await screen.findByRole("heading", { name: "Second dialog" });
    clickTopBackdrop();

    await waitFor(() => {
      const dialogs = document.querySelectorAll("dialog");
      expect(dialogs).toHaveLength(2);
      expect(dialogs[1]?.dataset.state).toBe("closing");
    });
    finishDialogExit();
    await waitFor(() =>
      expect(onSecond).toHaveBeenCalledWith("second:backdrop"),
    );
    expect(onFirst).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "First dialog" })).toBeTruthy();
  });

  it("keeps scroll locked until the last stacked dialog closes", async () => {
    const user = userEvent.setup();
    const originalOverflow = "auto";
    document.documentElement.style.overflow = originalOverflow;
    render(
      <DialogProvider>
        <OpenStackedAsyncFlow
          onFirst={() => undefined}
          onSecond={() => undefined}
        />
      </DialogProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Open stacked async" }),
    );
    await screen.findByRole("heading", { name: "First dialog" });
    await screen.findByRole("heading", { name: "Second dialog" });
    expect(document.documentElement.style.overflow).toBe("hidden");

    clickTopBackdrop();
    await waitFor(() =>
      expect(document.querySelectorAll("dialog")[1]?.dataset.state).toBe(
        "closing",
      ),
    );
    finishDialogExit();
    await waitFor(() =>
      expect(document.querySelectorAll("dialog")).toHaveLength(1),
    );
    expect(document.documentElement.style.overflow).toBe("hidden");

    clickTopBackdrop();
    finishDialogExit();
    await waitFor(() => expect(document.querySelector("dialog")).toBeNull());
    expect(document.documentElement.style.overflow).toBe(originalOverflow);
  });

  it("does not lock document scroll when lockScroll is false", async () => {
    const user = userEvent.setup();
    document.documentElement.style.overflow = "visible";
    render(
      <DialogProvider>
        <OpenNoScrollLockFlow />
      </DialogProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open no lock" }));
    await screen.findByRole("heading", { name: "No scroll lock" });

    expect(document.documentElement.style.overflow).toBe("visible");
  });

  it("moves focus to the initial target and restores the explicit final target", async () => {
    const user = userEvent.setup();
    const onFallbackReady = vi.fn();
    render(
      <DialogProvider>
        <OpenFocusFlow onFallbackReady={onFallbackReady} />
      </DialogProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open focus dialog" }));
    const initialTarget = await screen.findByRole("button", {
      name: "Initial target",
    });
    await waitFor(() => expect(document.activeElement).toBe(initialTarget));

    await user.click(
      screen.getByRole("button", { name: "Finish focus dialog" }),
    );
    await waitFor(() => expect(document.querySelector("dialog")).toBeNull());
    const lastCall =
      onFallbackReady.mock.calls[onFallbackReady.mock.calls.length - 1];
    expect(document.activeElement).toBe(lastCall?.[0]);
  });

  it("uses the supplied dismiss fallback when closeTop closes an async entry", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn(() => false);
    render(
      <DialogProvider>
        <OpenAndCloseTopFlow onDismiss={onDismiss} />
      </DialogProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open async" }));
    await screen.findByRole("button", { name: "Accept" });
    await user.click(screen.getByRole("button", { name: "Close top" }));
    await waitFor(() =>
      expect(document.querySelector("dialog")?.dataset.state).toBe("closing"),
    );
    finishDialogExit();
    await waitFor(() => expect(onDismiss).toHaveBeenCalledWith("programmatic"));
  });

  it("uses the supplied dismiss fallback when closeAll closes an async entry", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn(() => false);
    render(
      <DialogProvider>
        <OpenAndCloseAllFlow onDismiss={onDismiss} />
      </DialogProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open async" }));
    await screen.findByRole("button", { name: "Accept" });
    await user.click(screen.getByRole("button", { name: "Close all" }));
    await waitFor(() =>
      expect(document.querySelector("dialog")?.dataset.state).toBe("closing"),
    );
    finishDialogExit();
    await waitFor(() => expect(onDismiss).toHaveBeenCalledWith("programmatic"));
  });

  it("resolves pending async dialogs as programmatic when the provider unmounts", async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    const { unmount } = render(
      <DialogProvider>
        <PendingAsyncFlow onResult={onResult} />
      </DialogProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Open pending async" }),
    );
    await screen.findByRole("heading", { name: "Confirm action" });
    unmount();

    await waitFor(() =>
      expect(onResult).toHaveBeenCalledWith({
        status: "dismissed",
        reason: "programmatic",
      }),
    );
  });

  it("connects Dialog.Title and Dialog.Description to the native dialog", async () => {
    render(
      <DialogProvider>
        <OpenResultFlow onResult={() => undefined} />
      </DialogProvider>,
    );
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Open result" }));

    const dialog = document.querySelector("dialog");
    const title = screen.getByRole("heading", { name: "Confirm action" });
    const description = screen.getByText("This action needs a decision.");
    await waitFor(() => {
      expect(dialog?.getAttribute("aria-labelledby")).toBe(title.id);
      expect(dialog?.getAttribute("aria-describedby")).toBe(description.id);
    });
  });

  it("injects base UI styles once and applies structural classes", async () => {
    const user = userEvent.setup();
    render(
      <DialogProvider>
        <OpenResultFlow onResult={() => undefined} />
      </DialogProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open result" }));
    expect(
      document.querySelectorAll("#react-dialog-flow-base-style"),
    ).toHaveLength(1);
    expect(
      screen
        .getByRole("heading", { name: "Confirm action" })
        .classList.contains("rdf-dialog__title"),
    ).toBe(true);
    expect(
      screen
        .getByText("This action needs a decision.")
        .classList.contains("rdf-dialog__description"),
    ).toBe(true);

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() =>
      expect(document.querySelector("dialog")?.dataset.state).toBe("closing"),
    );
    finishDialogExit();
    await waitFor(() => expect(document.querySelector("dialog")).toBeNull());

    await user.click(screen.getByRole("button", { name: "Open result" }));
    expect(
      document.querySelectorAll("#react-dialog-flow-base-style"),
    ).toHaveLength(1);
  });

  it("keeps the header close button aligned to the end without children", async () => {
    const user = userEvent.setup();
    render(
      <DialogProvider>
        <OpenHeaderOnlyFlow />
      </DialogProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open header only" }));
    const closeButton = document.querySelector(".rdf-dialog__close-button");

    expect(closeButton).not.toBeNull();
    expect(closeButton?.getAttribute("aria-label")).toBe("Close dialog");
    expect(
      document
        .getElementById("react-dialog-flow-base-style")
        ?.textContent?.includes(
          ".rdf-dialog__header > .rdf-dialog__close-button",
        ),
    ).toBe(true);
  });

  it("keeps a dialog open when closeOnEscape is false", async () => {
    const user = userEvent.setup();
    render(
      <DialogProvider>
        <OpenEscapeDisabledFlow />
      </DialogProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Open escape disabled" }),
    );

    const dialog = document.querySelector("dialog");
    expect(dialog).not.toBeNull();
    await waitFor(() => expect(dialog?.dataset.state).toBe("open"));

    fireEvent.keyDown(dialog!, { key: "Escape" });
    dialog!.dispatchEvent(new Event("cancel", { bubbles: false }));

    expect(document.querySelector("dialog")?.dataset.state).toBe("open");
  });

  it("keeps a dialog open when provider closeOnEscape is false", async () => {
    const user = userEvent.setup();
    render(
      <DialogProvider closeOnEscape={false}>
        <OpenResultFlow onResult={() => undefined} />
      </DialogProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open result" }));
    const dialog = document.querySelector("dialog");
    expect(dialog).not.toBeNull();
    await waitFor(() => expect(dialog?.dataset.state).toBe("open"));

    fireEvent.keyDown(window, { key: "Escape" });

    expect(document.querySelector("dialog")?.dataset.state).toBe("open");
  });
});
