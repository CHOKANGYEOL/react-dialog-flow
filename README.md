# react-dialog-flow

A typed React dialog stack for component-driven flows, nested dialogs, and
result-bearing async work.

Docs and live playground: https://dialog-flow.kangyeol.com

## Install

```bash
pnpm add react-dialog-flow@beta
```

```bash
npm install react-dialog-flow@beta
```

```bash
yarn add react-dialog-flow@beta
```

## Quick start

Render one provider near the root of the application. Components opened through
the stack receive their domain props normally; dialog entry controls come from
`useDialogInstance`.

```tsx
import { DialogProvider, useDialog, useDialogInstance } from 'react-dialog-flow';

function ConfirmDialog({ title }: { title: string }) {
  const { close } = useDialogInstance();

  return <section role="dialog">
    <h2>{title}</h2>
    <button onClick={() => close('header')}>Cancel</button>
  </section>;
}

function Page() {
  const { open } = useDialog();
  return <button onClick={() => open(ConfirmDialog, { title: 'Delete?' })}>Delete</button>;
}

export function App() {
  return <DialogProvider><Page /></DialogProvider>;
}
```

`DialogProvider` creates a portal by default. Set `withPortal={false}` and
render `DialogRenderer` manually when the application needs to control its
placement.

## Async results

Use `openAsync` when the caller only needs a value. A normal dismissal resolves
to `false` by default, or to the value returned by `onDismiss`.

```tsx
function ConfirmDialog() {
  const { complete } = useDialogInstance<boolean>();
  return <button onClick={() => complete(true)}>Confirm</button>;
}

function DeleteButton() {
  const { openAsync } = useDialog();

  const remove = async () => {
    const confirmed = await openAsync<boolean>(ConfirmDialog, {
      onDismiss: () => false,
    });
    if (confirmed) await deleteProject();
  };

  return <button onClick={() => void remove()}>Delete project</button>;
}
```

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

  return <Dialog closeOnBackdrop>
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

```css
.danger-dialog {
  --rdf-dialog-panel-background: #111827;
  --rdf-dialog-panel-color: #f9fafb;
  --rdf-dialog-panel-radius: 1.25rem;
  --rdf-dialog-close-icon-size: 1.5rem;
}

dialog.rdf-dialog .rdf-dialog__close-icon {
  width: 2rem;
  height: 2rem;
}
```

## Documentation playground

The live documentation and playground are available at
https://dialog-flow.kangyeol.com. The local Vite docs app exercises stacking,
`closeTop`, `closeAll`, Escape handling, async results, and the UI primitive.

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
