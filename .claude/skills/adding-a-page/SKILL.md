---
name: adding-a-page
description: Use when adding a new HTML page or route under src/routes/, or when a page builds but paints unstyled, never upgrades its custom elements, or 404s after deploy.
---

# Adding a page

## How routes map

`dev` and `build` run `@kctools/bun-server` over `src/routes/`. Every `.html` file below it,
at any depth, is its own route — the path under `src/routes/` without the extension, with
`index.html` answering its own directory. Dotfiles are not matched.

```text
src/routes/index.html          ->  /
src/routes/about.html          ->  /about
src/routes/about/index.html    ->  /about      (same route — fails with `Found duplicated routes: /about`)
src/routes/blog/post.html      ->  /blog/post
```

Nothing else names a page: neither script lists entrypoints, so a new file is picked up
with no other edit. `build` keeps the file layout as-is (`about.html` lands at
`dist/about.html`); Cloudflare's static assets serve it at `/about`.

**Dev answers more paths than production.** In `dev` each route also answers its
sub-paths, so `index.html` answers every unknown URL with a 200 — a typo'd link or a
missing page looks fine locally. `bun run preview` and Cloudflare do not: an unknown path
is a 404 there. Check new routes and links with `bun run build && bun run preview`, not
only `dev`.

## Steps

1. Create `src/routes/<slug>.html` (or `src/routes/<slug>/index.html`). Copy the head of
   `src/routes/index.html`: `charset`, `viewport`, a real `<title>`, the global stylesheet
   link and one `<script type="module">` per component the page uses.
2. Use **relative** paths for every asset (`../styles/global.css`,
   `../components/foo.ts`). Bun bundles only what a document references, and relative
   links keep `dist/` free of any base-path assumption. A page one directory deeper needs
   one more `../`.
3. Load every custom element the markup uses. A tag whose module is never imported stays
   an unknown inline element — no error, no shadow root, just bare text.
4. Link between pages with relative links that match the route exactly — `./about` for
   `about.html`, never `./about/`. The server still answers `/about/`, but the built page
   links its chunks relatively (`./chunk-*.js`), so from `/about/` they resolve to
   `/about/chunk-*.js` and 404: the HTML loads, unstyled and with no components. A page
   at `about/index.html` is the opposite case and wants the trailing slash. Never use
   root-relative links, for the same base-path reason as step 2.
5. Run `bun run build` and confirm the page appears in the build output list, then
   `bun run preview` (port 4000) and open it.

## What the tests catch

Nothing checks a page's markup. `bun test` renders components in happy-dom; it never
opens `src/routes/*.html`. A page missing its stylesheet link or a component import
passes the whole suite — the browser (`bun run dev` or the PR preview URL) is the only
check. Once a site has several pages, consider a test that reads each `.html` file under
`src/routes/` and asserts the links it must carry.
