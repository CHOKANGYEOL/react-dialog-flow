import { useRef, useState } from "react";
import { useDialogStack } from "react-dialog-flow";
import type { Log } from "../Dialogs";
import { FlowControls } from "./FlowControls";

export function Playground() {
  const stack = useDialogStack();
  const sequence = useRef(0);
  const [events, setEvents] = useState<Array<{ id: number; message: string }>>([]);
  const addEvent: Log = (message) => {
    sequence.current += 1;
    setEvents((current) => [{ id: sequence.current, message }, ...current].slice(0, 12));
  };

  return <section className="playground docs-section" id="playground">
    <div className="section-heading">
      <p className="section-kicker">06 / Live playground</p>
      <h2>Try confirm, select, form, and nested dialog flows.</h2>
      <p className="muted">Once a native modal opens, the page behind it becomes inert. The same control dock is rendered inside the active dialog so async results, nested stacks, closeTop, and closeAll remain testable.</p>
    </div>
    <div className="playground-grid">
      <section className="panel"><h3>Live stack · {stack.length}</h3>{stack.length === 0 ? <p className="muted">No open dialogs.</p> : <ol>{stack.map((entry) => <li key={entry.id}>{entry.instanceKey ?? entry.id}</li>)}</ol>}</section>
      <section className="panel event-log" aria-live="polite"><h3>Event log</h3>{events.length === 0 ? <p className="muted">Use the floating controls to begin.</p> : <ol reversed>{events.map((event) => <li key={event.id}>{event.message}</li>)}</ol>}</section>
    </div>
    <FlowControls className="floating-controls" onLog={addEvent} />
  </section>;
}
