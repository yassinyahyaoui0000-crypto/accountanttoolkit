const PDFJS_MODULE_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.min.mjs";
const MAX_PREVIEW_ROWS = 12;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = "10 MB";
const ALLOWED_FILE_EXTENSIONS = new Set([".pdf", ".txt"]);
const PDF_MIME_TYPES = new Set(["application/pdf"]);
const TEXT_MIME_TYPES = new Set(["text/plain"]);
const DEFAULT_RESULTS_NOTE = "The preview shows the first rows from the generated CSV.";
const DEFAULT_INPUT_HINT = "If this box has text, Convert to CSV will use the pasted text instead of the selected file.";
const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}/,
  /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/,
  /^\d{1,2}[/-]\d{1,2}/,
  /^\d{1,2}\.\d{1,2}(?:\.\d{2,4})?/,
  /^\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*(?:\s+\d{2,4})?/i,
  /^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,?\s+\d{2,4})?/i
];
const AMOUNT_PATTERN = /(?:[$\u00A3\u20AC\u20A6]|USD|EUR|NGN)?\s*\(?[+-]?\d[\d,]*\.\d{2}\)?(?:\s?(?:CR|DR))?/gi;
const NEGATIVE_KEYWORDS = /(purchase|withdrawal|cash|payment|pos|debit|bill|charge|fee|transfer to|standing order|dd|direct debit|atm|card|sent|outgoing)/i;
const POSITIVE_KEYWORDS = /(deposit|salary|refund|credit|interest|received|inward|reversal|cashback|transfer from|incoming)/i;
const TOOL_ERROR_MESSAGES = {
  no_input: "Add a PDF statement or plain text before converting.",
  unsupported_file_type: "That file type is not supported yet. Use a PDF statement or a plain text file.",
  oversized_file: `That file is too large for the beta tool. Use a file under ${MAX_FILE_SIZE_LABEL} or paste the statement text instead.`,
  empty_extracted_text: "We could not find usable statement text in that file. This tool works best with text-based PDFs or pasted plain text.",
  no_transaction_rows: "We could not find transaction rows in that statement. Check that it contains transaction text, then try a different date order if needed.",
  pdf_parsing_failure: "We could not open that PDF. Try another text-based PDF or paste copied statement text instead.",
  text_read_failure: "We could not read that text file. Try another plain text export or paste the statement text instead."
};
const NEXT_STEP_RECOMMENDATIONS = [
  {
    product: "quickbooks",
    href: "https://quickbooks.intuit.com/online/",
    eyebrow: "Accounting handoff",
    title: "QuickBooks",
    badge: "Best for accountant familiarity",
    description: "Use QuickBooks when your accountant, clients, or downstream workflow already expects the Intuit ecosystem.",
    meta: "Check QuickBooks"
  },
  {
    product: "xero",
    href: "https://www.xero.com/us/",
    eyebrow: "Clean books",
    title: "Xero",
    badge: "Best for ongoing bookkeeping depth",
    description: "Xero is the stronger next step when the goal is cleaner reconciliation, reporting, and long-term bookkeeping structure.",
    meta: "Check Xero"
  },
  {
    product: "zoho-books",
    href: "https://www.zoho.com/us/books/",
    eyebrow: "Automation value",
    title: "Zoho Books",
    badge: "Best for automation and value",
    description: "Zoho Books makes sense when you want the CSV cleanup to flow into a more automated accounting setup without overpaying for familiarity.",
    meta: "Check Zoho Books"
  },
  {
    product: "dext",
    href: "https://www.dext.com/us/",
    eyebrow: "Document capture",
    title: "Dext",
    badge: "Best for receipt and document extraction",
    description: "Dext is the practical next tool when statement cleanup is only one part of a wider receipt, bill, and bookkeeping capture process.",
    meta: "Check Dext"
  }
];

let pdfjsModulePromise;

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/[\u2012\u2013\u2014\u2212]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function closeEnough(left, right) {
  return Math.abs(left - right) <= 0.02;
}

function formatMoney(value) {
  return typeof value === "number" && !Number.isNaN(value) ? value.toFixed(2) : "";
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function escapeCsvCell(value) {
  const normalized = value == null ? "" : String(value);

  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, "\"\"")}"`;
  }

  return normalized;
}

function inferKeywordSignedAmount(description, absoluteAmount) {
  if (typeof absoluteAmount !== "number" || Number.isNaN(absoluteAmount)) {
    return null;
  }

  if (POSITIVE_KEYWORDS.test(description)) {
    return absoluteAmount;
  }

  if (NEGATIVE_KEYWORDS.test(description)) {
    return -absoluteAmount;
  }

  return absoluteAmount;
}

function getExplicitDirection(rawToken) {
  const token = String(rawToken || "").toUpperCase();

  if (token.includes("DR") || token.includes("(") || token.includes("-")) {
    return -1;
  }

  if (token.includes("CR") || token.includes("+")) {
    return 1;
  }

  return 0;
}

function parseAmountToken(rawToken) {
  const token = normalizeWhitespace(rawToken).toUpperCase();
  const explicitDirection = getExplicitDirection(token);
  const unsigned = token
    .replace(/USD|EUR|NGN/g, "")
    .replace(/[$\u00A3\u20AC\u20A6]/g, "")
    .replace(/[(),\s]/g, "")
    .replace(/[+-]/g, "");
  const absolute = Number(unsigned);

  if (!Number.isFinite(absolute)) {
    return null;
  }

  return {
    raw: normalizeWhitespace(rawToken),
    explicitDirection,
    absolute,
    signed: explicitDirection === 0 ? null : explicitDirection * absolute
  };
}

function createToolError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function getFriendlyErrorMessage(error) {
  if (error && typeof error === "object" && "code" in error && TOOL_ERROR_MESSAGES[error.code]) {
    return TOOL_ERROR_MESSAGES[error.code];
  }

  return "The statement could not be parsed. Try another text-based PDF or paste plain text instead.";
}

function getFileExtension(filename) {
  const match = String(filename || "").toLowerCase().match(/(\.[a-z0-9]+)$/);
  return match ? match[1] : "";
}

function getFileKind(file) {
  const extension = getFileExtension(file?.name);
  const mimeType = String(file?.type || "").toLowerCase();

  if (PDF_MIME_TYPES.has(mimeType) || extension === ".pdf") {
    return "pdf";
  }

  if (TEXT_MIME_TYPES.has(mimeType) || extension === ".txt") {
    return "text";
  }

  return null;
}

function validateSelectedFile(file) {
  if (!file) {
    return null;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw createToolError("oversized_file");
  }

  const kind = getFileKind(file);

  if (!kind || !ALLOWED_FILE_EXTENSIONS.has(getFileExtension(file.name))) {
    throw createToolError("unsupported_file_type");
  }

  return kind;
}

function getMostLikelyDocumentYear(lines, fallbackYear) {
  const counts = new Map();

  lines.forEach((line) => {
    const matches = line.match(/\b20\d{2}\b/g) || [];
    matches.forEach((match) => {
      counts.set(match, (counts.get(match) || 0) + 1);
    });
  });

  const best = Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0];
  return best ? Number(best[0]) : fallbackYear;
}

function consumeLeadingDates(line) {
  let remainder = normalizeWhitespace(line);
  const dates = [];

  for (let index = 0; index < 2; index += 1) {
    const match = DATE_PATTERNS.map((pattern) => remainder.match(pattern)).find(Boolean);

    if (!match) {
      break;
    }

    dates.push(match[0]);
    remainder = normalizeWhitespace(remainder.slice(match[0].length).replace(/^[-:|]+/, ""));
  }

  return { dates, remainder };
}

function looksLikeTransactionStart(line) {
  return consumeLeadingDates(line).dates.length > 0;
}

function isNoiseLine(line) {
  const normalized = normalizeWhitespace(line).toLowerCase();

  if (!normalized) {
    return true;
  }

  if (/^page\s+\d+(?:\s+of\s+\d+)?$/.test(normalized)) {
    return true;
  }

  if (/^(statement|account|sort code|iban|bic|swift|branch address)\b/.test(normalized)) {
    return true;
  }

  if (/^date\b.*\b(description|details|debit|credit|balance)\b/.test(normalized)) {
    return true;
  }

  if (/^(continued on next page|transactions? continued|summary|opening balance|closing balance)\b/.test(normalized)) {
    return true;
  }

  return false;
}

function buildCandidates(lines) {
  const candidates = [];
  let current = null;

  lines.forEach((line) => {
    const normalized = normalizeWhitespace(line);

    if (!normalized || isNoiseLine(normalized)) {
      return;
    }

    if (looksLikeTransactionStart(normalized)) {
      if (current) {
        candidates.push(current.join(" "));
      }

      current = [normalized];
      return;
    }

    if (current) {
      current.push(normalized);
    }
  });

  if (current) {
    candidates.push(current.join(" "));
  }

  return candidates;
}

function normalizeMonthName(rawValue) {
  const value = rawValue.toLowerCase().slice(0, 3);
  const months = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12"
  };

  return months[value] || null;
}

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function normalizeDate(rawValue, defaultYear, dateOrder) {
  const value = normalizeWhitespace(rawValue);

  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const slashMatch = value.match(/^(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?$/);
  if (slashMatch) {
    const first = Number(slashMatch[1]);
    const second = Number(slashMatch[2]);
    const third = slashMatch[3];
    const year = third ? Number(third.length === 2 ? `20${third}` : third) : defaultYear;
    let month = null;
    let day = null;

    if (dateOrder === "month-first") {
      month = first;
      day = second;
    } else if (dateOrder === "day-first") {
      day = first;
      month = second;
    } else if (first > 12) {
      day = first;
      month = second;
    } else if (second > 12) {
      month = first;
      day = second;
    } else {
      day = first;
      month = second;
    }

    if (year && month && day) {
      return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
    }
  }

  const dayMonthMatch = value.match(/^(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{2,4}))?$/);
  if (dayMonthMatch) {
    const month = normalizeMonthName(dayMonthMatch[2]);
    const year = dayMonthMatch[3] ? Number(dayMonthMatch[3].length === 2 ? `20${dayMonthMatch[3]}` : dayMonthMatch[3]) : defaultYear;

    if (month && year) {
      return `${year}-${month}-${padDatePart(dayMonthMatch[1])}`;
    }
  }

  const monthDayMatch = value.match(/^([A-Za-z]+)\s+(\d{1,2})(?:,?\s+(\d{2,4}))?$/);
  if (monthDayMatch) {
    const month = normalizeMonthName(monthDayMatch[1]);
    const year = monthDayMatch[3] ? Number(monthDayMatch[3].length === 2 ? `20${monthDayMatch[3]}` : monthDayMatch[3]) : defaultYear;

    if (month && year) {
      return `${year}-${month}-${padDatePart(monthDayMatch[2])}`;
    }
  }

  return "";
}

function pickAmounts(parsedAmounts, description) {
  if (parsedAmounts.length === 0) {
    return { amount: null, amountAbsolute: null, debit: null, credit: null, balance: null };
  }

  if (parsedAmounts.length >= 3) {
    const trio = parsedAmounts.slice(-3);
    const [first, second, third] = trio;
    let debit = null;
    let credit = null;

    if (first.explicitDirection !== 0 || second.explicitDirection !== 0) {
      trio.slice(0, 2).forEach((item) => {
        if (item.explicitDirection < 0) {
          debit = item.absolute;
        }

        if (item.explicitDirection > 0) {
          credit = item.absolute;
        }
      });
    } else {
      if (first.absolute > 0) {
        debit = first.absolute;
      }

      if (second.absolute > 0) {
        credit = second.absolute;
      }
    }

    const amount = credit != null || debit != null ? roundMoney((credit || 0) - (debit || 0)) : null;

    return {
      amount,
      amountAbsolute: roundMoney(Math.abs(amount || 0)) || Math.max(first.absolute, second.absolute),
      debit,
      credit,
      balance: third.signed ?? third.absolute
    };
  }

  if (parsedAmounts.length === 2) {
    const [transactionAmount, balanceAmount] = parsedAmounts;

    return {
      amount: transactionAmount.signed,
      amountAbsolute: transactionAmount.absolute,
      debit: transactionAmount.explicitDirection < 0 ? transactionAmount.absolute : null,
      credit: transactionAmount.explicitDirection > 0 ? transactionAmount.absolute : null,
      balance: balanceAmount.signed ?? balanceAmount.absolute
    };
  }

  const [singleAmount] = parsedAmounts;

  return {
    amount: singleAmount.signed ?? inferKeywordSignedAmount(description, singleAmount.absolute),
    amountAbsolute: singleAmount.absolute,
    debit: singleAmount.explicitDirection < 0 ? singleAmount.absolute : null,
    credit: singleAmount.explicitDirection > 0 ? singleAmount.absolute : null,
    balance: null
  };
}

function parseCandidate(candidate, options, index) {
  const { dates, remainder } = consumeLeadingDates(candidate);

  if (!dates.length) {
    return null;
  }

  const amountMatches = Array.from(remainder.matchAll(AMOUNT_PATTERN));

  if (!amountMatches.length) {
    return null;
  }

  const parsedAmounts = amountMatches.map((match) => parseAmountToken(match[0])).filter(Boolean);

  if (!parsedAmounts.length) {
    return null;
  }

  const picked = pickAmounts(parsedAmounts, remainder);
  let description = remainder;

  amountMatches.slice().reverse().forEach((match) => {
    description = `${description.slice(0, match.index)} ${description.slice(match.index + match[0].length)}`;
  });

  description = normalizeWhitespace(description.replace(/\s{2,}/g, " ")) || "Statement row";

  return {
    row_order: index + 1,
    date_raw: dates[0] || "",
    date_iso: normalizeDate(dates[0] || "", options.defaultYear, options.dateOrder),
    posted_date_raw: dates[1] || "",
    posted_date_iso: dates[1] ? normalizeDate(dates[1], options.defaultYear, options.dateOrder) : "",
    description,
    amount: picked.amount,
    amount_absolute: picked.amountAbsolute,
    debit: picked.debit,
    credit: picked.credit,
    balance: picked.balance,
    transaction_type: picked.amount == null ? "unknown" : picked.amount < 0 ? "debit" : "credit",
    source_line: candidate
  };
}

function reconcileAmounts(rows) {
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];

    if (row.amount == null && typeof row.amount_absolute === "number" && typeof row.balance === "number") {
      const previous = rows[index - 1];

      if (previous && typeof previous.balance === "number") {
        const delta = roundMoney(row.balance - previous.balance);

        if (closeEnough(Math.abs(delta), row.amount_absolute)) {
          row.amount = delta;
        }
      }
    }

    if (row.amount == null && typeof row.credit === "number") {
      row.amount = row.credit;
    }

    if (row.amount == null && typeof row.debit === "number") {
      row.amount = -row.debit;
    }

    if (row.amount == null && typeof row.amount_absolute === "number") {
      row.amount = inferKeywordSignedAmount(row.description, row.amount_absolute);
    }

    row.amount = typeof row.amount === "number" ? roundMoney(row.amount) : null;
    row.transaction_type = row.amount == null ? "unknown" : row.amount < 0 ? "debit" : "credit";
  }

  return rows;
}

function parseStatementText(rawText, options) {
  const sourceLines = String(rawText || "")
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);
  const defaultYear = getMostLikelyDocumentYear(sourceLines, options.defaultYear);
  const candidates = buildCandidates(sourceLines);
  const parsedRows = candidates
    .map((candidate, index) => parseCandidate(candidate, { ...options, defaultYear }, index))
    .filter(Boolean);

  return reconcileAmounts(parsedRows);
}

function rowsToCsv(rows) {
  const headers = [
    "row_order",
    "date_raw",
    "date_iso",
    "posted_date_raw",
    "posted_date_iso",
    "description",
    "amount",
    "debit",
    "credit",
    "balance",
    "transaction_type",
    "source_line"
  ];
  const lines = [headers.join(",")];

  rows.forEach((row) => {
    lines.push(
      headers
        .map((header) => {
          const value = row[header];

          if (typeof value === "number") {
            return escapeCsvCell(value.toFixed(2));
          }

          return escapeCsvCell(value);
        })
        .join(",")
    );
  });

  return lines.join("\n");
}

async function loadPdfJs() {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = import(PDFJS_MODULE_URL);
  }

  return pdfjsModulePromise;
}

function groupItemsIntoLines(items) {
  const rows = [];
  const tolerance = 2.5;

  items
    .filter((item) => normalizeWhitespace(item.str))
    .map((item) => ({
      text: normalizeWhitespace(item.str),
      x: item.transform[4],
      y: item.transform[5],
      width: item.width || 0
    }))
    .sort((left, right) => {
      if (Math.abs(right.y - left.y) > tolerance) {
        return right.y - left.y;
      }

      return left.x - right.x;
    })
    .forEach((item) => {
      let row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= tolerance);

      if (!row) {
        row = { y: item.y, items: [] };
        rows.push(row);
      }

      row.items.push(item);
    });

  return rows
    .sort((left, right) => right.y - left.y)
    .map((row) => {
      const sortedItems = row.items.sort((left, right) => left.x - right.x);
      let line = "";
      let previous = null;

      sortedItems.forEach((item) => {
        if (previous) {
          const previousRight = previous.x + previous.width;
          const gap = item.x - previousRight;
          line += gap > 18 ? "  " : " ";
        }

        line += item.text;
        previous = item;
      });

      return normalizeWhitespace(line);
    })
    .filter(Boolean);
}

async function extractTextFromPdf(file, onProgress) {
  try {
    const pdfjs = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      disableWorker: true
    });
    const pdf = await loadingTask.promise;
    const lines = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      onProgress(`Reading page ${pageNumber} of ${pdf.numPages}...`);
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      lines.push(...groupItemsIntoLines(textContent.items));
    }

    return {
      text: lines.join("\n"),
      pageCount: pdf.numPages
    };
  } catch {
    throw createToolError("pdf_parsing_failure");
  }
}

async function extractTextFromTextFile(file) {
  try {
    return await file.text();
  } catch {
    throw createToolError("text_read_failure");
  }
}

function setStatus(elements, message, tone = "") {
  elements.status.textContent = message;

  if (tone) {
    elements.status.dataset.tone = tone;
  } else {
    delete elements.status.dataset.tone;
  }
}

function createTableMessageRow(columnCount, message) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");

  cell.colSpan = columnCount;
  cell.className = "statement-tool-empty";
  cell.textContent = message;
  row.append(cell);

  return row;
}

function setPreviewMessage(elements, message) {
  elements.previewBody.replaceChildren(createTableMessageRow(5, message));
}

function renderPreview(elements, rows) {
  const fragment = document.createDocumentFragment();

  rows.slice(0, MAX_PREVIEW_ROWS).forEach((row) => {
    const tableRow = document.createElement("tr");
    const dateCell = document.createElement("td");
    const descriptionCell = document.createElement("td");
    const amountCell = document.createElement("td");
    const balanceCell = document.createElement("td");
    const typeCell = document.createElement("td");

    dateCell.textContent = row.date_raw || "";
    descriptionCell.textContent = row.description || "";
    amountCell.textContent = formatMoney(row.amount);
    balanceCell.textContent = formatMoney(row.balance);
    typeCell.textContent = row.transaction_type || "";

    tableRow.append(dateCell, descriptionCell, amountCell, balanceCell, typeCell);
    fragment.append(tableRow);
  });

  if (!fragment.childNodes.length) {
    setPreviewMessage(elements, "No transactions matched the current parsing rules.");
    return;
  }

  elements.previewBody.replaceChildren(fragment);
}

function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function clearNativeFileInput(fileInput) {
  try {
    fileInput.value = "";
  } catch {
    // Ignore browsers that restrict direct resets in edge cases.
  }
}

function describeSelectedFile(file, kind) {
  const typeLabel = kind === "pdf" ? "PDF" : "Text";
  return `${file.name} (${typeLabel}, ${formatFileSize(file.size)})`;
}

function getInputModeState(elements, state) {
  const pastedText = elements.pasteInput.value.trim();

  if (pastedText && state.selectedFile) {
    const typeLabel = state.selectedFile.kind === "pdf" ? "PDF" : "text file";

    return {
      mode: "paste-overrides-file",
      usesPastedText: true,
      status: "Pasted text is ready. Convert to CSV will use the pasted text instead of the selected file.",
      hint: `Pasted text takes priority right now. Clear the text box to use the selected ${typeLabel} instead.`
    };
  }

  if (pastedText) {
    return {
      mode: "pasted-text",
      usesPastedText: true,
      status: "Pasted text is ready to convert.",
      hint: "Convert to CSV will use the pasted text in this box."
    };
  }

  if (state.selectedFile) {
    return {
      mode: "selected-file",
      usesPastedText: false,
      status: `Ready to parse ${state.selectedFile.file.name}. PDF and .txt files up to ${MAX_FILE_SIZE_LABEL} work best.`,
      hint: "Convert to CSV will use the selected file."
    };
  }

  return {
    mode: "empty",
    usesPastedText: false,
    status: "Upload a statement PDF or paste statement text to begin.",
    hint: DEFAULT_INPUT_HINT
  };
}

function syncInputModeUi(elements, state) {
  const inputMode = getInputModeState(elements, state);
  elements.inputHint.textContent = inputMode.hint;
  setStatus(elements, inputMode.status);
  return inputMode;
}

function clearComputedState(elements, state) {
  state.csv = "";
  state.filename = "";
  elements.results.hidden = true;
  elements.nextSteps.hidden = true;
  elements.count.textContent = "0";
  elements.balanceCount.textContent = "0";
  elements.source.textContent = "-";
  elements.downloadButton.disabled = true;
  elements.copyButton.disabled = true;
  elements.resultsNote.textContent = DEFAULT_RESULTS_NOTE;
  setPreviewMessage(elements, "Run the converter to see extracted rows here.");
}

function applySelectedFile(elements, state, file) {
  clearComputedState(elements, state);

  if (!file) {
    state.selectedFile = null;
    elements.fileLabel.textContent = "No file selected yet.";
    syncInputModeUi(elements, state);
    return false;
  }

  try {
    const kind = validateSelectedFile(file);
    state.selectedFile = { file, kind };
    elements.fileLabel.textContent = describeSelectedFile(file, kind);
    syncInputModeUi(elements, state);
    return true;
  } catch (error) {
    state.selectedFile = null;
    clearNativeFileInput(elements.fileInput);
    elements.fileLabel.textContent = "No valid file selected.";
    setStatus(elements, getFriendlyErrorMessage(error), "error");
    return false;
  }
}

function buildCsvFilename(file) {
  const base = file ? file.name.replace(/\.[^.]+$/, "") : "statement-export";
  return `${base}.csv`;
}

function renderNextStepRecommendations(elements) {
  const fragment = document.createDocumentFragment();

  NEXT_STEP_RECOMMENDATIONS.forEach((item) => {
    const card = document.createElement("a");
    const eyebrow = document.createElement("span");
    const title = document.createElement("h3");
    const badge = document.createElement("span");
    const description = document.createElement("p");
    const meta = document.createElement("div");

    card.className = "summary-card statement-tool-recommendation";
    card.href = item.href;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    eyebrow.className = "summary-card__eyebrow";
    eyebrow.textContent = item.eyebrow;

    title.textContent = item.title;
    title.dataset.product = item.product;

    badge.className = "best-for-badge";
    badge.textContent = item.badge;

    description.textContent = item.description;

    meta.className = "summary-card__meta";
    meta.textContent = item.meta;

    card.append(eyebrow, title, badge, description, meta);
    fragment.append(card);
  });

  elements.nextStepsGrid.replaceChildren(fragment);

  if (typeof window.decorateProductTokens === "function") {
    window.decorateProductTokens(elements.nextStepsGrid);
  }

  if (typeof window.normalizeAffiliateLinks === "function") {
    window.normalizeAffiliateLinks(elements.nextStepsGrid);
  }
}

function resetTool(elements, state) {
  clearNativeFileInput(elements.fileInput);
  state.selectedFile = null;
  clearComputedState(elements, state);
  elements.fileLabel.textContent = "No file selected yet.";
  elements.pasteInput.value = "";
  syncInputModeUi(elements, state);
}

function wireDropzone(elements, state) {
  ["dragenter", "dragover"].forEach((eventName) => {
    elements.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropzone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    elements.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropzone.classList.remove("is-dragging");
    });
  });

  elements.dropzone.addEventListener("drop", (event) => {
    const files = event.dataTransfer?.files;

    if (!files || !files.length) {
      return;
    }

    try {
      const transfer = new DataTransfer();
      transfer.items.add(files[0]);
      elements.fileInput.files = transfer.files;
    } catch {
      // Browsers may restrict programmatic FileList assignment. The in-memory file is still used.
    }

    applySelectedFile(elements, state, files[0]);
  });

  elements.fileInput.addEventListener("change", () => {
    applySelectedFile(elements, state, elements.fileInput.files?.[0] || null);
  });
}

function initStatementTool() {
  const root = document.querySelector("[data-statement-tool]");

  if (!root) {
    return;
  }

  const elements = {
    dropzone: root.querySelector("[data-dropzone]"),
    fileInput: document.getElementById("statement-file"),
    fileLabel: document.getElementById("statement-file-label"),
    dateOrder: document.getElementById("statement-date-order"),
    defaultYear: document.getElementById("statement-default-year"),
    pasteInput: document.getElementById("statement-paste"),
    runButton: document.getElementById("statement-run"),
    downloadButton: document.getElementById("statement-download"),
    copyButton: document.getElementById("statement-copy"),
    resetButton: document.getElementById("statement-reset"),
    status: document.getElementById("statement-status"),
    results: document.getElementById("statement-results"),
    nextSteps: document.getElementById("statement-next-steps"),
    nextStepsGrid: document.getElementById("statement-next-steps-grid"),
    previewBody: document.getElementById("statement-preview-body"),
    count: document.getElementById("statement-count"),
    balanceCount: document.getElementById("statement-balance-count"),
    source: document.getElementById("statement-source"),
    resultsNote: document.getElementById("statement-results-note"),
    inputHint: document.getElementById("statement-input-hint")
  };
  const state = {
    selectedFile: null,
    csv: "",
    filename: ""
  };

  renderNextStepRecommendations(elements);
  wireDropzone(elements, state);
  syncInputModeUi(elements, state);

  elements.pasteInput.addEventListener("input", () => {
    clearComputedState(elements, state);
    syncInputModeUi(elements, state);
  });

  elements.runButton.addEventListener("click", async () => {
    const inputMode = getInputModeState(elements, state);
    const pastedText = elements.pasteInput.value.trim();
    const defaultYear = Number(elements.defaultYear.value) || new Date().getFullYear();
    const dateOrder = elements.dateOrder.value || "auto";
    const usePastedText = inputMode.usesPastedText;
    let rawText = "";
    let sourceLabel = "Pasted text";
    let successPrefix = "Converted";

    if (!state.selectedFile && !pastedText) {
      setStatus(elements, getFriendlyErrorMessage(createToolError("no_input")), "error");
      return;
    }

    elements.runButton.disabled = true;
    setStatus(
      elements,
      usePastedText && state.selectedFile
        ? "Using the pasted text instead of the selected file..."
        : "Preparing the statement..."
    );

    try {
      if (usePastedText) {
        rawText = pastedText;
        sourceLabel = "Pasted text";
        successPrefix = "Converted the pasted text";
        elements.resultsNote.textContent = state.selectedFile
          ? `Previewing the first ${MAX_PREVIEW_ROWS} rows from pasted statement text. The selected file was ignored because pasted text takes priority.`
          : `Previewing the first ${MAX_PREVIEW_ROWS} rows from pasted statement text.`;
      } else if (state.selectedFile) {
        const { file, kind } = state.selectedFile;
        sourceLabel = kind === "pdf" ? "PDF upload" : "Text upload";
        successPrefix = kind === "pdf" ? "Converted the PDF" : "Converted the text file";

        if (kind === "pdf") {
          const pdfResult = await extractTextFromPdf(file, (message) => setStatus(elements, message));
          rawText = pdfResult.text;
          elements.resultsNote.textContent = `Previewing the first ${MAX_PREVIEW_ROWS} rows from a ${pdfResult.pageCount}-page PDF parse.`;
        } else {
          rawText = await extractTextFromTextFile(file);
          elements.resultsNote.textContent = `Previewing the first ${MAX_PREVIEW_ROWS} rows from a text import.`;
        }
      }

      if (!normalizeWhitespace(rawText)) {
        throw createToolError("empty_extracted_text");
      }

      setStatus(elements, "Parsing transactions...");
      const rows = parseStatementText(rawText, { defaultYear, dateOrder });

      if (!rows.length) {
        throw createToolError("no_transaction_rows");
      }

      state.csv = rowsToCsv(rows);
      state.filename = buildCsvFilename(usePastedText ? null : state.selectedFile?.file || null);
      elements.downloadButton.disabled = false;
      elements.copyButton.disabled = false;
      elements.results.hidden = false;
      elements.nextSteps.hidden = false;
      elements.count.textContent = String(rows.length);
      elements.balanceCount.textContent = String(rows.filter((row) => typeof row.balance === "number").length);
      elements.source.textContent = sourceLabel;
      renderPreview(elements, rows);
      setStatus(
        elements,
        `${successPrefix} into ${rows.length} rows. Review the preview before importing, then download the CSV.`,
        "success"
      );

      if (window.dataLayer) {
        window.dataLayer.push({
          event: "statement2csv_success",
          rows_found: rows.length,
          source: sourceLabel.toLowerCase().replace(/\s+/g, "_")
        });
      }
    } catch (error) {
      const message = getFriendlyErrorMessage(error);

      clearComputedState(elements, state);
      setStatus(elements, message, "error");

      if (window.dataLayer) {
        window.dataLayer.push({
          event: "statement2csv_error",
          error_message: message
        });
      }
    } finally {
      elements.runButton.disabled = false;
    }
  });

  elements.downloadButton.addEventListener("click", () => {
    if (state.csv) {
      downloadCsv(state.csv, state.filename || "statement-export.csv");
    }
  });

  elements.copyButton.addEventListener("click", async () => {
    if (!state.csv || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(state.csv);
      setStatus(elements, "CSV copied to the clipboard.", "success");
    } catch {
      setStatus(elements, "Clipboard access failed. Use Download CSV instead.", "error");
    }
  });

  elements.resetButton.addEventListener("click", () => {
    resetTool(elements, state);
  });
}

document.addEventListener("DOMContentLoaded", initStatementTool);
