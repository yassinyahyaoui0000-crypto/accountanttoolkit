import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const assetVersion = "2026-03-22-stabilize";
const pageMap = new Map([
  ["index.html", "/"],
  ["about.html", "/about"],
  ["contact.html", "/contact"],
  ["editorial-policy.html", "/editorial-policy"],
  ["affiliate-disclosure.html", "/affiliate-disclosure"],
  ["best-invoicing-software.html", "/best-invoicing-software"],
  ["best-receipt-tracking.html", "/best-receipt-tracking"],
  ["best-accounting-software-for-freelancers.html", "/best-accounting-software-for-freelancers"],
  ["best-bookkeeping-software-for-solo-accountants.html", "/best-bookkeeping-software-for-solo-accountants"],
  ["how-to-choose-accounting-software.html", "/how-to-choose-accounting-software"],
  ["xero-vs-wave.html", "/xero-vs-wave"],
  ["bonsai-vs-freshbooks.html", "/bonsai-vs-freshbooks"],
  ["zoho-vs-quickbooks.html", "/zoho-vs-quickbooks"],
  ["freshbooks-review.html", "/freshbooks-review"],
  ["bonsai-review.html", "/bonsai-review"],
  ["xero-review.html", "/xero-review"],
  ["wave-review.html", "/wave-review"],
  ["quickbooks-review.html", "/quickbooks-review"],
  ["zoho-review.html", "/zoho-review"],
  ["wave-vs-freshbooks.html", "/wave-vs-freshbooks"],
  ["zoho-vs-wave.html", "/zoho-vs-wave"],
  ["quickbooks-vs-xero.html", "/quickbooks-vs-xero"],
  ["wave-alternatives.html", "/wave-alternatives"],
  ["xero-alternatives.html", "/xero-alternatives"],
  ["best-free-accounting-software-for-freelancers.html", "/best-free-accounting-software-for-freelancers"],
  ["quickbooks-for-freelancers.html", "/quickbooks-for-freelancers"],
  ["quickbooks-alternatives.html", "/quickbooks-alternatives"],
  ["zoho-alternatives.html", "/zoho-alternatives"],
  ["freshbooks-alternatives.html", "/freshbooks-alternatives"],
  ["zoho-for-freelancers.html", "/zoho-for-freelancers"],
  ["freshbooks-for-freelancers.html", "/freshbooks-for-freelancers"],
  ["xero-vs-zoho.html", "/xero-vs-zoho"],
  ["dext-review.html", "/dext-review"],
  ["dext-vs-hubdoc.html", "/dext-vs-hubdoc"],
  ["404.html", "/404"]
]);

function replaceAll(content, searchValue, replaceValue) {
  return content.split(searchValue).join(replaceValue);
}

function transform(content) {
  let next = replaceAll(content, "assets/css/site.css?v=2026-03-21", `assets/css/site.css?v=${assetVersion}`);
  next = replaceAll(next, "assets/js/site.js?v=2026-03-21-badges", `assets/js/site.js?v=${assetVersion}`);
  next = replaceAll(next, "assets/js/site.js?v=2026-03-21", `assets/js/site.js?v=${assetVersion}`);

  for (const [fileName, publicPath] of pageMap) {
    next = replaceAll(next, `https://accountanttoolkit.com/${fileName}`, `https://accountanttoolkit.com${publicPath}`);
    next = replaceAll(next, `"${fileName}"`, `"${publicPath}"`);
    next = replaceAll(next, `'${fileName}'`, `'${publicPath}'`);
    next = replaceAll(next, `"${fileName}#`, `"${publicPath}#`);
    next = replaceAll(next, `'${fileName}#`, `'${publicPath}#`);
  }

  return next;
}

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".html") || entry.name === "googleb33d5d93a086934e.html") {
    continue;
  }

  const fullPath = path.join(root, entry.name);
  const current = fs.readFileSync(fullPath, "utf8");
  const next = transform(current);

  if (next !== current) {
    fs.writeFileSync(fullPath, next);
  }
}

for (const relativePath of [
  "sitemap.xml",
  path.join("seo", "priority-urls.txt"),
  path.join("docs", "seo-baseline-template.csv")
]) {
  const fullPath = path.join(root, relativePath);
  const current = fs.readFileSync(fullPath, "utf8");
  const next = transform(current);

  if (next !== current) {
    fs.writeFileSync(fullPath, next);
  }
}

console.log("Normalized public URL policy and asset versions.");
