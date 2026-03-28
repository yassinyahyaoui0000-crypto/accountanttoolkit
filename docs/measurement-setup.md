# Measurement Setup

This repo now includes a real sitewide GTM install for container `GTM-MXCN4BF7`.
It also includes an optional Microsoft Clarity loader and a central affiliate-link override map in `assets/js/site.js`.

## Current State

The site now has:

- the standard GTM `<head>` script on every HTML page
- the standard GTM `<noscript>` iframe immediately after `<body>`
- shared event pushes in `assets/js/site.js`
- optional Clarity script loading when `CLARITY_PROJECT_ID` is configured
- central affiliate URL overrides so approved programs can be switched on product-by-product without editing every page

## What The Site Now Pushes

The shared script will:

- load GTM on every page
- load Clarity on every page when a real project ID is configured
- push `at_page_view` into `dataLayer` on page load
- push `affiliate_click` into `dataLayer` when a tracked outbound CTA is clicked, whether that CTA currently goes to an official vendor page or an approved affiliate URL

### `at_page_view` payload

- `event`
- `page_title`
- `page_location`
- `page_path`
- `page_type`

### `affiliate_click` payload

- `event`
- `page`
- `href`
- `domain`
- `position`
- `product`
- `link_mode`
- `label`

`link_mode` will be:

- `official` when the page still links to the vendor's normal site
- `affiliate` when you have added an approved override URL for that product in `AFFILIATE_URL_OVERRIDES`

## What To Configure In `assets/js/site.js`

### Microsoft Clarity

1. Create a Clarity project.
2. Copy the numeric project ID.
3. Paste it into `CLARITY_PROJECT_ID`.

If you target EEA, UK, or Switzerland traffic, review Clarity consent requirements before turning it on.

### Affiliate URL overrides

Paste approved tracking URLs into the matching product keys:

```js
const AFFILIATE_URL_OVERRIDES = {
  xero: "",
  freshbooks: "",
  wave: "",
  bonsai: "",
  "zoho-books": "",
  quickbooks: "",
  dext: "",
  hubdoc: "",
  "zoho-expense": ""
};
```

Default behavior:

- blank value: keep official vendor URL, add `utm_medium=review`, and classify the click as `link_mode=official`
- filled value: swap in the approved affiliate URL, preserve that URL as-is, and classify the click as `link_mode=affiliate`

## GTM Recommendation

Inside GTM:

1. Create a GA4 Configuration tag.
2. Add your GA4 Measurement ID there.
3. Fire it on all pages.
4. Create a GA4 Event tag for `affiliate_click`.
5. Use the custom event trigger `affiliate_click`.
6. Register `product`, `position`, and `link_mode` as GA4 custom dimensions if you want cleaner reporting by page and CTA type.

Optional:

- Create a GA4 Event tag for `at_page_view` if you want a custom page classification stream in addition to standard GA4 pageviews.

## Verification Checklist

After deploy:

1. Open the homepage and one article page in GTM Preview / Tag Assistant.
2. Confirm the GTM container loads.
3. Confirm `at_page_view` appears in `dataLayer`.
4. If `CLARITY_PROJECT_ID` is configured, confirm the Clarity script loads.
5. Click one vendor CTA on the homepage and one on an article page.
6. Confirm `affiliate_click` appears with the expected `product`, `position`, and `link_mode` values.
7. Confirm GA4 receives pageviews and the affiliate click event.

## Important Note

The code is measurement-ready, but you still need to:

1. deploy the updated site
2. publish a GA4 Configuration tag inside GTM
3. test the container in Tag Assistant / Preview mode
4. add a real Clarity project ID if you want session replay and heatmaps
5. paste approved affiliate URLs into `AFFILIATE_URL_OVERRIDES` only after each program approves the site
