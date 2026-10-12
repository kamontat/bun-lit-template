# bun-lit-template

A starter template for static websites built with [Lit](https://lit.dev/) web
components, bundled by [Bun](https://bun.com/) through
[`@kctools/bun-server`](https://www.npmjs.com/package/@kctools/bun-server), and
deployed to [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/)
as static assets.

- [Stack](#stack)
- [Getting started](#getting-started)
- [Customize the template](#customize-the-template)
- [Project layout](#project-layout)
- [Scripts](#scripts)
- [Writing components](#writing-components)
- [Adding pages](#adding-pages)
- [Testing](#testing)
- [Deployment](#deployment)
- [Agent skills](#agent-skills)

## Stack

| Concern         | Tool                                                                 |
| --------------- | -------------------------------------------------------------------- |
| Runtime         | [Bun](https://bun.com/) (pinned via [mise](https://mise.jdx.dev/))   |
| UI              | [Lit](https://lit.dev/) web components                               |
| Dev / build     | [`@kctools/bun-server`](https://www.npmjs.com/package/@kctools/bun-server) |
| CSS reset       | [`@kcstyles/reset.css`](https://www.npmjs.com/package/@kcstyles/reset.css) |
| Lint / format   | [Biome](https://biomejs.dev/) with `@kcconfigs/biome`                |
| Type checking   | TypeScript with `@kcconfigs/tsconfig`                                |
| Tests           | `bun test` with [happy-dom](https://github.com/capricorn86/happy-dom) |
| Hosting         | Cloudflare Workers static assets via [Wrangler](https://developers.cloudflare.com/workers/wrangler/) |
| CI / CD         | GitHub Actions                                                       |

## Getting started

> [!TIP]
> Prefer to let an AI agent do it? Copy the prompt in
> [GET_START.md](GET_START.md); it creates the repository, sets up
> Cloudflare, and deploys the hello-world page.

1. Create a new repository from this template (**Use this template** on GitHub),
   or clone it directly:

   ```bash
   git clone <this-repo-url> my-app
   cd my-app
   ```

2. Install the pinned toolchain (Bun) with mise, or install Bun yourself
   (see `mise.toml` for the expected version):

   ```bash
   mise install
   ```

3. Install dependencies:

   ```bash
   bun install
   ```

4. Start the development server with hot reloading on
   <http://127.0.0.1:3000>:

   ```bash
   bun run dev
   ```

## Customize the template

After creating a project from this template, replace every `<TODO>`
placeholder (`grep -rn "<TODO>" --exclude-dir=node_modules .`):

| File                                      | Placeholder                                                         |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `package.json`                            | `name`, the package name                                            |
| `bun.lock`                                | `name`, kept in sync with `package.json` (or rerun `bun install`)   |
| `wrangler.jsonc`                          | `name`, the Cloudflare Worker name                                  |
| `src/routes/index.html`                   | `<title>`, the page title                                           |
| `.github/workflows/deploy-preview.yml`    | `environment.url`, `https://pr-<number>-<TODO>.kcinth.workers.dev`  |
| `.github/workflows/deploy-production.yml` | `environment.url`, `https://<TODO>.kc.in.th`                        |

> [!IMPORTANT]
> `<TODO>` is not a valid package or Worker name, so `bun install` and
> `wrangler deploy` fail until it is replaced. Use the same value for the
> Worker name in `wrangler.jsonc` and in the preview URL.

The workflow URLs also contain the original author's domains. Replace
`kcinth.workers.dev` with your own `workers.dev` subdomain and `kc.in.th` with
your custom domain, or point the production URL at
`https://<worker-name>.<subdomain>.workers.dev` if you have no custom domain.

Then delete or replace the sample `hello-world` component and its test.

## Project layout

```text
.
├── src/
│   ├── routes/          # HTML entrypoints (index.html is the app shell)
│   ├── components/      # Lit components        (import as #components/*)
│   ├── lib/             # shared TypeScript     (import as #lib/*)
│   ├── styles/          # global CSS and shared Lit styles (#styles/*)
│   └── types/           # global type declarations (HTMLElementTagNameMap)
├── tests/
│   ├── setup-happydom.ts  # registers happy-dom globals for bun test
│   └── components/        # component tests
├── .claude/skills/      # Claude Code skills for working in this repo
├── .github/workflows/   # CI, preview, and production deploy pipelines
├── biome.json           # lint / format config
├── bunfig.toml          # bun install + bun test config
├── mise.toml            # pinned tool versions
├── tsconfig.json        # TypeScript config
└── wrangler.jsonc       # Cloudflare Workers config
```

### Import aliases

`package.json` defines [subpath imports](https://nodejs.org/api/packages.html#subpath-imports)
so you never need long relative paths:

```ts
import "#components/hello-world"; // ./src/components/hello-world.ts
import { something } from "#lib/utils"; // ./src/lib/utils.ts
import { sharedStyles } from "#styles/shared"; // ./src/styles/shared.ts
```

## Scripts

| Command             | Description                                             |
| ------------------- | ------------------------------------------------------- |
| `bun run dev`       | Start the dev server with hot reloading on port 3000    |
| `bun run build`     | Build for production into `dist/`                       |
| `bun run preview`   | Serve the production build from `dist/` on port 4000    |
| `bun run test`      | Run tests with `bun test`                               |
| `bun run typecheck` | Type check with `tsc --noEmit`                          |
| `bun run check`     | Lint and format check with Biome                        |
| `bun run format`    | Apply Biome fixes and formatting (including unsafe ones) |

`dev` and `preview` accept `--port` / `--hostname`, for example
`bun run dev --port 3001`. See the
[`@kctools/bun-server` docs](https://www.npmjs.com/package/@kctools/bun-server)
for all options, including `--statics` for files no HTML document references
(favicons, `robots.txt`, images).

## Writing components

Components live in `src/components/` and use Lit decorators:

```ts
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("my-greeting")
export class MyGreeting extends LitElement {
	static override styles = css`
		:host {
			display: block;
		}
	`;

	@property()
	name = "World";

	override render() {
		return html`<p>Hello, ${this.name}!</p>`;
	}
}
```

Register the tag in `src/types/global.d.ts` so `document.createElement` and
`querySelector` return the correct type:

```ts
import type { MyGreeting } from "#components/my-greeting";

declare global {
	interface HTMLElementTagNameMap {
		"my-greeting": MyGreeting;
	}
}
```

Then load it from a page:

```html
<script type="module" src="../components/my-greeting.ts"></script>
```

> [!NOTE]
> `tsconfig.json` enables `experimentalDecorators` and disables
> `useDefineForClassFields`, which Lit's decorators require under Bun
> ([oven-sh/bun#43097](https://github.com/oven-sh/bun/issues/43097)). Keep both
> settings until that issue is resolved.

## Adding pages

`src/routes/index.html` is the entrypoint. It links global CSS and component
scripts with relative paths, and Bun bundles everything it references.

Every `.html` file under `src/routes` becomes its own route, with no script
change needed:

```text
src/routes/index.html        ->  /
src/routes/about.html        ->  /about
src/routes/blog/post.html    ->  /blog/post
```

## Testing

Tests run with `bun test`. `bunfig.toml` preloads `tests/setup-happydom.ts`,
which registers a happy-dom `window` and `document`, so components render
without a browser:

```ts
import { afterEach, expect, test } from "bun:test";
import "#components/hello-world";

afterEach(() => {
	document.body.innerHTML = "";
});

test("renders custom name", async () => {
	const el = document.createElement("hello-world");
	el.name = "Bun";
	document.body.append(el);
	await el.updateComplete;
	expect(el.shadowRoot?.querySelector("h1")?.textContent).toBe("Hello, Bun!");
});
```

## Deployment

The site deploys to Cloudflare Workers as static assets. `wrangler.jsonc` runs
`bun run build` and uploads `dist/`.

### Manual deploy

```bash
bunx wrangler login
bunx wrangler deploy
```

### GitHub Actions

| Workflow                  | Trigger            | Does                                                                  |
| ------------------------- | ------------------ | --------------------------------------------------------------------- |
| `main.yml`                | every push         | `check`, `test`, `build`                                              |
| `deploy-preview.yml`      | pull requests      | uploads a preview version aliased `pr-<number>`                       |
| `deploy-production.yml`   | push to `main`     | deploys to production                                                 |

Set these repository secrets for the deploy workflows:

| Secret                  | Value                                                                 |
| ----------------------- | --------------------------------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID` | your Cloudflare account ID                                            |
| `CLOUDFLARE_API_TOKEN`  | an API token with the **Edit Cloudflare Workers** permission          |

Also create `preview` and `production` environments in the repository settings
(**Settings → Environments**). Each workflow's `environment.url` is only the
link GitHub shows on the deployment, so it must be updated by hand to match
your Worker (see [Customize the template](#customize-the-template)).

## Agent skills

`.claude/skills/` holds [Claude Code skills](https://docs.claude.com/en/docs/claude-code/skills)
that teach an agent this repository's workflow and conventions:

| Skill                | Covers                                                                      |
| -------------------- | --------------------------------------------------------------------------- |
| `shipping-a-change`  | every change in a worktree, test first, ending in a PR with a preview URL   |
| `landing-a-change`   | after approval: changelog entry, merge commit, worktree cleanup             |
| `changelog`          | the `CHANGELOG.md` entry format and which section a change belongs in        |
| `adding-a-page`      | adding a route under `src/routes/`, what each page must link                 |
| `ui-components`      | Lit component conventions, shadow DOM styling, events, happy-dom test limits |
| `build-and-deploy`   | the build, `--statics`, `wrangler.jsonc`, workflows, pinned action SHAs      |
| `repo-scripts`       | package scripts, what `check` reads, TypeScript and Biome strictness         |

`shipping-a-change` and `landing-a-change` assume merge commits are allowed and
head branches are deleted after merge (`gh repo edit --enable-merge-commit
--delete-branch-on-merge`).
