# Statement2CSV MVP

## Best place in this repo

The right insertion point is a standalone static tool page rather than a new app shell or shared backend:

- `statement-to-csv.html`
- `assets/js/statement2csv.js`
- `assets/css/statement2csv.css`

That shape matches how the repo already works today:

- static HTML entrypoints
- shared site chrome from `assets/js/site.js`
- no existing build step or server runtime

## Why this is the safest Cloudflare shape

This MVP is intentionally local-first:

- the PDF is parsed in the browser with PDF.js
- no statement file needs to be uploaded
- the site remains deployable as a plain Cloudflare Pages project

That means the current deployment path can stay simple:

```bash
npx wrangler pages deploy . --project-name accountanttoolkit
```

or via Git-connected Cloudflare Pages if that is already how the site ships.

## Minimal Cloudflare Pages deploy steps

1. Connect the repo to Cloudflare Pages or deploy the repo root with `wrangler pages deploy .`.
2. Leave the site as a static project with no build command and `/` as the output directory if Cloudflare asks for one.
3. Make sure `_redirects` is included in the published root so the pretty URLs still resolve on Pages.
4. After deploy, test both `/statement-to-csv.html` and `/statement-to-csv` and run one sample conversion in the browser.

## Why not Pages Functions yet

Pages Functions would add value later for:

- OCR for scanned statements
- per-bank parsing profiles
- saved jobs or authenticated history
- queue-backed heavy processing

For this MVP, a backend would mostly add complexity and failure modes without improving the core use case enough to justify it.

## Upgrade path

If the tool graduates beyond text-based PDFs, the next credible move is:

1. Keep `statement-to-csv.html` as the public UI.
2. Add `/functions/api/statement-to-csv.js` for OCR or structured parsing.
3. Add storage only when users need saved outputs or retryable jobs.
