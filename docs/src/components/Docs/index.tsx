import { useState } from "react";

const installCommands = {
  npm: "npm install react-dialog-flow@beta",
  pnpm: "pnpm add react-dialog-flow@beta",
  yarn: "yarn add react-dialog-flow@beta",
} as const;

type PackageManager = keyof typeof installCommands;

function CodeExample({ children }: { children: string }) {
  return (
    <pre className="code-example">
      <code>{children}</code>
    </pre>
  );
}

function Installation() {
  const [packageManager, setPackageManager] = useState<PackageManager>("pnpm");
  const [copied, setCopied] = useState(false);
  const command = installCommands[packageManager];

  const copyCommand = async () => {
    await navigator.clipboard?.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="installation">
      <div aria-label="Package manager" className="package-tabs" role="tablist">
        {(Object.keys(installCommands) as PackageManager[]).map((manager) => (
          <button
            aria-selected={packageManager === manager}
            className={packageManager === manager ? "active" : undefined}
            key={manager}
            onClick={() => setPackageManager(manager)}
            role="tab"
            type="button"
          >
            {manager}
          </button>
        ))}
      </div>
      <div className="install-command">
        <code>{command}</code>
        <button
          aria-label="Copy install command"
          onClick={() => void copyCommand()}
          type="button"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export function Docs() {
  return (
    <>
      <section className="docs-section" id="install">
        <div className="section-heading">
          <p className="section-kicker">01 / Install</p>
          <h2>Add the package to your app.</h2>
        </div>
        <div className="docs-grid">
          <Installation />
          <div>
            <p>
              The package includes the headless stack, React provider, and hooks
              for opening dialogs from any child screen.
            </p>
            <p className="muted">
              Import <code>react-dialog-flow/ui</code> only when you want the
              supplied native-modal UI and styles.
            </p>
          </div>
        </div>
      </section>
      <section className="docs-section" id="provider">
        <div className="section-heading">
          <p className="section-kicker">02 / Provider</p>
          <h2>
            Render one provider, then open components from anywhere below it.
          </h2>
        </div>
        <div className="docs-grid">
          <div>
            <p>
              The provider owns the ordered stack and creates a portal by
              default. Your dialog component receives only its own domain props;
              entry controls come from <code>useDialogInstance</code>.
            </p>
            <p className="muted">
              This library deliberately does not try to be a form system, a
              router, or a global command registry.
            </p>
          </div>
          <CodeExample>{`import { DialogProvider, useDialog } from 'react-dialog-flow';

function Page() {
  const { open } = useDialog();
  return <button onClick={() => open(ConfirmDialog, { title: 'Delete?' })}>
    Delete
  </button>;
}

createRoot(root).render(<DialogProvider><Page /></DialogProvider>);`}</CodeExample>
        </div>
      </section>
      <section className="docs-section" id="stack">
        <div className="section-heading">
          <p className="section-kicker">03 / Stack</p>
          <h2>Use the stack when dialogs lead to other dialogs.</h2>
        </div>
        <div className="docs-grid">
          <CodeExample>{`const { open, closeTop, closeAll } = useDialog();

open(ConfirmDialog, { title: 'Archive project?' });
open(AlertDialog, { message: 'The archive is permanent.' });

closeTop(); // closes AlertDialog through its exit lifecycle
closeAll(); // asks every open entry to close`}</CodeExample>
          <div>
            <p>
              <code>closeTop</code> and <code>closeAll</code> do not bypass the
              UI primitive. When an entry uses <code>Dialog</code>, it stays
              mounted through its exit transition before it leaves the stack.
            </p>
            <p>
              Pass <code>isSingleInstance</code> and <code>instanceKey</code>{" "}
              when only one instance of a particular flow should exist.
            </p>
          </div>
        </div>
      </section>
      <section className="docs-section" id="async">
        <div className="section-heading">
          <p className="section-kicker">04 / Async results</p>
          <h2>
            Await a choice without leaking dialog state into the calling screen.
          </h2>
        </div>
        <div className="docs-grid">
          <div>
            <p>
              <code>openAsync</code> is the ergonomic API. A dismiss resolves to{" "}
              <code>false</code> unless you provide an <code>onDismiss</code>{" "}
              fallback. For flows where the reason matters, use{" "}
              <code>openAsyncResult</code>.
            </p>
            <p>
              The promise resolves after the entry has finished closing, not
              when its button is first pressed.
            </p>
          </div>
          <CodeExample>{`const confirmed = await openAsync<boolean>(ConfirmDialog, {
  title: 'Delete project?',
  onDismiss: () => false,
});

if (confirmed) await deleteProject();

const { complete } = useDialogInstance<boolean>();
<button onClick={() => complete(true)}>Delete</button>`}</CodeExample>
        </div>
      </section>
      <section className="docs-section" id="ui">
        <div className="section-heading">
          <p className="section-kicker">05 / UI &amp; a11y</p>
          <h2>Headless stack, optional native-modal UI.</h2>
        </div>
        <div className="docs-grid">
          <CodeExample>{`import { Dialog } from 'react-dialog-flow/ui';
import 'react-dialog-flow/ui/style.css';

<Dialog closeOnBackdrop>
  <Dialog.Header>
    <Dialog.Title>Delete project?</Dialog.Title>
  </Dialog.Header>
  <Dialog.Description>This cannot be undone.</Dialog.Description>
</Dialog>

.danger-dialog {
  --rdf-dialog-panel-background: #111827;
  --rdf-dialog-panel-color: #f9fafb;
  --rdf-dialog-close-icon-size: 1.5rem;
}`}</CodeExample>
          <div>
            <p>
              The optional UI primitive uses native <code>&lt;dialog&gt;</code>{" "}
              modal behavior, a backdrop, scroll lock, focus restoration, and
              enter/exit transitions. Minimal base styles are injected
              automatically when <code>Dialog</code> renders.
            </p>
            <p>
              Import <code>react-dialog-flow/ui/style.css</code> only when you
              want the bundled theme. <code>Dialog.Title</code> supplies the
              accessible name, and <code>Dialog.Description</code> adds optional
              supporting text.
            </p>
            <p className="muted">
              Prefer CSS custom properties for common visual changes. Slot
              classes such as <code>.rdf-dialog__close-icon</code> remain
              available when you need selector-level overrides.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
