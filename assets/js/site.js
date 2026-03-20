const navItems = [
  { href: "index.html", label: "Home", page: "home" },
  { href: "best-invoicing-software.html", label: "Best Invoicing", page: "best-invoicing" },
  { href: "best-receipt-tracking.html", label: "Receipt Tracking", page: "receipt-tracking" },
  { href: "xero-vs-wave.html", label: "Comparisons", page: "comparisons" },
  { href: "freshbooks-review.html", label: "Reviews", page: "reviews" },
  { href: "how-to-choose-accounting-software.html", label: "Guide", page: "guide" },
  { href: "about.html", label: "About", page: "trust" }
];

const footerColumns = [
  {
    title: "Comparisons",
    links: [
      ["Xero vs Wave", "xero-vs-wave.html"],
      ["Bonsai vs FreshBooks", "bonsai-vs-freshbooks.html"],
      ["Zoho Books vs QuickBooks", "zoho-vs-quickbooks.html"]
    ]
  },
  {
    title: "Reviews",
    links: [
      ["FreshBooks review", "freshbooks-review.html"],
      ["Bonsai review", "bonsai-review.html"],
      ["Xero review", "xero-review.html"]
    ]
  },
  {
    title: "Buyer's guides",
    links: [
      ["Best invoicing software", "best-invoicing-software.html"],
      ["Best receipt tracking tools", "best-receipt-tracking.html"],
      ["How to choose accounting software", "how-to-choose-accounting-software.html"]
    ]
  },
  {
    title: "Trust",
    links: [
      ["About", "about.html"],
      ["Contact", "contact.html"],
      ["Editorial policy", "editorial-policy.html"],
      ["Affiliate disclosure", "affiliate-disclosure.html"]
    ]
  }
];

const articlePages = new Set([
  "best-invoicing",
  "receipt-tracking",
  "freelancer-accounting",
  "solo-bookkeeping",
  "comparisons",
  "reviews",
  "guide"
]);

const productCatalog = {
  freshbooks: { icon: "assets/img/products/freshbooks.svg" },
  bonsai: { icon: "assets/img/products/bonsai.svg" },
  xero: { icon: "assets/img/products/xero.svg" },
  wave: { icon: "assets/img/products/wave.svg" },
  "zoho-books": { icon: "assets/img/products/zoho-books.svg" },
  quickbooks: { icon: "assets/img/products/quickbooks.svg" },
  dext: { icon: "assets/img/products/dext.svg" },
  "zoho-expense": { icon: "assets/img/products/zoho-expense.svg" },
  hubdoc: { icon: "assets/img/products/hubdoc.svg" }
};

function formatReviewedDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function renderHeader() {
  const currentPage = document.body.dataset.page || "";
  const navLinks = navItems
    .map((item) => {
      const current = item.page === currentPage ? ' aria-current="page"' : "";
      return `<a href="${item.href}"${current}>${item.label}</a>`;
    })
    .join("");

  return `
    <a class="skip-link" href="#content">Skip to content</a>
    <header class="site-header">
      <div class="site-header__inner">
        <a class="brand" href="index.html" aria-label="AccountantToolkit home">
          <span class="brand__mark" aria-hidden="true">AT</span>
          <span class="brand__text">
            <span class="brand__name">AccountantToolkit</span>
            <span class="brand__tag">Software reviews for freelance accountants</span>
          </span>
        </a>
        <nav class="site-nav" aria-label="Primary">
          <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav-links">Menu</button>
          <div class="site-nav__links" id="site-nav-links">${navLinks}</div>
        </nav>
      </div>
    </header>
  `;
}

function renderFooter() {
  const columns = footerColumns
    .map(
      (column) => `
        <section class="footer__column">
          <h3>${column.title}</h3>
          <ul>
            ${column.links.map(([label, href]) => `<li><a href="${href}">${label}</a></li>`).join("")}
          </ul>
        </section>
      `
    )
    .join("");

  return `
    <footer class="footer">
      <div class="footer__inner">
        <section class="footer__brand">
          <h2>AccountantToolkit</h2>
          <p>We rebuild software buying decisions around actual workflows: invoicing, expense capture, client operations, bookkeeping depth, and integration risk.</p>
          <p class="footer__meta">Read our <a href="editorial-policy.html">editorial policy</a> and <a href="affiliate-disclosure.html">affiliate disclosure</a> for how we research products, handle promotions, and label commercial relationships.</p>
          <p class="footer__meta">Corrections and business inquiries: <a href="mailto:hello@accountanttoolkit.com">hello@accountanttoolkit.com</a>.</p>
          <p class="footer__meta">Last rebuilt on March 19, 2026.</p>
        </section>
        ${columns}
      </div>
    </footer>
  `;
}

function decorateProductTokens(root = document) {
  root.querySelectorAll("[data-product]").forEach((element) => {
    const product = productCatalog[element.dataset.product];

    if (!product || element.querySelector(".product-token__icon")) {
      return;
    }

    const icon = document.createElement("img");
    const compact = element.matches("th, td, .product-chip, .product-mini");
    const size = compact ? 22 : 30;

    icon.src = product.icon;
    icon.alt = "";
    icon.width = size;
    icon.height = size;
    icon.decoding = "async";
    icon.loading = element.closest(".page-hero") ? "eager" : "lazy";
    icon.className = "product-token__icon";

    element.classList.add("product-token");

    if (element.matches(".product-chip")) {
      element.classList.add("product-token--chip");
    }

    if (element.matches("h1, h2, h3")) {
      element.classList.add("product-token--heading");
    }

    if (element.matches("td, th")) {
      element.classList.add("product-token--table");
    }

    if (element.matches(".kicker")) {
      element.classList.add("product-token--kicker");
    }

    element.prepend(icon);
  });
}
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = document.body.dataset.page || "";
  const headerSlot = document.querySelector("[data-site-header]");
  const footerSlot = document.querySelector("[data-site-footer]");

  if (headerSlot) {
    headerSlot.outerHTML = renderHeader();
  }

  if (footerSlot) {
    footerSlot.outerHTML = renderFooter();
  }

  decorateProductTokens();

  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".site-nav__links");

  if (navToggle && navLinks) {
    const closeNav = () => {
      navToggle.setAttribute("aria-expanded", "false");
      navLinks.classList.remove("is-open");
    };

    const openNav = () => {
      navToggle.setAttribute("aria-expanded", "true");
      navLinks.classList.add("is-open");
    };

    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      if (expanded) {
        closeNav();
      } else {
        openNav();
      }
    });

    navLinks.addEventListener("click", (event) => {
      if (event.target instanceof HTMLElement && event.target.tagName === "A") {
        closeNav();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeNav();
      }
    });

    document.addEventListener("click", (event) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (!navToggle.contains(target) && !navLinks.contains(target)) {
        closeNav();
      }
    });
  }

  if (articlePages.has(currentPage)) {
    const articleBody = document.querySelector(".article-main.article-body");
    const reviewDate = document.body.dataset.reviewed || "2026-03-19";

    if (articleBody && !articleBody.querySelector("[data-editorial-note]")) {
      const note = document.createElement("section");
      note.className = "callout callout--muted editorial-note";
      note.setAttribute("data-editorial-note", "true");
      note.innerHTML = `
        <p class="kicker">Editorial note</p>
        <p><strong>Last reviewed:</strong> ${formatReviewedDate(reviewDate)}. AccountantToolkit checks official vendor pages before making plan, trial, or pricing claims. When pricing is promotional, region-specific, or usage-based, we say so instead of freezing numbers that age badly.</p>
        <p>For details on how pages are updated and how commercial relationships are handled, see our <a href="editorial-policy.html">editorial policy</a> and <a href="affiliate-disclosure.html">affiliate disclosure</a>.</p>
      `;

      const lede = articleBody.querySelector(".lede");

      if (lede) {
        lede.insertAdjacentElement("afterend", note);
      } else {
        articleBody.prepend(note);
      }
    }
  }
});
