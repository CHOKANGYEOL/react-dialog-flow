import { useMemo, useSyncExternalStore } from "react";
import { useDialog, useDialogStack } from "react-dialog-flow";
import {
  AlertDialog,
  ConfirmDialog,
  FormDialog,
  GuardedFormDialog,
  NestedDialog,
  SelectDialog,
  UserSearchDialog,
  type Log,
  type ProfileFormValue,
  type User,
} from "../Dialogs";

const pendingFlowKeys = new Set<string>();
const pendingFlowListeners = new Set<() => void>();
const activeFlowRunIds = new Map<string, number>();
let nextFlowRunId = 0;

function emitPendingFlowChange() {
  pendingFlowListeners.forEach((listener) => listener());
}

function subscribePendingFlows(listener: () => void) {
  pendingFlowListeners.add(listener);
  return () => pendingFlowListeners.delete(listener);
}

function getPendingFlowSnapshot() {
  return [...pendingFlowKeys].sort().join("|");
}

function isCurrentFlowRun(key: string, runId: number) {
  return activeFlowRunIds.get(key) === runId;
}

export function FlowControls({
  className,
  onLog,
}: {
  className: string;
  onLog: Log;
}) {
  const { closeAll, closeTop, open, openAsyncResult } = useDialog();
  const stack = useDialogStack();
  const pendingFlowSnapshot = useSyncExternalStore(
    subscribePendingFlows,
    getPendingFlowSnapshot,
    getPendingFlowSnapshot,
  );
  const pendingFlows = useMemo(
    () =>
      new Set(
        pendingFlowSnapshot === "" ? [] : pendingFlowSnapshot.split("|"),
      ),
    [pendingFlowSnapshot],
  );
  const runAsyncFlow = (key: string, flow: (runId: number) => Promise<void>) => {
    if (pendingFlowKeys.has(key)) return;

    nextFlowRunId += 1;
    const runId = nextFlowRunId;
    activeFlowRunIds.set(key, runId);
    pendingFlowKeys.add(key);
    emitPendingFlowChange();
    void flow(runId).finally(() => {
      if (isCurrentFlowRun(key, runId)) {
        activeFlowRunIds.delete(key);
        pendingFlowKeys.delete(key);
        emitPendingFlowChange();
      }
    });
  };
  const openAlert = () => {
    const id = open(AlertDialog, {
      message:
        "A regular stack entry. Open another dialog, then close this from the dock.",
      onLog,
      closeCallback: (reason) => onLog(`Alert closed (${reason})`),
    });
    onLog(`Alert opened (${id.slice(0, 8)})`);
  };
  const openConfirm = () => {
    const id = open(ConfirmDialog, {
      title: "Regular confirm",
      description:
        "This entry is opened with open(). Its buttons still exercise the shared close lifecycle.",
      onLog,
      closeCallback: (reason) => onLog(`Confirm closed (${reason})`),
    });
    onLog(`Confirm opened (${id.slice(0, 8)})`);
  };
  const openInviteFlow = async (runId: number) => {
    onLog("Invite flow started");
    const userResult = await openAsyncResult<User | null>(UserSearchDialog, {
      onLog,
    });
    if (!isCurrentFlowRun("invite", runId)) return;

    if (userResult.status === "dismissed") {
      onLog(`User search dismissed: ${userResult.reason}`);
      onLog("Invite flow stopped before confirmation");
      return;
    }

    const user = userResult.value;
    if (!user) {
      onLog("Invite flow stopped before confirmation");
      return;
    }

    onLog(`Selected user: ${user.name}`);
    const confirmationResult = await openAsyncResult<boolean>(ConfirmDialog, {
      title: `Add ${user.name}?`,
      description: `Confirm adding ${user.name} (${user.role}) to the workspace.`,
      onLog,
    });
    if (!isCurrentFlowRun("invite", runId)) return;

    if (confirmationResult.status === "dismissed") {
      onLog(`Invite confirmation dismissed: ${confirmationResult.reason}`);
    }
    const confirmed =
      confirmationResult.status === "completed" && confirmationResult.value;

    onLog(
      confirmed
        ? `Added user: ${user.name} (${user.id})`
        : `Invite cancelled for ${user.name}`,
    );
  };
  const openSelect = async (runId: number) => {
    onLog("Select dialog opened");
    const result = await openAsyncResult<string>(SelectDialog, {
      onLog,
    });
    if (!isCurrentFlowRun("select", runId)) return;

    if (result.status === "dismissed") {
      onLog(`Select dismissed: ${result.reason}`);
      return;
    }

    onLog(`Selected channel: ${result.value}`);
  };
  const openForm = async (runId: number) => {
    onLog("Form dialog opened");
    const result = await openAsyncResult<ProfileFormValue>(FormDialog, {
      onLog,
    });
    if (!isCurrentFlowRun("form", runId)) return;

    if (result.status === "dismissed") {
      onLog(`Form dismissed: ${result.reason}`);
      return;
    }

    onLog(`Saved profile: ${result.value.name} (${result.value.role})`);
  };
  const openGuardedForm = async (runId: number) => {
    onLog("Guarded form opened");
    const result = await openAsyncResult<ProfileFormValue>(GuardedFormDialog, {
      onLog,
    });
    if (!isCurrentFlowRun("guarded-form", runId)) return;

    if (result.status === "completed") {
      onLog(
        `Saved guarded profile: ${result.value.name} (${result.value.role})`,
      );
      return;
    }

    onLog(`Guarded form dismissed: ${result.reason}`);
  };
  const openNested = () => {
    const id = open(NestedDialog, {
      onLog,
      closeCallback: (reason) => onLog(`Nested parent closed (${reason})`),
    });
    onLog(`Nested parent opened (${id.slice(0, 8)})`);
  };

  return (
    <aside aria-label="Dialog flow controls" className={className}>
      <span className="stack-count">Stack {stack.length}</span>
      <span className="control-group" aria-label="Open dialog examples">
        <button className="primary" onClick={openConfirm}>
          Confirm
        </button>
        <button onClick={openAlert}>Alert</button>
        <button
          disabled={pendingFlows.has("invite")}
          onClick={() => runAsyncFlow("invite", openInviteFlow)}
        >
          Invite flow
        </button>
        <button
          disabled={pendingFlows.has("select")}
          onClick={() => runAsyncFlow("select", openSelect)}
        >
          Select
        </button>
        <button
          disabled={pendingFlows.has("form")}
          onClick={() => runAsyncFlow("form", openForm)}
        >
          Form
        </button>
        <button
          disabled={pendingFlows.has("guarded-form")}
          onClick={() => runAsyncFlow("guarded-form", openGuardedForm)}
        >
          Guarded form
        </button>
        <button onClick={openNested}>Nested</button>
      </span>
      <span className="control-group" aria-label="Stack controls">
        <button
          disabled={stack.length === 0}
          onClick={() => {
            onLog("Close top requested");
            closeTop();
          }}
        >
          Close top
        </button>
        <button
          disabled={stack.length === 0}
          onClick={() => {
            onLog("Close all requested");
            closeAll();
          }}
        >
          Close all
        </button>
      </span>
    </aside>
  );
}
