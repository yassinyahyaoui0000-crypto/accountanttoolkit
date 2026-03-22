# 14-Day SEO Stabilization Sprint

This sprint is for **ranking the current pages first**, not publishing another large content batch.

## Goal

Use the next 10 to 14 days to improve:

- indexing clarity
- measurement
- canonical consistency
- early ranking visibility

Default rule: publish `0` new articles during this sprint.

## Priority URLs

The first pages to monitor are:

1. `https://accountanttoolkit.com/`
2. `https://accountanttoolkit.com/best-accounting-software-for-freelancers`
3. `https://accountanttoolkit.com/best-invoicing-software`
4. `https://accountanttoolkit.com/xero-vs-wave`
5. `https://accountanttoolkit.com/quickbooks-vs-xero`
6. `https://accountanttoolkit.com/xero-review`

These same URLs are stored in `seo/priority-urls.txt`.

## What Changed In This Sprint

- public URLs were standardized to extensionless canonicals
- sitemap URLs were standardized to extensionless URLs
- internal links were standardized to extensionless URLs
- shared asset versioning was bumped to `2026-03-22-stabilize`
- sitewide GTM scaffolding was added in `assets/js/site.js`
- live observation tooling was updated for canonical-drift checks

## What To Do First

1. Add your real GTM container ID in `assets/js/site.js`.
2. Deploy the current `main`.
3. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\observe-live-seo.ps1
```

4. In Google Search Console:
   - confirm the sitemap is processed successfully
   - inspect the six priority URLs
   - request indexing only for live, canonical pages that are not indexed
   - check Page Indexing, Manual Actions, and Rich Results

## What To Monitor During The Window

- sitemap processing
- indexed vs excluded pages
- first impressions by page
- first clicks by page
- CTR once impressions appear
- pages sitting around positions 8 to 20
- important pages with zero impressions

## Decision Rules After 10 To 14 Days

- If indexing is still messy, stay on technical cleanup.
- If impressions exist but CTR is weak, improve titles and meta descriptions on the moving pages.
- If one cluster gets traction first, double down there instead of publishing evenly across the site.
- If the accounting cluster moves first, the default next page is `quickbooks-vs-wave.html`.
- If the receipt cluster moves first, the default next page is `hubdoc-review.html`.
- If the invoicing cluster moves first, add one strong FreshBooks/Bonsai satellite instead of another 6-page batch.

## Baseline Export

On the review date:

1. Export Search Console performance data.
2. Fill in `docs/seo-baseline-template.csv`.
3. Bring back:
   - top pages by impressions
   - top pages by clicks
   - top queries by impressions
   - top queries by clicks
   - CTR and average position
   - which priority pages are indexed, excluded, or undiscovered

If the data is still thin after 7 days, wait for a 14-day export instead of publishing more pages blindly.
