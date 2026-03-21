# Week 1 SEO Observation

This repo is ready for a 7-day observation cycle, but there is one important blocker to clear first:

- Local `main` is ahead of `origin/main` by 1 commit: `764785d`
- The live sitemap at `https://accountanttoolkit.com/sitemap.xml` is still showing `2026-03-19`
- The repo sitemap is already updated to `2026-03-21`

That means Google may still be seeing the older live version until the latest commit is pushed and deployed.

## Current Live Observations

These were confirmed from the live domain on March 21, 2026:

- `robots.txt` is live and returns `200`
- `sitemap.xml` is live and returns `200`
- The live sitemap is still showing `2026-03-19` as the first `lastmod`
- The homepage is live and indexable
- The main article and comparison URLs return `200`, but they redirect from `.html` URLs to extensionless URLs on the live site
- Those live article pages still expose canonical tags pointing to the `.html` version, so live final URLs and canonical URLs are not perfectly aligned yet

This is not a reason to restart a whole SEO sprint, but it is worth watching closely. If Search Console shows indexing confusion on these pages, the canonical/redirect alignment becomes the first technical fix.

## Priority URLs

The first observation window should focus on these pages:

1. `https://accountanttoolkit.com/`
2. `https://accountanttoolkit.com/best-accounting-software-for-freelancers.html`
3. `https://accountanttoolkit.com/best-invoicing-software.html`
4. `https://accountanttoolkit.com/xero-vs-wave.html`
5. `https://accountanttoolkit.com/wave-review.html`
6. `https://accountanttoolkit.com/xero-review.html`

These same URLs are stored in `seo/priority-urls.txt` for script-based checks.

## What To Do Today

1. Push and deploy the latest `main` commit so the live site matches the repo.
2. Run the live check script:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\observe-live-seo.ps1
```

3. If you want a CSV snapshot saved locally:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\observe-live-seo.ps1 -OutputCsvPath .\seo\checks\2026-03-21-live-check.csv
```

4. In Google Search Console:
   - Confirm the sitemap is processed successfully.
   - Inspect each priority URL.
   - Note whether Google reports the canonical as the user-declared `.html` URL or the live extensionless URL.
   - Request indexing only for priority URLs that are live, canonical, and not indexed.
   - Check Page Indexing, Manual Actions, and Rich Results for blockers.

## What To Do On March 24 Or March 25, 2026

1. Re-run the live check script.
2. Confirm the live sitemap date is current.
3. Re-check index status for the priority URLs in Search Console.
4. Do not make new content rewrites unless you find a real issue such as:
   - broken internal links
   - wrong canonical tags
   - accidental `noindex`
   - schema errors
   - visible layout bugs

## What To Do On March 28, 2026

1. Export the last 7 days of Search Console performance data.
2. Fill in `docs/seo-baseline-template.csv`.
3. Bring back:
   - top pages by impressions
   - top pages by clicks
   - top queries by impressions
   - top queries by clicks
   - CTR and average position for pages with impressions
   - which priority pages are indexed, excluded, or undiscovered
   - any important page with zero impressions

If the 7-day window is still too thin, wait until April 4, 2026 and use a 14-day export instead.

## Decision Rules For The Next Sprint

- If impressions exist but CTR is weak, focus next on titles, meta descriptions, and snippet intent.
- If pages are indexed and sit around positions 8-20, focus next on internal links, comparison depth, and clearer differentiation.
- If priority pages are excluded or undiscovered, switch next to technical SEO debugging.
- If one cluster starts moving first, double down there instead of editing the whole site evenly.
