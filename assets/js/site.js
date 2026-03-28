const THEME_STORAGE_KEY = "accountanttoolkit-theme";
const ASSET_VERSION = "2026-03-26-editorial";
const SITE_REBUILD_DATE = "2026-03-26";
const DEFAULT_REVIEW_DATE = "2026-03-22";
const GTM_CONTAINER_ID = "GTM-MXCN4BF7";
const CLARITY_PROJECT_ID = "";
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

function isConfiguredGtmId(value) {
  return /^GTM-[A-Z0-9]+$/i.test(value) && !/^GTM-X+$/i.test(value);
}

function isConfiguredClarityId(value) {
  return /^\d+$/.test(String(value || "").trim());
}

function ensureDataLayer() {
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

function initTagManager() {
  if (!isConfiguredGtmId(GTM_CONTAINER_ID)) {
    return false;
  }

  if (
    document.querySelector(`script[data-gtm-container="${GTM_CONTAINER_ID}"]`) ||
    document.querySelector(`script[src*="googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}"]`) ||
    (window.google_tag_manager && window.google_tag_manager[GTM_CONTAINER_ID])
  ) {
    return true;
  }

  const dataLayer = ensureDataLayer();
  dataLayer.push({
    "gtm.start": Date.now(),
    event: "gtm.js"
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_CONTAINER_ID)}`;
  script.setAttribute("data-gtm-container", GTM_CONTAINER_ID);
  document.head.appendChild(script);
  document.documentElement.dataset.gtmConfigured = "true";

  return true;
}

function initClarity() {
  if (!isConfiguredClarityId(CLARITY_PROJECT_ID)) {
    return false;
  }

  if (
    typeof window.clarity === "function" ||
    document.querySelector(`script[data-clarity-project-id="${CLARITY_PROJECT_ID}"]`)
  ) {
    return true;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(CLARITY_PROJECT_ID)}`;
  script.setAttribute("data-clarity-project-id", CLARITY_PROJECT_ID);
  document.head.appendChild(script);
  document.documentElement.dataset.clarityConfigured = "true";

  return true;
}

function trackPageView() {
  const payload = {
    event: "at_page_view",
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname,
    page_type: document.body.dataset.page || "unknown"
  };

  ensureDataLayer().push(payload);

  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view", payload);
  }
}

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getPreferredTheme() {
  const storedTheme = getStoredTheme();

  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = normalizedTheme;
}

function setTheme(theme, options = {}) {
  const { withTransition = false } = options;
  const normalizedTheme = theme === "dark" ? "dark" : "light";

  if (withTransition) {
    document.documentElement.classList.add("is-theme-switching");
    window.setTimeout(() => {
      document.documentElement.classList.remove("is-theme-switching");
    }, 280);
  }

  applyTheme(normalizedTheme);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
  } catch {
    // Ignore localStorage failures in private browsing modes.
  }
}

function updateThemeToggle(toggle, activeTheme) {
  const nextTheme = activeTheme === "dark" ? "light" : "dark";
  const nextThemeLabel = nextTheme === "dark" ? "Dark mode" : "Light mode";
  const currentThemeIcon = activeTheme === "dark" ? "moon" : "sun";
  const currentThemeGlyph = activeTheme === "dark" ? "\u263D" : "\u2600";

  toggle.innerHTML = `<span class="theme-toggle__icon" aria-hidden="true" data-icon="${currentThemeIcon}">${currentThemeGlyph}</span><span class="theme-toggle__label">${nextThemeLabel}</span>`;
  toggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
  toggle.setAttribute("aria-pressed", activeTheme === "dark" ? "true" : "false");
}

function initThemeToggle(root = document) {
  const toggle = root.querySelector("[data-theme-toggle]");

  if (!toggle) {
    return;
  }

  updateThemeToggle(toggle, document.documentElement.dataset.theme || "light");

  toggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme, { withTransition: true });
    updateThemeToggle(toggle, nextTheme);
  });
}

applyTheme(getPreferredTheme());

const navItems = [
  { href: "/", label: "Home", page: "home" },
  { href: "/best-invoicing-software", label: "Best Invoicing", page: "best-invoicing" },
  { href: "/best-receipt-tracking", label: "Receipt Tracking", page: "receipt-tracking" },
  { href: "/xero-vs-wave", label: "Comparisons", page: "comparisons" },
  { href: "/freshbooks-review", label: "Reviews", page: "reviews" },
  { href: "/how-to-choose-accounting-software", label: "Guide", page: "guide" },
  { href: "/about", label: "About", page: "trust" }
];

const footerColumns = [
  {
    title: "Comparisons",
    links: [
      ["Xero vs Wave", "/xero-vs-wave"],
      ["Bonsai vs FreshBooks", "/bonsai-vs-freshbooks"],
      ["Zoho Books vs QuickBooks", "/zoho-vs-quickbooks"],
      ["Wave vs FreshBooks", "/wave-vs-freshbooks"],
      ["Zoho Books vs Wave", "/zoho-vs-wave"],
      ["QuickBooks vs Xero", "/quickbooks-vs-xero"]
    ]
  },
  {
    title: "Reviews",
    links: [
      ["FreshBooks review", "/freshbooks-review"],
      ["Bonsai review", "/bonsai-review"],
      ["Xero review", "/xero-review"],
      ["Wave review", "/wave-review"],
      ["QuickBooks review", "/quickbooks-review"],
      ["Zoho Books review", "/zoho-review"]
    ]
  },
  {
    title: "Buyer's guides",
    links: [
      ["Best invoicing software", "/best-invoicing-software"],
      ["Best receipt tracking tools", "/best-receipt-tracking"],
      ["How to choose accounting software", "/how-to-choose-accounting-software"]
    ]
  },
  {
    title: "Trust",
    links: [
      ["About", "/about"],
      ["Contact", "/contact"],
      ["Editorial policy", "/editorial-policy"],
      ["Affiliate disclosure", "/affiliate-disclosure"]
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
  freshbooks: { icon: `assets/img/products/freshbooks.svg?v=${ASSET_VERSION}` },
  bonsai: { icon: `assets/img/products/bonsai.svg?v=${ASSET_VERSION}` },
  xero: { icon: `assets/img/products/xero.svg?v=${ASSET_VERSION}` },
  wave: { icon: `assets/img/products/wave.svg?v=${ASSET_VERSION}` },
  "zoho-books": { icon: `assets/img/products/zoho-books.svg?v=${ASSET_VERSION}` },
  quickbooks: { icon: `assets/img/products/quickbooks.svg?v=${ASSET_VERSION}` },
  dext: { icon: `assets/img/products/dext.svg?v=${ASSET_VERSION}` },
  "zoho-expense": { icon: `assets/img/products/zoho-expense.svg?v=${ASSET_VERSION}` },
  hubdoc: { icon: `assets/img/products/hubdoc.svg?v=${ASSET_VERSION}` }
};

function normalizeHost(hostname) {
  return hostname.replace(/^www\./, "").toLowerCase();
}

function getProductByUrl(url) {
  const normalizedHost = normalizeHost(url.hostname);
  const normalizedPath = url.pathname.toLowerCase();

  if (
    normalizedHost === "hubdoc.com" ||
    normalizedHost.endsWith(".hubdoc.com") ||
    ((normalizedHost === "xero.com" || normalizedHost.endsWith(".xero.com")) &&
      normalizedPath.includes("hubdoc"))
  ) {
    return "hubdoc";
  }

  if (
    normalizedHost === "zohoexpense.com" ||
    normalizedHost.endsWith(".zohoexpense.com") ||
    ((normalizedHost === "zoho.com" || normalizedHost.endsWith(".zoho.com")) &&
      normalizedPath.includes("/expense"))
  ) {
    return "zoho-expense";
  }

  if (normalizedHost === "dext.com" || normalizedHost.endsWith(".dext.com")) {
    return "dext";
  }

  if (normalizedHost === "xero.com" || normalizedHost.endsWith(".xero.com")) {
    return "xero";
  }

  if (normalizedHost === "freshbooks.com" || normalizedHost.endsWith(".freshbooks.com")) {
    return "freshbooks";
  }

  if (normalizedHost === "waveapps.com" || normalizedHost.endsWith(".waveapps.com")) {
    return "wave";
  }

  if (normalizedHost === "hellobonsai.com" || normalizedHost.endsWith(".hellobonsai.com")) {
    return "bonsai";
  }

  if (normalizedHost === "zoho.com" || normalizedHost.endsWith(".zoho.com")) {
    return "zoho-books";
  }

  if (normalizedHost === "intuit.com" || normalizedHost.endsWith(".intuit.com")) {
    return "quickbooks";
  }

  return null;
}

function getConfiguredAffiliateUrl(product) {
  const value = AFFILIATE_URL_OVERRIDES[product];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function detectCtaPosition(link) {
  const panel = link.closest(".cta-panel, .hero-panel, .summary-card, .table-card, .article-sidebar");

  if (panel?.classList.contains("cta-panel")) {
    return "end";
  }

  if (panel?.classList.contains("hero-panel")) {
    return "top";
  }

  if (panel?.classList.contains("summary-card") || panel?.classList.contains("table-card")) {
    return "mid";
  }

  if (panel?.classList.contains("article-sidebar")) {
    return "sidebar";
  }

  return "inline";
}

function normalizeAffiliateLinks(root = document) {
  const page = document.body.dataset.page || "site";
  const links = root.querySelectorAll("a[href^='http://'], a[href^='https://']");

  links.forEach((link) => {
    let parsed;

    try {
      parsed = new URL(link.href, window.location.origin);
    } catch {
      return;
    }

    const isExternal = parsed.hostname !== window.location.hostname;
    const product = getProductByUrl(parsed);

    if (!isExternal || !product) {
      return;
    }

    const overrideUrl = getConfiguredAffiliateUrl(product);
    const linkMode = overrideUrl ? "affiliate" : "official";
    const relSet = new Set((link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));

    if (linkMode === "affiliate") {
      relSet.add("sponsored");
    } else {
      relSet.delete("sponsored");
    }

    relSet.add("nofollow");
    relSet.add("noopener");
    relSet.add("noreferrer");
    link.setAttribute("rel", Array.from(relSet).join(" "));

    if (overrideUrl) {
      try {
        parsed = new URL(overrideUrl);
      } catch {
        parsed = new URL(link.href, window.location.origin);
      }
    } else {
      parsed.searchParams.set("utm_source", "accountanttoolkit");
      parsed.searchParams.set("utm_medium", "review");

      if (!parsed.searchParams.has("utm_campaign")) {
        parsed.searchParams.set("utm_campaign", page);
      }

      if (!parsed.searchParams.has("utm_content")) {
        parsed.searchParams.set("utm_content", detectCtaPosition(link));
      }
    }

    link.href = parsed.toString();
    link.dataset.affiliateLink = "true";
    link.dataset.affiliateProduct = product;
    link.dataset.linkMode = linkMode;
  });
}

function trackAffiliateClick(link) {
  const analyticsPayload = {
    event: "affiliate_click",
    page: document.body.dataset.page || "unknown",
    href: link.href,
    domain: new URL(link.href).hostname,
    position: detectCtaPosition(link),
    product: link.dataset.affiliateProduct || "unknown",
    link_mode: link.dataset.linkMode || "official",
    label: (link.textContent || "").trim().slice(0, 80)
  };

  if (typeof window.gtag === "function") {
    window.gtag("event", "affiliate_click", analyticsPayload);
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(analyticsPayload);
  }
}

function initAffiliateTracking(root = document) {
  normalizeAffiliateLinks(root);

  document.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const link = target.closest("a[data-affiliate-link='true']");

    if (!link) {
      return;
    }

    trackAffiliateClick(link);
  });
}

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
        <a class="brand" href="/" aria-label="AccountantToolkit home">
          <span class="brand__mark" aria-hidden="true"><img src="assets/img/logo-mark.svg" alt="" width="44" height="44"></span>
          <span class="brand__text">
            <span class="brand__eyebrow">Independent editorial desk</span>
            <span class="brand__name">AccountantToolkit</span>
            <span class="brand__tag">Software research for freelancers and bookkeepers</span>
          </span>
        </a>
        <nav class="site-nav" aria-label="Primary">
          <span class="site-nav__label">Browse</span>
          <div class="site-nav__links" id="site-nav-links">${navLinks}</div>
          <div class="site-nav__actions">
            <button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch color theme" aria-pressed="false"><span class="theme-toggle__icon" aria-hidden="true" data-icon="sun">\u2600</span><span class="theme-toggle__label">Dark mode</span></button>
            <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav-links">Menu</button>
          </div>
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
          <span class="footer__eyebrow">Independent product notes</span>
          <h2>AccountantToolkit</h2>
          <p>We publish pragmatic accounting, invoicing, and receipt-capture research for freelancers and bookkeepers who want clearer tradeoffs, faster decisions, and fewer vendor-driven detours.</p>
          <div class="footer__trust">
            <span>Static, fast pages</span>
            <span>2026 buyer-intent updates</span>
            <span>Independent editorial structure</span>
          </div>
          <p class="footer__meta">Read our <a href="/editorial-policy">editorial policy</a> and <a href="/affiliate-disclosure">affiliate disclosure</a> for how we research products, handle promotions, and label commercial relationships.</p>
          <p class="footer__meta">Corrections and business inquiries: <a href="mailto:hello@accountanttoolkit.com">hello@accountanttoolkit.com</a>.</p>
          <p class="footer__meta">Last rebuilt on ${formatReviewedDate(SITE_REBUILD_DATE)}.</p>
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
  initTagManager();
  initClarity();

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
  initThemeToggle();
  initAffiliateTracking();
  trackPageView();

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
    const reviewDate = document.body.dataset.reviewed || DEFAULT_REVIEW_DATE;

    if (articleBody && !articleBody.querySelector("[data-editorial-note]")) {
      const note = document.createElement("section");
      note.className = "callout callout--muted editorial-note";
      note.setAttribute("data-editorial-note", "true");
      note.innerHTML = `
        <p class="kicker">Editorial note</p>
        <p><strong>Last reviewed:</strong> ${formatReviewedDate(reviewDate)}. AccountantToolkit checks official vendor pages before making plan, trial, or pricing claims. When pricing is promotional, region-specific, or usage-based, we say so instead of freezing numbers that age badly.</p>
        <p>For details on how pages are updated and how commercial relationships are handled, see our <a href="/editorial-policy">editorial policy</a> and <a href="/affiliate-disclosure">affiliate disclosure</a>.</p>
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
