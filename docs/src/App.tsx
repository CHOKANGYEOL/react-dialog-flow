import { Docs } from "./components/Docs";
import { Playground } from "./components/Playground";

export function App() {
  return (
    <main>
      <header className="hero">
        <div className="hero-brand">
          <img
            alt=""
            aria-hidden="true"
            className="hero-logo"
            src="/logo-mark.svg"
          />
          <p className="eyebrow">react-dialog-flow</p>
        </div>
        <div className="hero-layout">
          <div>
            <h1>Dialogs are flows, not just booleans.</h1>
            <p className="intro">
              Open React dialogs from anywhere, await typed results, and keep
              stacked flows out of your page state.
            </p>
          </div>
          <img
            alt="Stacked dialog panels connected by a flowing async path"
            className="hero-art"
            src="/logo-mark.svg"
          />
        </div>
        <pre className="hero-example" aria-label="Async dialog result example">
          <code>{`const user = await openAsync<User | null>(UserSearchDialog, {
  onDismiss: () => null,
});

if (!user) return;

const confirmed = await openAsync<boolean>(ConfirmDialog, {
  title: \`Add \${user.name}?\`,
  onDismiss: () => false,
});

if (confirmed) await addUser(user.id);`}</code>
        </pre>
        <nav aria-label="Documentation" className="docs-nav">
          <a href="#install">Install</a>
          <a href="#provider">Provider</a>
          <a href="#stack">Stack</a>
          <a href="#async">Async results</a>
          <a href="#ui">UI &amp; a11y</a>
          <a href="#playground">Playground</a>
        </nav>
      </header>
      <Docs />
      <Playground />
    </main>
  );
}
