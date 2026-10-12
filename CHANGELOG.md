# Changelog

What changed in this project and why, newest first.

## 2026-10-12: Agent skills and a green template CI

### Features

- Claude Code skills in `.claude/skills/` teach an agent the repository's workflow and
  conventions: `shipping-a-change` (worktree, test first, pull request with a preview URL),
  `landing-a-change` (changelog, merge commit, cleanup), `changelog`, `adding-a-page`,
  `ui-components`, `build-and-deploy` and `repo-scripts`.

### Improvements

- `@kctools/bun-server` is upgraded to 0.4.0, alongside `@kcstyles/reset.css` 2.0.0,
  `@kcconfigs/biome` 3.0.0, `@kcconfigs/tsconfig` 2.0.0, happy-dom 21 and wrangler 4.149.0.
- `GET_START.md` enables merge commits and head-branch deletion on the new repository,
  which `landing-a-change` relies on.

### Bug fixes

- Production builds ship Lit's production build instead of its development build, about
  half the size and without the dev-mode console warning, because `bun-server build` 0.4.0
  sets `NODE_ENV=production`.
- `bun run check` passes on the template: the page title placeholder is plain `TODO`
  instead of `<TODO>`, which Biome parsed as an unclosed tag.
- The template repository no longer runs its deploy jobs, which failed on every push and
  pull request because it has no Worker of its own.

### Decisions

- The deploy jobs are skipped with `github.event.repository.is_template` rather than a
  hardcoded repository name, so repositories created from the template deploy without
  editing the condition.
- The title placeholder is plain `TODO` rather than an escaped `&lt;TODO&gt;`, so it reads
  the same in source and browser tab; the README and `GET_START.md` call it out because the
  `<TODO>` grep no longer lists it.
