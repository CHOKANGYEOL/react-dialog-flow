<p align="center">
  <img src="https://dialog-flow.kangyeol.com/logo-mark.svg" alt="react-dialog-flow logo" width="96" height="96" />
</p>

<h1 align="center">react-dialog-flow</h1>

<p align="center">
  Promise-based dialog orchestration for React.
</p>

Open dialogs like functions, await typed results, and compose nested modal flows
without scattered boolean state.

Docs and live playground: https://dialog-flow.kangyeol.com

## Install

```bash
pnpm add react-dialog-flow
```

```bash
npm install react-dialog-flow
```

```bash
yarn add react-dialog-flow
```

## Stability

The package is published on the default npm dist-tag. Async result semantics,
stacked dismissal, UI lifecycle defaults, and migration notes are covered by the
test suite and documentation. Breaking changes will wait for a new major
version.

## Quick start

Render one provider near the root of the application, then open dialogs as
component-driven flows. Use `openAsync` when the caller wants to await a typed
result instead of wiring boolean state by hand.

```tsx
import { DialogProvider, useDialog, useDialogInstance } from 'react-dialog-flow';

type User = { id: string; name: string };

function UserSearchDialog() {
  const { close, complete } = useDialogInstance<User | null>();

  return <section role="dialog">
    <h2>Find a user</h2>
    <button onClick={() => complete({ id: 'u_123', name: 'Jiyoon' })}>
      Select Jiyoon
    </button>
    <button onClick={() => close()}>Cancel</button>
  </section>;
}

function ConfirmDialog({ title }: { title: string }) {
  const { close, complete } = useDialogInstance<boolean>();

  return <section role="dialog">
    <h2>{title}</h2>
    <button onClick={() => complete(true)}>Confirm</button>
    <button onClick={() => close('header')}>Cancel</button>
  </section>;
}

function Page() {
  const { openAsync } = useDialog();

  const inviteUser = async () => {
    const user = await openAsync<User | null>(UserSearchDialog, {
      onDismiss: () => null,
    });

    if (!user) return;

    const confirmed = await openAsync<boolean>(ConfirmDialog, {
      title: `Add ${user.name}?`,
      onDismiss: () => false,
    });

    if (confirmed) await addUser(user.id);
  };

  return <button onClick={() => void inviteUser()}>Add user</button>;
}

export function App() {
  return <DialogProvider><Page /></DialogProvider>;
}
```

`DialogProvider` creates a portal by default. Set `withPortal={false}` and
render `DialogRenderer` manually when the application needs to control its
placement.

## Async results

Use `openAsync` when the caller only needs a value. You can sequence dialogs as
ordinary async work while each dialog owns its own UI and local state.

```tsx
const user = await openAsync<User | null>(UserSearchDialog, {
  onDismiss: () => null,
});

if (!user) return;

const confirmed = await openAsync<boolean>(ConfirmDialog, {
  title: `Add ${user.name}?`,
  onDismiss: () => false,
});

if (confirmed) await addUser(user.id);
```

A normal dismissal resolves to `false` by default, or to the value returned by
`onDismiss`.

Use `openAsyncResult` when the dismissal reason matters.

```tsx
const { openAsyncResult } = useDialog();
const result = await openAsyncResult<boolean>(ConfirmDialog);

if (result.status === 'completed') {
  // result.value
} else {
  // result.reason: esc, backdrop, header, or programmatic
}
```

Both APIs resolve after the entry has completed its exit lifecycle.

## Optional UI primitive

The stack is headless. Import the UI primitive for a native modal dialog,
backdrop, scroll lock, focus restoration, and exit-aware transitions. Minimal
base styles are injected automatically so the primitive works without a CSS
import. Add `react-dialog-flow/ui/style.css` only when you want the bundled
default theme.

```tsx
import { Dialog } from 'react-dialog-flow/ui';
import 'react-dialog-flow/ui/style.css';

function ConfirmDialog() {
  const { complete } = useDialogInstance<boolean>();

  return <Dialog closeOnBackdrop closeOnEscape={false}>
    <Dialog.Header>
      <Dialog.Title>Delete project?</Dialog.Title>
    </Dialog.Header>
    <Dialog.Description>This cannot be undone.</Dialog.Description>
    <Dialog.Footer>
      <button onClick={() => complete(true)}>Delete</button>
    </Dialog.Footer>
  </Dialog>;
}
```

`Dialog.Title` supplies the accessible name and `Dialog.Description` is
optional supporting text. Use `initialFocusRef` and `finalFocusRef` when the
default focus placement or restoration is not appropriate. Customize the
optional theme through classes, `backdropProps`, `panel`, `overlay`, and CSS
custom properties.

Escape closes dialogs by default. Set `closeOnEscape={false}` when a flow must
be completed or dismissed explicitly.

Use `shouldClose` when a dismissal needs a guard. It receives the close reason
and may return a boolean or a promise. Returning or resolving `false` keeps the
dialog open. While the promise is pending, additional close requests for the
same dialog are ignored. `complete(value)` does not run `shouldClose`.

```tsx
<Dialog
  closeOnBackdrop
  shouldClose={async (reason) => {
    if (reason !== 'backdrop' || !formDirty) return true;

    return await openAsync<boolean>(ConfirmDialog, {
      title: 'Discard changes?',
      onDismiss: () => false,
    });
  }}
>
  ...
</Dialog>
```

```css
.danger-dialog {
  --rdf-dialog-panel-background: #111827;
  --rdf-dialog-panel-color: #f9fafb;
  --rdf-dialog-panel-radius: 1.25rem;
  --rdf-dialog-header-gap: 0.75rem;
  --rdf-dialog-close-button-size: 2.25rem;
  --rdf-dialog-close-button-radius: 999px;
  --rdf-dialog-close-button-hover-background: rgb(255 255 255 / 10%);
  --rdf-dialog-close-icon-size: 1.5rem;
  --rdf-dialog-close-icon-stroke-width: 1.8;
}

dialog.rdf-dialog .rdf-dialog__close-icon {
  width: 2rem;
  height: 2rem;
}
```

## Documentation playground

The live documentation and playground are available at
https://dialog-flow.kangyeol.com. The local Vite docs app exercises stacking,
`closeTop`, `closeAll`, Escape handling, async results, guarded dismissal, and
the UI primitive. The playground event log keeps the latest 999 entries and can
be reset while testing flows.

```bash
pnpm docs
```

## Development

```bash
pnpm install
pnpm verify
```

`verify` runs typecheck, tests, and the library build. The same command runs
automatically before packing or publishing.

## Project layout

- `src/core`: React-independent stack and type definitions.
- `src/react`: provider, renderer, hooks, and entry lifecycle integration.
- `src/ui`: optional native-dialog UI primitive and styles.
- `tests`: reducer and React lifecycle integration coverage.
- `docs`: documentation site and live playground.
