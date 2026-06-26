# Changelog

## 0.2.0 — 2026-06-26

- Add `Dialog` `shouldClose(reason)` for synchronous or asynchronous dismissal
  guards.
- Ignore additional close requests for the same dialog while an asynchronous
  `shouldClose` guard is pending.
- Keep `complete(value)` as an intentional result path that bypasses
  `shouldClose`.
- Add a guarded form example to the documentation playground.
- Improve the playground event log with stable entry keys, a 999-entry limit,
  sticky count header, and reset control.

## 0.1.1 — 2026-06-26

- Fix `Dialog` so `closeOnEscape={false}` also blocks Escape close requests
  routed through `DialogProvider`.
- Add coverage for window-level Escape events against dialogs that disable
  Escape dismissal.

## 0.1.0 — 2026-06-26

- Add integration coverage for async dismissal timing, ensuring `openAsync`
  resolves only after the dialog exit lifecycle completes.
- Add coverage for Escape and backdrop dismissal reasons across
  `openAsyncResult` and `onDismiss`.
- Add stacked dialog coverage to confirm Escape and backdrop dismissal close
  only the top entry while lower entries remain mounted.
- Add UI lifecycle coverage for focus restoration, scroll lock, immediate
  motion, fallback motion completion, backdrop defaults, and provider unmount.
- Align README, docs, and playground examples around promise-based dialog
  orchestration.
- Move installation examples from the `beta` dist-tag to the default npm
  dist-tag.

### Migration notes

- No application code changes are required when upgrading from the beta series.
  This release clarifies and tests existing behavior.
- Install with `react-dialog-flow` instead of `react-dialog-flow@beta`.
- If your app depends on async dialog promises resolving immediately when a
  close is requested, move that work to the dialog action handler or set
  `motionDuration={0}` for dialogs that should resolve without an exit delay.
- In stacked flows, Escape and backdrop dismissal are top-entry operations.
  Use `closeAll()` when the intended behavior is to dismiss every open entry.

## 0.1.0-beta.4 — 2026-06-25

- Expose additional CSS custom properties for dialog styling.
- Improve docs positioning around async dialog flows.
- Add branded logo assets, favicon, and social metadata.
- Keep the header close button aligned when no header children are provided.

## 0.1.0-beta.3 — 2026-06-25

- Add default classes and theme styles for dialog title, description, body, and
  footer slots.
- Inject required base dialog styles automatically when the UI primitive
  renders.
- Split required base styles from the optional bundled theme stylesheet.

## 0.1.0-beta.2 — 2026-06-25

- Add package metadata for the documentation site, repository, and issue
  tracker.
- Add live documentation links and social metadata for the docs app.
- Update install examples to target the beta dist-tag while the package is in
  beta.

## 0.1.0-beta.1 — 2026-06-24

First public beta.

- Component-based dialog stacks with `open`, `closeTop`, and `closeAll`.
- Result-bearing flows through `openAsync`, `openAsyncResult`, and
  `useDialogInstance().complete`.
- Optional native-dialog UI with transitions, focus restoration, accessible
  title and description primitives, and configurable close controls.
- Live documentation playground and React integration coverage for async
  completion, dismissal, animation lifecycle, and ARIA wiring.
