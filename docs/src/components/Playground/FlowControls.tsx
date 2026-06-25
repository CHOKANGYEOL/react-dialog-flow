import { useDialog, useDialogStack } from "react-dialog-flow";
import {
  AlertDialog,
  ConfirmDialog,
  FormDialog,
  NestedDialog,
  SelectDialog,
  type Log,
  type ProfileFormValue,
} from "../Dialogs";

export function FlowControls({
  className,
  onLog,
}: {
  className: string;
  onLog: Log;
}) {
  const { closeAll, closeTop, open, openAsync } = useDialog();
  const stack = useDialogStack();
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
  const openAsyncConfirm = async () => {
    onLog("Async confirm opened");
    const value = await openAsync<boolean>(ConfirmDialog, {
      title: "Async confirm",
      description:
        "Choose a result, then watch the log after the exit animation completes.",
      onLog,
      onDismiss: (reason) => {
        onLog(`Async dismissed: ${reason}`);
        return false;
      },
    });
    onLog(`Async completed: ${String(value)}`);
  };
  const openSelect = async () => {
    onLog("Select dialog opened");
    const channel = await openAsync<string>(SelectDialog, {
      onLog,
      onDismiss: (reason) => {
        onLog(`Select dismissed: ${reason}`);
        return "none";
      },
    });
    onLog(`Selected channel: ${channel}`);
  };
  const openForm = async () => {
    onLog("Form dialog opened");
    const profile = await openAsync<ProfileFormValue | null>(FormDialog, {
      onLog,
      onDismiss: (reason) => {
        onLog(`Form dismissed: ${reason}`);
        return null;
      },
    });
    onLog(
      profile
        ? `Saved profile: ${profile.name} (${profile.role})`
        : "Form returned no value",
    );
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
        <button onClick={() => void openAsyncConfirm()}>Async</button>
        <button onClick={() => void openSelect()}>Select</button>
        <button onClick={() => void openForm()}>Form</button>
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
