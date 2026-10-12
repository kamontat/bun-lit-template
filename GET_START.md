# Get started with an AI agent

Copy the prompt below into an AI coding agent (Claude Code, Codex, Cursor, …)
running in an empty working directory. The agent creates a new GitHub
repository from this template, customizes it, connects it to Cloudflare
Workers, and pushes so GitHub Actions deploys the hello-world page.

Before you start, have ready:

- A GitHub account, with the [GitHub CLI](https://cli.github.com/) installed
- A Cloudflare account (free plan is enough)
- [mise](https://mise.jdx.dev/) or [Bun](https://bun.com/) installed

The agent asks you for a few values and pauses twice for steps only you can
do: logging in to Cloudflare in the browser and pasting the API token into a
secret prompt. The token never passes through the agent.

## Prompt

````markdown
You are setting up a new web project from the template repository
`kamontat/bun-lit-template` (Lit + Bun, deployed to Cloudflare Workers static
assets through GitHub Actions). Work through the phases below in order. Stop
and ask me whenever a step needs my input or fails in a way you cannot fix.
Do not skip verification steps, and report real command output when
something fails.

The template ships Claude Code skills in `.claude/skills/`. Two of them,
`shipping-a-change` and `landing-a-change`, require a worktree and pull request
for every change. They apply to changes made after this setup. This initial setup
commits directly to `main`, because there is no deployed site to preview yet.

## Phase 0: Gather inputs

Ask me for these values in one message, and suggest defaults where you can:

1. PROJECT_NAME: lowercase letters, digits, and dashes (for example
   `my-site`). Used as the GitHub repository name, the package name, and the
   Cloudflare Worker name.
2. GITHUB_OWNER: my GitHub user or organization (default: output of
   `gh api user --jq .login`).
3. VISIBILITY: `public` or `private` (default: `private`).
4. PAGE_TITLE: the HTML `<title>` (default: PROJECT_NAME).
5. CUSTOM_DOMAIN: optional hostname such as `app.example.com`. Only valid if
   the parent zone is already on my Cloudflare account. Leave empty to use
   the free `workers.dev` URL.

## Phase 1: Check prerequisites

Run and confirm each of these. If one is missing, tell me how to install it
and wait.

- `gh --version` and `gh auth status` (must be logged in with `repo` and
  `workflow` scopes; if not, ask me to run `gh auth login` or
  `gh auth refresh -s workflow`)
- `git --version`
- `mise --version` (preferred) or `bun --version`

## Phase 2: Create the repository from the template

1. Create and clone the repository:

   ```bash
   gh repo create GITHUB_OWNER/PROJECT_NAME --template kamontat/bun-lit-template --VISIBILITY --clone
   cd PROJECT_NAME
   ```

   If `--clone` races the template copy and the clone is empty, wait a few
   seconds and run `git pull origin main`.
2. Install the pinned toolchain with `mise install` (skip if only Bun is
   available). Do not run `bun install` yet: it fails until Phase 3 replaces
   `<TODO>`, which is not a valid package name.
3. Delete `GET_START.md` from the new repository; it only applies to the
   template.

## Phase 3: Replace template placeholders

List every placeholder with:

```bash
grep -rn "<TODO>" --exclude-dir=node_modules .
```

Replace them as follows:

| File | Change |
| ---- | ------ |
| `package.json` | `"name": "<TODO>"` to `"name": "PROJECT_NAME"` |
| `bun.lock` | `"name": "<TODO>"` to `"name": "PROJECT_NAME"` |
| `wrangler.jsonc` | `"name": "<TODO>"` to `"name": "PROJECT_NAME"` |
| `src/routes/index.html` | `<title><TODO></title>` to `<title>PAGE_TITLE</title>` |
| `.github/workflows/deploy-preview.yml` | `environment.url`: fix in Phase 4 once the workers.dev subdomain is known |
| `.github/workflows/deploy-production.yml` | `environment.url`: fix in Phase 4 |

The workflow URLs also contain the template author's domains
(`kcinth.workers.dev` and `kc.in.th`). Both must be replaced; never leave
them in my repository.

If CUSTOM_DOMAIN is set, add this top-level key to `wrangler.jsonc` so
Wrangler attaches the domain on deploy:

```jsonc
"routes": [{ "pattern": "CUSTOM_DOMAIN", "custom_domain": true }]
```

Keep the sample `hello-world` component and its test; it is the page we are
deploying.

Then verify locally. All four must pass before going further:

```bash
bun install
bun run check
bun run test
bun run build
```

Confirm `grep -rn "<TODO>" --exclude-dir=node_modules .` prints nothing
except the two workflow URLs still pending Phase 4.

## Phase 4: Set up Cloudflare

1. Log in to Wrangler. This opens a browser, so ask me to run it myself:

   ```
   ! bunx wrangler login
   ```

   Then run `bunx wrangler whoami` and read the account ID from the output.
   If I have several accounts, ask which one to use. Call it ACCOUNT_ID.
2. Ask me to create an API token, because Wrangler cannot create one:
   - Open <https://dash.cloudflare.com/profile/api-tokens>
   - **Create Token**, use the **Edit Cloudflare Workers** template
   - Account Resources: the ACCOUNT_ID account. Zone Resources: all zones,
     or the CUSTOM_DOMAIN zone if one is set
   - Create it and keep the page open for the next step
3. Store both secrets in the GitHub repository. Set the account ID yourself:

   ```bash
   gh secret set CLOUDFLARE_ACCOUNT_ID --repo GITHUB_OWNER/PROJECT_NAME --body "ACCOUNT_ID"
   ```

   For the token, ask me to run this so it is typed into a hidden prompt and
   never appears in your context or logs:

   ```
   ! gh secret set CLOUDFLARE_API_TOKEN --repo GITHUB_OWNER/PROJECT_NAME
   ```

   Never ask me to paste the token into the chat, and never write it to a
   file. Confirm both secrets exist with `gh secret list --repo
   GITHUB_OWNER/PROJECT_NAME`.
4. Find my workers.dev subdomain (call it SUBDOMAIN, the part before
   `.workers.dev`). Ask me to open **Workers & Pages** in the Cloudflare
   dashboard and read it from the overview page (accounts that never opened
   that page must do so once to register a subdomain). If I prefer, I can
   tell you the subdomain directly.
5. Fix the workflow URLs:
   - `deploy-preview.yml`:
     `url: https://pr-${{ github.event.number }}-PROJECT_NAME.SUBDOMAIN.workers.dev`
   - `deploy-production.yml`: `url: https://CUSTOM_DOMAIN` if set, otherwise
     `url: https://PROJECT_NAME.SUBDOMAIN.workers.dev`

   Confirm `grep -rn "<TODO>\|kcinth\|kc\.in\.th" --exclude-dir=node_modules .`
   prints nothing.
6. Create the GitHub environments the deploy workflows reference:

   ```bash
   gh api -X PUT repos/GITHUB_OWNER/PROJECT_NAME/environments/preview
   gh api -X PUT repos/GITHUB_OWNER/PROJECT_NAME/environments/production
   ```
7. Match the repository settings the bundled skills expect (merge commits
   allowed, head branches deleted after merge):

   ```bash
   gh repo edit GITHUB_OWNER/PROJECT_NAME --enable-merge-commit --delete-branch-on-merge
   ```

## Phase 5: Commit, push, and deploy

1. Commit on `main` with a Conventional Commits message, for example
   `chore: initialize project from bun-lit-template`, and push:

   ```bash
   git add -A
   git commit -m "chore: initialize project from bun-lit-template"
   git push origin main
   ```

   The push triggers two workflows: `Main` (check, build, test) and
   `Deploy Production`. A failed run from the template's initial commit
   (before the placeholders were replaced) is expected; ignore it.
2. Watch the runs until they finish:

   ```bash
   gh run list --repo GITHUB_OWNER/PROJECT_NAME --limit 5
   gh run watch <run-id> --repo GITHUB_OWNER/PROJECT_NAME --exit-status
   ```

   If `Deploy Production` fails, read the log with
   `gh run view <run-id> --log-failed`, fix the cause (usual suspects: wrong
   ACCOUNT_ID, token missing a permission, Worker name mismatch), push again,
   and re-watch. Do not retry blindly.
3. Verify the live site. The page is client-rendered, so check that the HTML
   shell is served with the `<hello-world>` element:

   ```bash
   curl -fsS https://PRODUCTION_URL | grep -i "<hello-world>"
   ```

   A new Worker or custom domain can take a minute to resolve; retry a few
   times before treating it as a failure.

## Phase 6: Report

Finish with a short summary:

- Repository URL
- Production URL (and the preview URL pattern for pull requests)
- What I still need to do by hand, if anything (for example, a custom domain
  waiting on DNS)
- Next steps: open a pull request to see a preview deploy, then replace the
  `hello-world` component with real content (see the README)
````
