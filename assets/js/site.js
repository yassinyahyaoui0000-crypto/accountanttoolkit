const navItems = [
  { href: "index.html", label: "Home", page: "home" },
  { href: "best-invoicing-software.html", label: "Best Invoicing", page: "best-invoicing" },
  { href: "best-receipt-tracking.html", label: "Receipt Tracking", page: "receipt-tracking" },
  { href: "xero-vs-wave.html", label: "Comparisons", page: "comparisons" },
  { href: "freshbooks-review.html", label: "Reviews", page: "reviews" },
  { href: "how-to-choose-accounting-software.html", label: "Guide", page: "guide" }
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
  }
];

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
          <p class="footer__meta">Disclosure: some outbound links may later become affiliate links. Recommendations are editorial and pricing should always be confirmed on the vendor site.</p>
          <p class="footer__meta">Last rebuilt on March 19, 2026.</p>
        </section>
        ${columns}
      </div>
    </footer>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const headerSlot = document.querySelector("[data-site-header]");
  const footerSlot = document.querySelector("[data-site-footer]");

  if (headerSlot) {
    headerSlot.outerHTML = renderHeader();
  }

  if (footerSlot) {
    footerSlot.outerHTML = renderFooter();
  }

  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".site-nav__links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      navLinks.classList.toggle("is-open", !expanded);
    });

    navLinks.addEventListener("click", (event) => {
      if (event.target instanceof HTMLElement && event.target.tagName === "A") {
        navToggle.setAttribute("aria-expanded", "false");
        navLinks.classList.remove("is-open");
      }
    });
  }
});
