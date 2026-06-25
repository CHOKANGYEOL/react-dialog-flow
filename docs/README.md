# Documentation playground

This Vite app is the local documentation site for `react-dialog-flow`. It uses
the package itself to demonstrate component stacks, nested dialogs, async
results, `closeTop`, `closeAll`, Escape dismissal, and the optional UI
primitive.

Production docs: https://dialog-flow.kangyeol.com

Run it from the repository root:

```bash
pnpm docs
```

The command builds the library first, then starts Vite. To create a production
build of the library and this documentation app without starting a server:

```bash
pnpm docs:build
```
