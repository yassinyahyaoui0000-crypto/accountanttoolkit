# Affiliate Execution Playbook

This repo now includes the site-side pieces needed for the first 30-day affiliate sprint:

- GTM and GA4-ready click tracking
- optional Clarity loading
- product-level affiliate URL overrides
- a 10-page priority list
- a tracker template for indexing, clicks, and approvals

For the current no-social growth approach, pair this file with:

- `docs/non-social-traffic-playbook-90-days.md`
- `docs/outreach-playbook.md`
- `docs/statement2csv-support-queue.md`

## Priority money pages

Use only these pages for the first sprint:

1. `https://accountanttoolkit.com/best-accounting-software-for-freelancers`
2. `https://accountanttoolkit.com/best-bookkeeping-software-for-solo-accountants`
3. `https://accountanttoolkit.com/best-invoicing-software`
4. `https://accountanttoolkit.com/xero-review`
5. `https://accountanttoolkit.com/quickbooks-review`
6. `https://accountanttoolkit.com/freshbooks-review`
7. `https://accountanttoolkit.com/xero-vs-wave`
8. `https://accountanttoolkit.com/quickbooks-vs-xero`
9. `https://accountanttoolkit.com/dext-review`
10. `https://accountanttoolkit.com/dext-vs-hubdoc`

The same URLs are stored in `seo/priority-money-urls.txt`.

## 30-day sequence

### Week 1

- Deploy the current branch.
- Verify Search Console ownership and resubmit `sitemap.xml`.
- Publish the GA4 configuration tag in GTM.
- Add a real `CLARITY_PROJECT_ID` in `assets/js/site.js` if you want Clarity active.
- Start `docs/affiliate-ops-tracker-template.csv` as your working sheet.
- Apply to Xero, Zoho, and FreshBooks using `docs/affiliate-application-kit.md`.

### Week 2

- Refresh only the 10 priority pages.
- Request indexing for refreshed pages plus the homepage.
- Check that each priority page links to at least one roundup, one comparison, and one review.
- Watch for impressions before publishing more pages outside the priority set.

### Week 3

- Export Search Console data and fill the tracker.
- Rewrite low-CTR titles first, not the pages with zero impressions.
- Use Clarity to find dead clicks, weak scroll depth, and missed CTA areas.
- Turn on affiliate overrides only for approved programs.

### Week 4

- Keep publishing only in clusters that are already getting impressions.
- Review CTA clicks by `product`, `position`, and `link_mode`.
- Drop or defer any page type that is getting no impressions and no outbound clicks.
- Build the next 30-day queue from live query data instead of guesses.

## Manual tasks outside the repo

- Search Console verification and indexing requests
- GA4 property setup
- GTM publishing
- Clarity project creation
- Affiliate program applications and payout setup
- Non-social email outreach and resource-page prospecting

## Repo-side switches

- `assets/js/site.js`
  Paste your Clarity project ID into `CLARITY_PROJECT_ID`.
- `assets/js/site.js`
  Paste approved affiliate URLs into `AFFILIATE_URL_OVERRIDES`.
- `docs/affiliate-ops-tracker-template.csv`
  Use this as the main sprint tracker.
