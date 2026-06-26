import { useState } from "react";

const installCommands = {
  npm: "npm install react-dialog-flow",
  pnpm: "pnpm add react-dialog-flow",
  yarn: "yarn add react-dialog-flow",
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
            <p className="muted">
              The package is on the default npm dist-tag. Async result timing,
              dismiss reasons, stacked dialogs, UI defaults, docs, and
              migration notes are covered for routine production upgrades.
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
              <code>openAsync</code> lets the caller compose dialogs like
              ordinary async functions. Return a typed value from one dialog,
              branch on it, then open the next dialog without spreading
              transient modal state through the page.
            </p>
            <p>
              A dismiss resolves to <code>false</code> by default, or to the
              value returned by <code>onDismiss</code>. Use{" "}
              <code>openAsyncResult</code> when the dismissal reason matters.
            </p>
          </div>
          <CodeExample>{`const user = await openAsync<User | null>(UserSearchDialog, {
  onDismiss: () => null,
});

if (!user) return;

const confirmed = await openAsync<boolean>(ConfirmDialog, {
  title: \`Add \${user.name}?\`,
  onDismiss: () => false,
});

if (confirmed) await addUser(user.id);

// Promises resolve after the dialog exit lifecycle completes.`}</CodeExample>
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

<Dialog closeOnBackdrop closeOnEscape={false}>
  <Dialog.Header>
    <Dialog.Title>Delete project?</Dialog.Title>
  </Dialog.Header>
  <Dialog.Description>This cannot be undone.</Dialog.Description>
</Dialog>

<Dialog shouldClose={(reason) => reason !== 'backdrop' || !formDirty}>
  ...
</Dialog>

.danger-dialog {
  --rdf-dialog-panel-background: #111827;
  --rdf-dialog-panel-color: #f9fafb;
  --rdf-dialog-close-button-size: 2.25rem;
  --rdf-dialog-close-button-radius: 999px;
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
            <p className="muted">
              Escape closes dialogs by default. Use{" "}
              <code>closeOnEscape={`{false}`}</code> for flows that require an
              explicit action.
            </p>
            <p className="muted">
              Use <code>shouldClose(reason)</code> for sync or async dismissal
              guards. Additional requests are ignored while an async guard is
              pending, and <code>complete(value)</code> bypasses the guard.
            </p>
          </div>
        </div>
      </section>
      <section className="docs-section" id="integrations">
        <div className="section-heading">
          <p className="section-kicker">06 / UI integrations</p>
          <h2>Keep your design system, add dialog orchestration.</h2>
        </div>
        <div className="docs-grid">
          <div>
            <p>
              <code>react-dialog-flow</code> is an orchestration layer. It does
              not need to replace Radix, shadcn/ui, or an internal dialog
              component. Render your existing dialog inside a stack entry and
              call <code>complete(value)</code> when it returns a result.
            </p>
            <p className="muted">
              The only requirement is that the dialog component is controlled
              by the entry lifecycle and calls <code>close(reason)</code> when
              it is dismissed.
            </p>
          </div>
          <CodeExample>{`import * as RadixDialog from '@radix-ui/react-dialog';
import { useDialogInstance } from 'react-dialog-flow';

function DeleteProjectDialog({ projectName }: { projectName: string }) {
  const { close, complete } = useDialogInstance<boolean>();

  return (
    <RadixDialog.Root
      open
      onOpenChange={(open) => !open && close('programmatic')}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay />
        <RadixDialog.Content>
          <RadixDialog.Title>Delete {projectName}?</RadixDialog.Title>
          <RadixDialog.Description>This cannot be undone.</RadixDialog.Description>
          <button onClick={() => close('programmatic')}>Cancel</button>
          <button onClick={() => complete(true)}>Delete</button>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}`}</CodeExample>
        </div>
        <div className="docs-grid">
          <CodeExample>{`import { useDialogInstance } from 'react-dialog-flow';

function ConfirmDialog({ title }: { title: string }) {
  const { close, complete } = useDialogInstance<boolean>();

  return (
    <Dialog open onOpenChange={(open) => !open && close('programmatic')}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => close('programmatic')}>
            Cancel
          </Button>
          <Button onClick={() => complete(true)}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}`}</CodeExample>
          <div>
            <p>
              shadcn/ui follows the same pattern because its dialog components
              are controlled. Keep the visual system and let{" "}
              <code>react-dialog-flow</code> coordinate stack order, async
              results, dismissal reasons, and multi-step flows.
            </p>
          </div>
        </div>
      </section>
      <section className="docs-section" id="examples">
        <div className="section-heading">
          <p className="section-kicker">07 / Practical flows</p>
          <h2>Compose production dialog paths as ordinary async code.</h2>
        </div>
        <div className="docs-grid">
          <div>
            <p>
              The useful part is not a single confirm modal. It is the ability
              to select domain objects, ask follow-up questions, guard dirty
              forms, and abort a stacked flow without spreading temporary modal
              booleans through the page.
            </p>
            <p className="muted">
              These examples work with the optional UI primitive or with your
              own dialog components.
            </p>
          </div>
          <CodeExample>{`const confirmed = await openAsync<boolean>(ConfirmDialog, {
  title: 'Delete project?',
  description: 'This cannot be undone.',
  onDismiss: () => false,
});

if (confirmed) await deleteProject(project.id);

const user = await openAsync<User | null>(UserSearchDialog, {
  onDismiss: () => null,
});

if (!user) return;

const invited = await openAsync<boolean>(ConfirmDialog, {
  title: \`Invite \${user.name}?\`,
  onDismiss: () => false,
});

if (invited) await inviteUser(user.id);`}</CodeExample>
        </div>
        <div className="docs-grid">
          <CodeExample>{`<Dialog
  closeOnBackdrop
  shouldClose={async () => {
    if (!formDirty) return true;

    return await openAsync<boolean>(ConfirmDialog, {
      title: 'Discard changes?',
      description: 'Unsaved edits will be lost.',
      onDismiss: () => false,
    });
  }}
>
  ...
</Dialog>`}</CodeExample>
          <CodeExample>{`const { closeAll, openAsync } = useDialog();

const confirmed = await openAsync<boolean>(ConfirmDialog, {
  title: 'Start import?',
  onDismiss: () => false,
});

if (!confirmed) return;

const overwrite = await openAsync<boolean>(ConfirmDialog, {
  title: 'Overwrite existing records?',
  onDismiss: () => false,
});

if (!overwrite) {
  closeAll();
  return;
}

await runImport();`}</CodeExample>
        </div>
      </section>
    </>
  );
}
