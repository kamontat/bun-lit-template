---
name: repo-scripts
description: Use when adding or changing a package script, adding a file under scripts/, running the dev server, or fixing a `bun run check` (tsc or Biome) failure. Covers where a script lives, what each check reads, and how TypeScript and Biome strictness interact.
---

# Scripts and checks

## Where a package script lives

A script that is just a command is that command in `package.json` — `bun-server dev`,
`tsc --noEmit`, `biome check`, `bun test`. `bun run` puts `node_modules/.bin` on `PATH`, so
the bare binary name resolves; don't write `bunx` inside a script, and don't wrap a single
command in a file under `scripts/`. Arguments are forwarded by `bun run` itself, which is
what keeps `bun run test -t "renders"` and `bun run dev --port 4000` working.

`check` is the one composite: `bun run check:type && bun run check:biome`, so a type error
stops before Biome runs. `format` is `biome check --unsafe --write` — read the diff after,
since unsafe fixes can change behaviour.

A script that is a *program* (it fetches, generates or migrates something) is a file under
`scripts/`, run with `bun scripts/<name>.ts` from a package script. Widen `tsconfig.json`'s
`include` when adding the first one (see below), or it is never typechecked.

## What `check:type` reads

`tsconfig.json` extends `@kcconfigs/tsconfig/bun`, whose `include` is `package.json` and
`src/**/*.ts` only, with `rootDir` at `src/`. So **`tests/` is not typechecked** — a type
error in a test passes `bun run check` and only shows in the editor. To cover it, set in
`tsconfig.json`:

```jsonc
"include": ["package.json", "src/**/*.ts", "tests/**/*.ts"],
"compilerOptions": { "rootDir": "." /* … */ }
```

`experimentalDecorators: true` and `useDefineForClassFields: false` carry a FIXME linking
oven-sh/bun#43097. Lit's decorators need both under Bun; keep them until the issue closes
(see the `ui-components` skill for what it means for components).

## The two checks are stricter together

The preset turns on `noUncheckedIndexedAccess`, so every index and regex capture arrives as
`T | undefined`. Narrow it with a destructuring default (`const [, href = ""] = match`),
`??`, or a `const` plus a guard — not with `!`, which Biome warns on outside test files
(`**/*.test.*` turn `noNonNullAssertion` off).

`noPropertyAccessFromIndexSignature` is on too: a property from an index signature
(`element.dataset.theme`, `process.env.FOO`) cannot be reached with a dot, so use the
subscript (`dataset["theme"]`) or `getAttribute`. Biome's `useLiteralKeys` is turned off
in the shared preset for exactly this reason.

`exactOptionalPropertyTypes` is on: `{ name?: string }` does not accept
`{ name: undefined }`. Omit the key or widen the type to `string | undefined`.

`noImplicitOverride` is on: every overridden member needs `override` — `static styles`,
`render`, lifecycle methods, and any reactive property whose name collides with a DOM
member.

`verbatimModuleSyntax` is on: a type-only import must be `import type`.

No import carries a `.ts` extension. The `#components/*`, `#lib/*` and `#styles/*`
aliases supply it from `package.json`'s `imports` field, and relative imports resolve
without one.

## Biome

`check:biome` reports without touching anything; `format` applies fixes including unsafe
ones. Formatting comes from `@kcconfigs/biome` (tabs, double quotes, line width 120) via
`biome.json`, which also skips `.claude/`. Import order is enforced by the
organize-imports assist: type imports, blank line, `bun:`/`node:` built-ins and packages,
blank line, aliases and relative paths.

## Dev server

`bun run dev` serves on <http://127.0.0.1:3000> with hot reload; `bun run preview` serves
the built `dist/` on <http://127.0.0.1:4000> without bundling — build first. Both take
`--port` and `--hostname`, and move to the next free port when theirs is busy (up to 10
tries; `--no-next-port` fails instead), so read the logged URL rather than assuming the
default. `DEBUG=true` logs the resolved routes and static files.

The two answer different URLs. `dev` lets every route answer its sub-paths, so
`src/routes/index.html` answers *any* unknown path with a 200. `preview` resolves `/x` to
`x`, `x/index.html` or `x.html` and 404s anything else, which is what Cloudflare does too.
A broken link that works in `dev` shows up in `preview` — see the `adding-a-page` skill.
