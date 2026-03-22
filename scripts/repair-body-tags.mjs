import fs from "node:fs";
import path from "node:path";

const bodyTagMap = new Map([
  ["404.html", '<body data-page="">'],
  ["about.html", '<body data-page="trust">'],
  ["affiliate-disclosure.html", '<body data-page="trust">'],
  ["best-accounting-software-for-freelancers.html", '<body data-page="freelancer-accounting" data-reviewed="2026-03-22">'],
  ["best-bookkeeping-software-for-solo-accountants.html", '<body data-page="solo-bookkeeping" data-reviewed="2026-03-22">'],
  ["best-free-accounting-software-for-freelancers.html", '<body data-page="freelancer-accounting" data-reviewed="2026-03-22">'],
  ["best-invoicing-software.html", '<body data-page="best-invoicing" data-reviewed="2026-03-22">'],
  ["best-receipt-tracking.html", '<body data-page="receipt-tracking" data-reviewed="2026-03-22">'],
  ["bonsai-review.html", '<body data-page="reviews" data-reviewed="2026-03-21">'],
  ["bonsai-vs-freshbooks.html", '<body data-page="comparisons" data-reviewed="2026-03-21">'],
  ["contact.html", '<body data-page="trust">'],
  ["dext-review.html", '<body data-page="reviews" data-reviewed="2026-03-22">'],
  ["dext-vs-hubdoc.html", '<body data-page="comparisons" data-reviewed="2026-03-22">'],
  ["editorial-policy.html", '<body data-page="trust">'],
  ["freshbooks-alternatives.html", '<body data-page="best-invoicing" data-reviewed="2026-03-22">'],
  ["freshbooks-for-freelancers.html", '<body data-page="best-invoicing" data-reviewed="2026-03-22">'],
  ["freshbooks-review.html", '<body data-page="reviews" data-reviewed="2026-03-22">'],
  ["how-to-choose-accounting-software.html", '<body data-page="guide" data-reviewed="2026-03-21">'],
  ["index.html", '<body data-page="home">'],
  ["quickbooks-alternatives.html", '<body data-page="freelancer-accounting" data-reviewed="2026-03-22">'],
  ["quickbooks-for-freelancers.html", '<body data-page="freelancer-accounting" data-reviewed="2026-03-22">'],
  ["quickbooks-review.html", '<body data-page="reviews" data-reviewed="2026-03-22">'],
  ["quickbooks-vs-xero.html", '<body data-page="comparisons" data-reviewed="2026-03-21">'],
  ["wave-alternatives.html", '<body data-page="freelancer-accounting" data-reviewed="2026-03-22">'],
  ["wave-review.html", '<body data-page="reviews" data-reviewed="2026-03-21">'],
  ["wave-vs-freshbooks.html", '<body data-page="comparisons" data-reviewed="2026-03-21">'],
  ["xero-alternatives.html", '<body data-page="freelancer-accounting" data-reviewed="2026-03-22">'],
  ["xero-review.html", '<body data-page="reviews" data-reviewed="2026-03-21">'],
  ["xero-vs-wave.html", '<body data-page="comparisons" data-reviewed="2026-03-21">'],
  ["xero-vs-zoho.html", '<body data-page="comparisons" data-reviewed="2026-03-22">'],
  ["zoho-alternatives.html", '<body data-page="freelancer-accounting" data-reviewed="2026-03-22">'],
  ["zoho-for-freelancers.html", '<body data-page="freelancer-accounting" data-reviewed="2026-03-22">'],
  ["zoho-review.html", '<body data-page="reviews" data-reviewed="2026-03-22">'],
  ["zoho-vs-quickbooks.html", '<body data-page="comparisons" data-reviewed="2026-03-21">'],
  ["zoho-vs-wave.html", '<body data-page="comparisons" data-reviewed="2026-03-21">']
]);

const noscriptLine = "  <!-- Google Tag Manager (noscript) -->";

for (const [fileName, bodyTag] of bodyTagMap) {
  const filePath = path.join(process.cwd(), fileName);
  const current = fs.readFileSync(filePath, "utf8");
  let next = current.replace("  <!-- End Google Tag Manager --></head>", "  <!-- End Google Tag Manager -->\n</head>");
  next = next.replace(`<body>\r\n${noscriptLine}`, `${bodyTag}\r\n${noscriptLine}`);
  next = next.replace(`<body>\n${noscriptLine}`, `${bodyTag}\n${noscriptLine}`);

  if (next !== current) {
    fs.writeFileSync(filePath, next);
  }
}

console.log("Restored original body tags.");
