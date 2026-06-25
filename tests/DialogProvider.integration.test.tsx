import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

function OpenHeaderOnlyFlow() {
  const { open } = useDialog();
  return (
    <button onClick={() => open(HeaderOnlyDialog)}>Open header only</button>
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
  const panel = document.querySelector(".rdf-dialog__panel");
  if (!panel) throw new Error("Dialog panel was not rendered.");
  fireEvent.transitionEnd(panel);
}

describe("DialogProvider integration", () => {
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
        ?.textContent?.includes("margin-left: auto;"),
    ).toBe(true);
  });
});
