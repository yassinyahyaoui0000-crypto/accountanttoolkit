# Measurement Setup

This repo now includes a real sitewide GTM install for container `GTM-MXCN4BF7`.

## Current State

The site now has:

- the standard GTM `<head>` script on every HTML page
- the standard GTM `<noscript>` iframe immediately after `<body>`
- shared event pushes in `assets/js/site.js`

## What The Site Now Pushes

The shared script will:

- load GTM on every page
- push `at_page_view` into `dataLayer` on page load
- push `affiliate_click` into `dataLayer` when a tracked outbound CTA is clicked

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
- `label`

## GTM Recommendation

Inside GTM:

1. Create a GA4 Configuration tag.
2. Add your GA4 Measurement ID there.
3. Fire it on all pages.
4. Create a GA4 Event tag for `affiliate_click`.
5. Use the custom event trigger `affiliate_click`.

Optional:

- Create a GA4 Event tag for `at_page_view` if you want a custom page classification stream in addition to standard GA4 pageviews.

## Verification Checklist

After deploy:

1. Open the homepage and one article page in GTM Preview / Tag Assistant.
2. Confirm the GTM container loads.
3. Confirm `at_page_view` appears in `dataLayer`.
4. Click one vendor CTA on the homepage and one on an article page.
5. Confirm `affiliate_click` appears with the expected product and position values.
6. Confirm GA4 receives pageviews and the affiliate click event.

## Important Note

The code is now measurement-ready and GTM-installed, but you still need to:

1. deploy the updated site
2. publish a GA4 Configuration tag inside GTM
3. test the container in Tag Assistant / Preview mode
