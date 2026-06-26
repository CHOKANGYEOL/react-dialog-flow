import { useState } from "react";
import { useDialog, useDialogInstance } from "react-dialog-flow";
import { Dialog } from "react-dialog-flow/ui";
import { FlowControls } from "../Playground/FlowControls";

export type Log = (message: string) => void;
type ConfirmProps = { title: string; description: string; onLog: Log };
type AlertProps = { message: string; onLog: Log };
type SelectProps = { onLog: Log };
type FormProps = { onLog: Log };
type UserSearchProps = { onLog: Log };
type NestedProps = { onLog: Log };
export type ProfileFormValue = { name: string; role: string };
export type User = { id: string; name: string; role: string };

const dialogProps = {
  motionDuration: 180,
  panel: { className: "dialog-panel" },
} as const;

export function ConfirmDialog({ title, description, onLog }: ConfirmProps) {
  const { complete } = useDialogInstance<boolean>();
  return (
    <Dialog
      {...dialogProps}
      closeOnBackdrop
      overlay={<FlowControls className="dialog-dock" onLog={onLog} />}
    >
      <Dialog.Header className="dialog-header">
        <Dialog.Title>{title}</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <Dialog.Description>{description}</Dialog.Description>
      </Dialog.Body>
      <Dialog.Footer className="dialog-actions">
        <button onClick={() => complete(false)}>Decline</button>
        <button className="primary" onClick={() => complete(true)}>
          Confirm
        </button>
      </Dialog.Footer>
    </Dialog>
  );
}

export function AlertDialog({ message, onLog }: AlertProps) {
  const { close } = useDialogInstance();
  return (
    <Dialog
      {...dialogProps}
      closeOnBackdrop
      overlay={<FlowControls className="dialog-dock" onLog={onLog} />}
    >
      <Dialog.Header className="dialog-header">
        <Dialog.Title>Alert</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <p>{message}</p>
      </Dialog.Body>
      <Dialog.Footer className="dialog-actions">
        <button className="primary" onClick={() => close("programmatic")}>
          Got it
        </button>
      </Dialog.Footer>
    </Dialog>
  );
}

export function SelectDialog({ onLog }: SelectProps) {
  const { complete } = useDialogInstance<string>();
  return (
    <Dialog
      {...dialogProps}
      closeOnBackdrop
      overlay={<FlowControls className="dialog-dock" onLog={onLog} />}
    >
      <Dialog.Header className="dialog-header">
        <Dialog.Title>Select a delivery channel</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <Dialog.Description>
          Return a typed value from a list-style dialog.
        </Dialog.Description>
        <div className="choice-list">
          {["Email", "Slack", "Webhook"].map((channel) => (
            <button key={channel} onClick={() => complete(channel)}>
              {channel}
            </button>
          ))}
        </div>
      </Dialog.Body>
    </Dialog>
  );
}

export function UserSearchDialog({ onLog }: UserSearchProps) {
  const { close, complete } = useDialogInstance<User | null>();
  const users: User[] = [
    { id: "usr_ada", name: "Ada Lovelace", role: "Engineer" },
    { id: "usr_grace", name: "Grace Hopper", role: "Platform lead" },
    { id: "usr_katherine", name: "Katherine Johnson", role: "Analyst" },
  ];

  return (
    <Dialog
      {...dialogProps}
      closeOnBackdrop
      overlay={<FlowControls className="dialog-dock" onLog={onLog} />}
    >
      <Dialog.Header className="dialog-header">
        <Dialog.Title>Find a user</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <Dialog.Description>
          Return a selected domain object, then continue the flow in the caller.
        </Dialog.Description>
        <div className="choice-list">
          {users.map((user) => (
            <button key={user.id} onClick={() => complete(user)}>
              {user.name} · {user.role}
            </button>
          ))}
        </div>
      </Dialog.Body>
      <Dialog.Footer className="dialog-actions">
        <button onClick={() => close("programmatic")}>Cancel search</button>
      </Dialog.Footer>
    </Dialog>
  );
}

export function FormDialog({ onLog }: FormProps) {
  const { complete } = useDialogInstance<ProfileFormValue>();
  const [name, setName] = useState("Ada Lovelace");
  const [role, setRole] = useState("Engineer");

  return (
    <Dialog
      {...dialogProps}
      closeOnEscape={false}
      overlay={<FlowControls className="dialog-dock" onLog={onLog} />}
    >
      <Dialog.Header className="dialog-header">
        <Dialog.Title>Edit profile</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <Dialog.Description>
          Submit structured form data through <code>complete(value)</code>.
        </Dialog.Description>
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="field">
          <span>Role</span>
          <input value={role} onChange={(event) => setRole(event.target.value)} />
        </label>
      </Dialog.Body>
      <Dialog.Footer className="dialog-actions">
        <button
          className="primary"
          onClick={() => complete({ name: name.trim(), role: role.trim() })}
        >
          Save profile
        </button>
      </Dialog.Footer>
    </Dialog>
  );
}

export function NestedDialog({ onLog }: NestedProps) {
  const { open } = useDialog();
  const { close } = useDialogInstance();

  const openNestedAlert = () => {
    const id = open(AlertDialog, {
      message: "This alert was opened from inside another dialog.",
      onLog,
      closeCallback: (reason) => onLog(`Nested alert closed (${reason})`),
    });
    onLog(`Nested alert opened (${id.slice(0, 8)})`);
  };

  return (
    <Dialog
      {...dialogProps}
      closeOnBackdrop
      overlay={<FlowControls className="dialog-dock" onLog={onLog} />}
    >
      <Dialog.Header className="dialog-header">
        <Dialog.Title>Nested dialog flow</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <Dialog.Description>
          Open another dialog from this one, then test closeTop and closeAll.
        </Dialog.Description>
      </Dialog.Body>
      <Dialog.Footer className="dialog-actions">
        <button onClick={() => close("programmatic")}>Close parent</button>
        <button className="primary" onClick={openNestedAlert}>
          Open child alert
        </button>
      </Dialog.Footer>
    </Dialog>
  );
}
