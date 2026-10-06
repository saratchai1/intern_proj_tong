const DB_NAME = "my-qr-wallet";
const DB_VERSION = 1;
const STORE_NAME = "qr-items";
const ALL_CATEGORIES = "ทั้งหมด";
const DEFAULT_CATEGORY = "ทั่วไป";

const state = {
  items: [],
  editingId: null,
  viewingId: null,
  pendingImage: null,
  deferredInstallPrompt: null,
  activeCategory: ALL_CATEGORIES,
  scanFilledFields: new Set(),
  scanning: false,
  requestAccountId: null,
  requestQrDataUrl: null,
  requestQrPayload: null,
  requestRenderToken: 0,
  requestQrCache: new Map(),
  pendingQrPayload: null,
};

const els = {
  addBtn: document.querySelector("#addBtn"),
  emptyAddBtn: document.querySelector("#emptyAddBtn"),
  installBtn: document.querySelector("#installBtn"),
  emptyState: document.querySelector("#emptyState"),
  filteredEmptyState: document.querySelector("#filteredEmptyState"),
  qrGrid: document.querySelector("#qrGrid"),
  countLabel: document.querySelector("#countLabel"),
  categoryFilters: document.querySelector("#categoryFilters"),
  editorDialog: document.querySelector("#editorDialog"),
  editorTitle: document.querySelector("#editorTitle"),
  qrForm: document.querySelector("#qrForm"),
  bankInput: document.querySelector("#bankInput"),
  categoryInput: document.querySelector("#categoryInput"),
  labelInput: document.querySelector("#labelInput"),
  accountInput: document.querySelector("#accountInput"),
  accountNumberInput: document.querySelector("#accountNumberInput"),
  imageInput: document.querySelector("#imageInput"),
  imageHelp: document.querySelector("#imageHelp"),
  scanBtn: document.querySelector("#scanBtn"),
  clearScanBtn: document.querySelector("#clearScanBtn"),
  scanStatus: document.querySelector("#scanStatus"),
  scanStatusTitle: document.querySelector("#scanStatusTitle"),
  scanStatusText: document.querySelector("#scanStatusText"),
  scanSpinner: document.querySelector("#scanSpinner"),
  previewWrap: document.querySelector("#previewWrap"),
  imagePreview: document.querySelector("#imagePreview"),
  cancelEditorBtn: document.querySelector("#cancelEditorBtn"),
  closeEditorBtn: document.querySelector("#closeEditorBtn"),
  viewerDialog: document.querySelector("#viewerDialog"),
  viewerBank: document.querySelector("#viewerBank"),
  viewerCategory: document.querySelector("#viewerCategory"),
  viewerLabel: document.querySelector("#viewerLabel"),
  viewerAccount: document.querySelector("#viewerAccount"),
  viewerAccountNumberRow: document.querySelector("#viewerAccountNumberRow"),
  viewerAccountNumber: document.querySelector("#viewerAccountNumber"),
  copyViewerAccountBtn: document.querySelector("#copyViewerAccountBtn"),
  viewerImage: document.querySelector("#viewerImage"),
  viewerQrWrap: document.querySelector("#viewerQrWrap"),
  closeViewerBtn: document.querySelector("#closeViewerBtn"),
  fullscreenBtn: document.querySelector("#fullscreenBtn"),
  shareBtn: document.querySelector("#shareBtn"),
  requestFromViewerBtn: document.querySelector("#requestFromViewerBtn"),
  editBtn: document.querySelector("#editBtn"),
  deleteBtn: document.querySelector("#deleteBtn"),
  requestMoneyBtn: document.querySelector("#requestMoneyBtn"),
  requestDialog: document.querySelector("#requestDialog"),
  requestForm: document.querySelector("#requestForm"),
  closeRequestBtn: document.querySelector("#closeRequestBtn"),
  requestAccountSelect: document.querySelector("#requestAccountSelect"),
  requestAccountSummary: document.querySelector("#requestAccountSummary"),
  requestAccountLabel: document.querySelector("#requestAccountLabel"),
  requestAccountMeta: document.querySelector("#requestAccountMeta"),
  copyRequestAccountBtn: document.querySelector("#copyRequestAccountBtn"),
  requestAmountInput: document.querySelector("#requestAmountInput"),
  requestNoteInput: document.querySelector("#requestNoteInput"),
  requestPreview: document.querySelector("#requestPreview"),
  requestPreviewLabel: document.querySelector("#requestPreviewLabel"),
  requestPreviewBank: document.querySelector("#requestPreviewBank"),
  requestPreviewAmount: document.querySelector("#requestPreviewAmount"),
  requestPreviewQr: document.querySelector("#requestPreviewQr"),
  requestPreviewName: document.querySelector("#requestPreviewName"),
  requestPreviewNumberRow: document.querySelector("#requestPreviewNumberRow"),
  requestPreviewNumber: document.querySelector("#requestPreviewNumber"),
  requestPreviewNoteRow: document.querySelector("#requestPreviewNoteRow"),
  requestPreviewNote: document.querySelector("#requestPreviewNote"),
  dynamicQrStatus: document.querySelector("#dynamicQrStatus"),
  dynamicQrDot: document.querySelector("#dynamicQrDot"),
  dynamicQrTitle: document.querySelector("#dynamicQrTitle"),
  dynamicQrText: document.querySelector("#dynamicQrText"),
  copyRequestTextBtn: document.querySelector("#copyRequestTextBtn"),
  shareRequestBtn: document.querySelector("#shareRequestBtn"),
  toast: document.querySelector("#toast"),
};

function uid() {
  return crypto.randomUUID?.() || `qr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeCategory(item) {
  return item?.category?.trim() || DEFAULT_CATEGORY;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function setScanStatus(title, text = "", busy = false) {
  els.scanStatus.classList.remove("hidden");
  els.scanStatusTitle.textContent = title;
  els.scanStatusText.textContent = text;
  els.scanSpinner.classList.toggle("hidden", !busy);
}

function markSmartFilled(element, key) {
  if (!element) return;
  element.classList.add("smart-filled");
  state.scanFilledFields.add(key);
  clearTimeout(element.smartFilledTimer);
  element.smartFilledTimer = setTimeout(() => element.classList.remove("smart-filled"), 3200);
}

function setSmartValue(key, value, { overwrite = false } = {}) {
  const map = {
    bank: els.bankInput,
    label: els.labelInput,
    account: els.accountInput,
    accountNumber: els.accountNumberInput,
    category: els.categoryInput,
  };
  const element = map[key];
  if (!element || value == null || String(value).trim() === "") return false;
  if (!overwrite && String(element.value || "").trim()) return false;
  element.value = String(value).trim();
  markSmartFilled(element, key);
  return true;
}

function cleanOcrLine(line) {
  return String(line || "")
    .replace(/[|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectBank(text) {
  const normalized = String(text || "").toLowerCase();
  const banks = [
    { value: "SCB", terms: ["scb", "ไทยพาณิชย์", "siam commercial"] },
    { value: "KBank", terms: ["kbank", "kasikorn", "กสิกรไทย", "กสิกร"] },
    { value: "Krungthai", terms: ["krungthai", "krung thai", "กรุงไทย", "ktb"] },
    { value: "Bangkok Bank", terms: ["bangkok bank", "ธนาคารกรุงเทพ", "bbl"] },
    { value: "Krungsri", terms: ["krungsri", "กรุงศรี", "ayudhya"] },
    { value: "ttb", terms: ["ttb", "ทีเอ็มบีธนชาต", "ทหารไทยธนชาต", "ทีทีบี"] },
    { value: "Government Savings Bank", terms: ["ออมสิน", "government savings", "gsb"] },
    { value: "PromptPay", terms: ["promptpay", "พร้อมเพย์", "พร้อม pay"] },
  ];

  for (const bank of banks) {
    if (bank.terms.some((term) => normalized.includes(term.toLowerCase()))) return bank.value;
  }
  return "";
}

function scoreAccountCandidate(raw, line, lineIndex) {
  const compact = raw.replace(/\s/g, "");
  const digits = (compact.match(/\d/g) || []).length;
  const masks = (compact.match(/[xX*•]/g) || []).length;
  if (digits + masks < 8 || digits + masks > 16) return null;

  let score = 0;
  const lowerLine = line.toLowerCase();
  if (/เลข(ที่)?บัญชี|account\s*(no|number)|a\/c/.test(lowerLine)) score += 8;
  if (/บัญชี/.test(lowerLine)) score += 3;
  if (/โทร|phone|mobile|promptpay|พร้อมเพย์/.test(lowerLine)) score -= 4;
  if (/บาท|thb|ยอด|amount/.test(lowerLine)) score -= 5;
  if (/[-–—]/.test(compact)) score += 2;
  if (digits + masks === 10) score += 2;
  if (/^0\d{9}$/.test(compact.replace(/[-–—]/g, ""))) score -= 2;
  score -= lineIndex * 0.01;

  return { value: compact.replace(/[–—]/g, "-"), score };
}

function extractAccountNumber(lines) {
  const candidates = [];
  lines.forEach((line, lineIndex) => {
    const matches = line.match(/[0-9xX*•][0-9xX*•\-–—\s]{6,24}[0-9xX*•]/g) || [];
    for (const raw of matches) {
      const candidate = scoreAccountCandidate(raw, line, lineIndex);
      if (candidate) candidates.push(candidate);
    }
  });
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.value || "";
}

function extractAccountName(lines) {
  const keyword = /ชื่อบัญชี|ชื่อผู้รับ|account\s*name|beneficiary|recipient/i;
  const bad = /ธนาคาร|bank|เลขบัญชี|account\s*(no|number)|พร้อมเพย์|promptpay|จำนวนเงิน|amount|บาท|thb|qr/i;
  const honorific = /^(นาย|นางสาว|นาง|คุณ|ดร\.?|mr\.?|mrs\.?|ms\.?|บริษัท|บจก\.?|หจก\.?)/i;

  for (let i = 0; i < lines.length; i += 1) {
    if (!keyword.test(lines[i])) continue;
    const sameLine = cleanOcrLine(lines[i].replace(keyword, ""));
    if (sameLine.length >= 3 && !bad.test(sameLine)) return sameLine;
    const next = cleanOcrLine(lines[i + 1]);
    if (next.length >= 3 && !bad.test(next)) return next;
  }

  const preferred = lines.find((line) => {
    const clean = cleanOcrLine(line);
    return honorific.test(clean) && clean.length >= 5 && clean.length <= 80 && !bad.test(clean);
  });
  return preferred ? cleanOcrLine(preferred) : "";
}

function suggestCategory(accountName) {
  if (/บริษัท|บจก|หจก|company|co\.?\s*[,]?\s*ltd|ร้าน/i.test(accountName || "")) return "ร้านค้า";
  return "";
}

function lastVisibleDigits(value) {
  const digits = String(value || "").match(/\d/g) || [];
  return digits.slice(-4).join("");
}

async function prepareImageForOcr(dataUrl) {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();

  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, width, height);

  const pixels = ctx.getImageData(0, 0, width, height);
  const data = pixels.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    const boosted = Math.max(0, Math.min(255, (gray - 128) * 1.22 + 128));
    data[i] = boosted;
    data[i + 1] = boosted;
    data[i + 2] = boosted;
  }
  ctx.putImageData(pixels, 0, 0);

  return canvas.toDataURL("image/jpeg", 0.92);
}

async function detectQrPayload(dataUrl) {
  try {
    if ("BarcodeDetector" in window) {
      const supported = await BarcodeDetector.getSupportedFormats?.();
      if (!supported || supported.includes("qr_code")) {
        const detector = new BarcodeDetector({ formats: ["qr_code"] });
        const image = new Image();
        image.src = dataUrl;
        await image.decode();
        const results = await detector.detect(image);
        if (results[0]?.rawValue) return results[0].rawValue;
      }
    }
  } catch {
    // Fall through to jsQR for broader browser support.
  }

  if (!window.jsQR) return "";

  try {
    const image = new Image();
    image.src = dataUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = window.jsQR(pixels.data, pixels.width, pixels.height, {
      inversionAttempts: "attemptBoth",
    });
    return result?.data || "";
  } catch {
    return "";
  }
}

function promptPayFromPayload(payload) {
  const value = String(payload || "").toUpperCase();
  return value.includes("A000000677010111") || value.includes("PROMPTPAY");
}

async function runSmartScan() {
  if (!state.pendingImage || state.scanning) return;
  if (!window.Tesseract?.recognize) {
    setScanStatus("โหลด AI OCR ไม่สำเร็จ", "เชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่อีกครั้ง");
    return;
  }

  state.scanning = true;
  els.scanBtn.disabled = true;
  els.clearScanBtn.classList.add("hidden");
  setScanStatus("กำลังอ่านภาพ…", "กำลังตรวจ QR และเตรียมภาพ", true);

  try {
    const qrPayload = await detectQrPayload(state.pendingImage);
    state.pendingQrPayload = qrPayload || null;
    const ocrImage = await prepareImageForOcr(state.pendingImage);

    const result = await window.Tesseract.recognize(ocrImage, "tha+eng", {
      logger(message) {
        if (message.status === "recognizing text" && Number.isFinite(message.progress)) {
          const percent = Math.max(1, Math.round(message.progress * 100));
          setScanStatus("กำลังอ่านข้อความ…", `${percent}% — ครั้งแรกอาจใช้เวลาสักครู่เพื่อโหลดโมเดลภาษา`, true);
        }
      },
    });

    const rawText = result?.data?.text || "";
    const lines = rawText.split(/\r?\n/).map(cleanOcrLine).filter(Boolean);
    const bank = promptPayFromPayload(qrPayload) ? "PromptPay" : detectBank(rawText);
    const accountNumber = extractAccountNumber(lines);
    const account = extractAccountName(lines);
    const category = suggestCategory(account);

    let filled = 0;
    if (bank && els.bankInput.value !== bank) {
      els.bankInput.value = bank;
      markSmartFilled(els.bankInput, "bank");
      filled += 1;
    }
    if (account && setSmartValue("account", account)) filled += 1;
    if (accountNumber && setSmartValue("accountNumber", accountNumber)) filled += 1;
    if (category && els.categoryInput.value === DEFAULT_CATEGORY && setSmartValue("category", category, { overwrite: true })) filled += 1;

    if (!els.labelInput.value.trim()) {
      const suffix = lastVisibleDigits(accountNumber);
      const label = bank ? `${bank}${suffix ? ` • ${suffix}` : ""}` : "";
      if (label && setSmartValue("label", label)) filled += 1;
    }

    els.clearScanBtn.classList.toggle("hidden", state.scanFilledFields.size === 0);

    const qrMessage = qrPayload
      ? (promptPayFromPayload(qrPayload) ? "พบ PromptPay QR" : "พบ QR")
      : "ไม่พบ QR ที่เบราว์เซอร์อ่านได้";

    if (filled > 0) {
      setScanStatus(
        `อ่านสำเร็จ • เติมให้ ${filled} ช่อง`,
        `${qrMessage} — กรุณาตรวจชื่อและเลขบัญชีก่อนบันทึก`,
        false,
      );
      showToast("Smart Scan เติมข้อมูลให้แล้ว");
    } else {
      setScanStatus(
        "อ่านภาพเสร็จแล้ว",
        `${qrMessage} แต่ยังไม่พบข้อมูลที่มั่นใจพอให้กรอกอัตโนมัติ กรุณากรอกเองหรือใช้ภาพที่ชัดขึ้น`,
        false,
      );
    }
  } catch (error) {
    console.error("Smart Scan failed", error);
    setScanStatus(
      "อ่านภาพไม่สำเร็จ",
      "ลองใช้ screenshot ที่คมชัดขึ้น หรือลองใหม่เมื่อเชื่อมต่ออินเทอร์เน็ตเพื่อโหลดโมเดล OCR",
      false,
    );
  } finally {
    state.scanning = false;
    els.scanBtn.disabled = !state.pendingImage;
  }
}

function clearSmartScanResults() {
  const map = {
    bank: els.bankInput,
    label: els.labelInput,
    account: els.accountInput,
    accountNumber: els.accountNumberInput,
    category: els.categoryInput,
  };

  for (const key of state.scanFilledFields) {
    const element = map[key];
    if (!element) continue;
    if (key === "bank") element.value = "PromptPay";
    else if (key === "category") element.value = DEFAULT_CATEGORY;
    else element.value = "";
    element.classList.remove("smart-filled");
  }

  state.scanFilledFields.clear();
  els.clearScanBtn.classList.add("hidden");
  els.scanStatus.classList.add("hidden");
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbGetAll() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function dbPut(item) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(item);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDelete(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

function itemById(id) {
  return state.items.find((item) => item.id === id);
}

function renderCategoryFilters() {
  const categories = [...new Set(state.items.map(normalizeCategory))]
    .sort((a, b) => a.localeCompare(b, "th"));

  if (state.activeCategory !== ALL_CATEGORIES && !categories.includes(state.activeCategory)) {
    state.activeCategory = ALL_CATEGORIES;
  }

  els.categoryFilters.replaceChildren();
  els.categoryFilters.classList.toggle("hidden", state.items.length === 0);

  if (state.items.length === 0) return;

  for (const category of [ALL_CATEGORIES, ...categories]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-filter";
    button.textContent = category;
    button.setAttribute("aria-pressed", String(state.activeCategory === category));

    if (state.activeCategory === category) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      state.activeCategory = category;
      render();
    });

    els.categoryFilters.append(button);
  }
}

function render() {
  const allItems = [...state.items].sort((a, b) => b.updatedAt - a.updatedAt);
  renderCategoryFilters();

  const items = state.activeCategory === ALL_CATEGORIES
    ? allItems
    : allItems.filter((item) => normalizeCategory(item) === state.activeCategory);

  els.qrGrid.replaceChildren();

  els.countLabel.textContent = state.activeCategory === ALL_CATEGORIES
    ? `${allItems.length} รายการ`
    : `${items.length}/${allItems.length} รายการ`;

  const hasAny = allItems.length > 0;
  const hasVisible = items.length > 0;

  els.emptyState.classList.toggle("hidden", hasAny);
  els.filteredEmptyState.classList.toggle("hidden", !hasAny || hasVisible);
  els.qrGrid.classList.toggle("hidden", !hasVisible);

  for (const item of items) {
    const card = document.createElement("article");
    card.className = "qr-card";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "qr-card-main";
    openButton.setAttribute("aria-label", `เปิด ${item.label}`);

    const thumb = document.createElement("div");
    thumb.className = "qr-thumb";

    const image = document.createElement("img");
    image.src = item.image;
    image.alt = `QR ${item.label}`;
    thumb.append(image);

    const meta = document.createElement("div");
    meta.className = "qr-card-meta";

    const tags = document.createElement("div");
    tags.className = "card-tags";

    const bank = document.createElement("span");
    bank.className = "bank-pill";
    bank.textContent = item.bank;

    const category = document.createElement("span");
    category.className = "category-pill";
    category.textContent = normalizeCategory(item);

    tags.append(bank, category);

    const title = document.createElement("h3");
    title.textContent = item.label;

    meta.append(tags, title);

    if (item.account) {
      const account = document.createElement("p");
      account.textContent = item.account;
      meta.append(account);
    }

    if (item.accountNumber) {
      const accountNumber = document.createElement("p");
      accountNumber.className = "account-number";
      accountNumber.textContent = item.accountNumber;
      meta.append(accountNumber);
    }

    openButton.append(thumb, meta);
    openButton.addEventListener("click", () => openViewer(item.id));
    card.append(openButton);

    if (item.accountNumber) {
      const actions = document.createElement("div");
      actions.className = "qr-card-actions";

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "btn btn-secondary btn-card-copy";
      copyButton.textContent = "คัดลอกเลขบัญชี";
      copyButton.addEventListener("click", () => copyAccountNumber(item));

      actions.append(copyButton);
      card.append(actions);
    }

    els.qrGrid.append(card);
  }
}

function resetEditor() {
  state.editingId = null;
  state.pendingImage = null;
  state.pendingQrPayload = null;
  state.scanFilledFields.clear();
  state.scanning = false;
  els.editorTitle.textContent = "เพิ่ม QR";
  els.qrForm.reset();
  els.bankInput.value = "PromptPay";
  els.categoryInput.value = DEFAULT_CATEGORY;
  els.previewWrap.classList.add("hidden");
  els.imagePreview.removeAttribute("src");
  els.imageInput.required = true;
  els.imageHelp.textContent = "รองรับ PNG, JPG, WebP — ภาพชัดจะอ่านได้แม่นกว่า";
  els.scanBtn.disabled = true;
  els.clearScanBtn.classList.add("hidden");
  els.scanStatus.classList.add("hidden");
  els.scanSpinner.classList.add("hidden");
}

function openEditor(id = null) {
  resetEditor();

  if (id) {
    const item = itemById(id);
    if (!item) return;
    state.editingId = id;
    state.pendingImage = item.image;
    state.pendingQrPayload = item.qrPayload || null;
    els.editorTitle.textContent = "แก้ไข QR";
    els.bankInput.value = item.bank;
    els.categoryInput.value = normalizeCategory(item);
    els.labelInput.value = item.label;
    els.accountInput.value = item.account || "";
    els.accountNumberInput.value = item.accountNumber || "";
    els.imageInput.required = false;
    els.imageHelp.textContent = "ไม่ต้องเลือกรูปใหม่ หากต้องการใช้ QR เดิม หรือกด Smart Scan เพื่ออ่านใหม่";
    els.imagePreview.src = item.image;
    els.previewWrap.classList.remove("hidden");
    els.scanBtn.disabled = false;
  }

  els.editorDialog.showModal();
}

function openViewer(id) {
  const item = itemById(id);
  if (!item) return;

  state.viewingId = id;
  els.viewerBank.textContent = item.bank;
  els.viewerCategory.textContent = normalizeCategory(item);
  els.viewerLabel.textContent = item.label;
  els.viewerAccount.textContent = item.account || "";
  els.viewerAccount.classList.toggle("hidden", !item.account);

  els.viewerAccountNumber.textContent = item.accountNumber
    ? `เลขบัญชี ${item.accountNumber}`
    : "";
  els.viewerAccountNumberRow.classList.toggle("hidden", !item.accountNumber);

  els.viewerImage.src = item.image;
  els.viewerDialog.showModal();
}

function closeViewer() {
  state.viewingId = null;
  els.viewerDialog.close();
}

async function copyText(text, successMessage = "คัดลอกแล้ว") {
  const value = String(text || "").trim();
  if (!value) {
    showToast("ไม่มีข้อมูลให้คัดลอก");
    return false;
  }

  try {
    await navigator.clipboard.writeText(value);
    showToast(successMessage);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();

    if (copied) {
      showToast(successMessage);
      return true;
    }

    showToast("คัดลอกไม่สำเร็จ");
    return false;
  }
}

function accountNumberForClipboard(item) {
  const raw = String(item?.accountNumber || "").trim();
  if (!raw) return "";
  if (/[xX*•]/.test(raw)) return raw;
  const digits = raw.replace(/\D/g, "");
  return digits || raw;
}

function copyAccountNumber(item) {
  const value = accountNumberForClipboard(item);
  if (!value) {
    showToast("บัญชีนี้ยังไม่มีเลขบัญชี");
    return;
  }

  const masked = /[xX*•]/.test(value);
  copyText(
    value,
    masked ? "คัดลอกเลขที่แสดงแล้ว (มีตัวปิดบัง)" : "คัดลอกเลขบัญชีแล้ว",
  );
}

function setDynamicQrStatus(mode, title, text) {
  els.dynamicQrStatus.dataset.mode = mode;
  els.dynamicQrTitle.textContent = title;
  els.dynamicQrText.textContent = text;
}

function parseEmvTlv(payload) {
  const value = String(payload || "").trim();
  const fields = [];
  let cursor = 0;

  while (cursor + 4 <= value.length) {
    const tag = value.slice(cursor, cursor + 2);
    const lengthText = value.slice(cursor + 2, cursor + 4);
    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(lengthText)) return null;

    const length = Number(lengthText);
    const start = cursor + 4;
    const end = start + length;
    if (end > value.length) return null;

    fields.push({ tag, value: value.slice(start, end) });
    cursor = end;
  }

  return cursor === value.length ? fields : null;
}

function encodeEmvField(tag, value) {
  const text = String(value);
  const length = text.length;
  if (length > 99) throw new Error("EMV field too long");
  return `${tag}${String(length).padStart(2, "0")}${text}`;
}

function crc16CcittFalse(text) {
  let crc = 0xffff;

  for (let i = 0; i < text.length; i += 1) {
    crc ^= text.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function isPromptPayPayload(payload) {
  const fields = parseEmvTlv(payload);
  if (!fields) return false;

  return fields.some(({ tag, value }) =>
    tag === "29" && /A00000067701011[14]/.test(value),
  );
}

function amountForPromptPay(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  const fixed = amount.toFixed(2);
  if (fixed.length > 13) return "";
  return fixed;
}

function buildPromptPayAmountPayload(payload, amountValue) {
  const amount = amountForPromptPay(amountValue);
  if (!amount) throw new Error("INVALID_AMOUNT");

  const parsed = parseEmvTlv(String(payload || "").trim());
  if (!parsed || !isPromptPayPayload(payload)) throw new Error("NOT_PROMPTPAY");

  const fields = parsed.filter(({ tag }) => tag !== "63" && tag !== "54");
  let hasPoi = false;

  for (const field of fields) {
    if (field.tag === "01") {
      field.value = "12";
      hasPoi = true;
    }
  }

  if (!hasPoi) {
    const payloadIndex = fields.findIndex(({ tag }) => tag > "01");
    const poiField = { tag: "01", value: "12" };
    if (payloadIndex >= 0) fields.splice(payloadIndex, 0, poiField);
    else fields.push(poiField);
  }

  const amountField = { tag: "54", value: amount };
  const currencyIndex = fields.findIndex(({ tag }) => tag === "53");
  if (currencyIndex >= 0) fields.splice(currencyIndex + 1, 0, amountField);
  else {
    const nextIndex = fields.findIndex(({ tag }) => tag > "54");
    if (nextIndex >= 0) fields.splice(nextIndex, 0, amountField);
    else fields.push(amountField);
  }

  const withoutCrc = fields.map(({ tag, value }) => encodeEmvField(tag, value)).join("");
  const crcInput = `${withoutCrc}6304`;
  return `${crcInput}${crc16CcittFalse(crcInput)}`;
}

function qrDataUrlFromPayload(payload) {
  if (!window.qrcode) throw new Error("QR_GENERATOR_UNAVAILABLE");
  const qr = window.qrcode(0, "M");
  qr.addData(payload, "Byte");
  qr.make();
  return qr.createDataURL(8, 4);
}

async function resolveRequestQrPayload(item) {
  if (!item) return "";

  if (item.qrPayload && isPromptPayPayload(item.qrPayload)) {
    return item.qrPayload;
  }

  if (state.requestQrCache.has(item.id)) {
    return state.requestQrCache.get(item.id) || "";
  }

  const decoded = await detectQrPayload(item.image);
  const promptPayPayload = decoded && isPromptPayPayload(decoded) ? decoded : "";
  state.requestQrCache.set(item.id, promptPayPayload);
  return promptPayPayload;
}

function formatAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: amount % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function populateRequestAccounts(preferredId = null) {
  const items = [...state.items].sort((a, b) => b.updatedAt - a.updatedAt);
  els.requestAccountSelect.replaceChildren();

  for (const item of items) {
    const option = document.createElement("option");
    option.value = item.id;
    const suffix = item.accountNumber
      ? ` • ${String(item.accountNumber).replace(/\s/g, "").slice(-6)}`
      : "";
    option.textContent = `${item.label} — ${item.bank}${suffix}`;
    els.requestAccountSelect.append(option);
  }

  const preferred = preferredId && items.some((item) => item.id === preferredId)
    ? preferredId
    : items[0]?.id;

  if (preferred) {
    els.requestAccountSelect.value = preferred;
    state.requestAccountId = preferred;
  }
}

function selectedRequestItem() {
  return itemById(els.requestAccountSelect.value || state.requestAccountId);
}

function buildRequestText(item) {
  if (!item) return "";

  const amount = formatAmount(els.requestAmountInput.value);
  const note = els.requestNoteInput.value.trim();
  const lines = [];

  lines.push(amount ? `ขอรับเงิน ฿${amount}` : "ขอรับเงิน");
  lines.push(`เข้าบัญชี: ${item.label}`);
  lines.push(`ธนาคาร/ประเภท: ${item.bank}`);
  if (item.account) lines.push(`ชื่อบัญชี: ${item.account}`);
  if (item.accountNumber) lines.push(`เลขบัญชี: ${item.accountNumber}`);
  if (note) lines.push(`รายละเอียด: ${note}`);
  lines.push("กรุณาตรวจชื่อผู้รับในแอปธนาคารก่อนยืนยันการโอน");

  return lines.join("\n");
}

async function updateRequestPreview() {
  const renderToken = ++state.requestRenderToken;
  const item = selectedRequestItem();

  state.requestQrDataUrl = null;
  state.requestQrPayload = null;

  if (!item) {
    els.requestAccountSummary.classList.add("hidden");
    els.requestPreview.classList.add("hidden");
    setDynamicQrStatus("idle", "QR เดิม", "เลือกบัญชีเพื่อสร้างคำขอรับเงิน");
    return;
  }

  state.requestAccountId = item.id;

  const amount = formatAmount(els.requestAmountInput.value);
  const note = els.requestNoteInput.value.trim();

  els.requestAccountSummary.classList.remove("hidden");
  els.requestAccountLabel.textContent = item.label;
  els.requestAccountMeta.textContent = [
    item.bank,
    item.account || "",
    item.accountNumber || "",
  ].filter(Boolean).join(" • ");
  els.copyRequestAccountBtn.classList.toggle("hidden", !item.accountNumber);

  els.requestPreview.classList.remove("hidden");
  els.requestPreviewLabel.textContent = item.label;
  els.requestPreviewBank.textContent = item.bank;
  els.requestPreviewAmount.textContent = amount ? `฿${amount}` : "";
  els.requestPreviewQr.src = item.image;
  els.requestPreviewName.textContent = item.account || "-";
  els.requestPreviewNumber.textContent = item.accountNumber || "-";
  els.requestPreviewNumberRow.classList.toggle("hidden", !item.accountNumber);
  els.requestPreviewNote.textContent = note;
  els.requestPreviewNoteRow.classList.toggle("hidden", !note);

  if (!amount) {
    state.requestQrDataUrl = item.image;
    setDynamicQrStatus(
      "idle",
      "QR เดิม • ยังไม่ล็อกยอด",
      "ใส่จำนวนเงินเพื่อให้ระบบสร้าง PromptPay QR ที่ฝังยอดไว้ใน QR",
    );
    return;
  }

  const promptPayAmount = amountForPromptPay(els.requestAmountInput.value);
  if (!promptPayAmount) {
    state.requestQrDataUrl = item.image;
    setDynamicQrStatus(
      "warning",
      "จำนวนเงินใช้สร้าง QR ไม่ได้",
      "กรุณาใช้จำนวนเงินมากกว่า 0 และไม่ยาวเกินมาตรฐาน Thai QR",
    );
    return;
  }

  setDynamicQrStatus("loading", "กำลังสร้าง QR ล็อกยอด…", "กำลังอ่าน PromptPay payload จาก QR ที่บันทึกไว้");

  try {
    const basePayload = await resolveRequestQrPayload(item);
    if (renderToken !== state.requestRenderToken) return;

    if (!basePayload) {
      state.requestQrDataUrl = item.image;
      setDynamicQrStatus(
        "warning",
        "ล็อกยอดใน QR ไม่ได้",
        "QR นี้อ่านไม่พบ PromptPay payload จึงแสดง QR เดิม และใส่ยอดไว้ในข้อความเรียกเก็บแทน",
      );
      return;
    }

    const dynamicPayload = buildPromptPayAmountPayload(basePayload, els.requestAmountInput.value);
    const dynamicQr = qrDataUrlFromPayload(dynamicPayload);
    if (renderToken !== state.requestRenderToken) return;

    state.requestQrPayload = dynamicPayload;
    state.requestQrDataUrl = dynamicQr;
    els.requestPreviewQr.src = dynamicQr;

    setDynamicQrStatus(
      "success",
      `PromptPay QR ล็อกยอด ฿${amount}`,
      "ยอดถูกฝังใน Tag 54 ของ Thai QR Payment และสร้าง CRC ใหม่แล้ว กรุณาตรวจชื่อผู้รับในแอปธนาคารก่อนยืนยัน",
    );
  } catch (error) {
    console.error("Dynamic PromptPay QR failed", error);
    state.requestQrDataUrl = item.image;
    setDynamicQrStatus(
      "warning",
      "สร้าง QR ล็อกยอดไม่สำเร็จ",
      "กำลังใช้ QR เดิมแทน กรุณาตรวจและกรอกยอดในแอปธนาคารก่อนยืนยัน",
    );
  }
}

function openRequestDialog(preferredId = null) {
  if (state.items.length === 0) {
    showToast("เพิ่มบัญชีหรือ QR ก่อนเรียกเก็บเงิน");
    return;
  }

  els.requestForm.reset();
  populateRequestAccounts(preferredId);
  els.requestDialog.showModal();
  void updateRequestPreview();
}

function closeRequestDialog() {
  els.requestDialog.close();
  state.requestAccountId = null;
  state.requestQrDataUrl = null;
  state.requestQrPayload = null;
  state.requestRenderToken += 1;
}

async function sharePaymentRequest() {
  const item = selectedRequestItem();
  if (!item) return;

  const text = buildRequestText(item);

  try {
    const qrImage = state.requestQrDataUrl || item.image;
    const file = await dataUrlToFile(
      qrImage,
      `${item.label.replace(/[^a-zA-Z0-9ก-๙_-]+/g, "-") || "payment"}-qr.png`,
    );

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: `ขอรับเงิน • ${item.label}`,
        text,
        files: [file],
      });
      return;
    }

    if (navigator.share) {
      await navigator.share({
        title: `ขอรับเงิน • ${item.label}`,
        text,
      });
      return;
    }

    await copyText(text, "คัดลอกคำขอรับเงินแล้ว");
  } catch (error) {
    if (error?.name !== "AbortError") {
      await copyText(text, "แชร์ไม่ได้ จึงคัดลอกข้อความให้แล้ว");
    }
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("กรุณาเลือกไฟล์รูปภาพ"));
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("รูปใหญ่เกิน 8 MB"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

async function dataUrlToFile(dataUrl, filename = "qr-code.png") {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || "image/png" });
}

els.addBtn.addEventListener("click", () => openEditor());
els.emptyAddBtn.addEventListener("click", () => openEditor());
els.requestMoneyBtn.addEventListener("click", () => openRequestDialog());

function closeEditor() {
  els.editorDialog.close();
  resetEditor();
}

els.cancelEditorBtn.addEventListener("click", closeEditor);
els.closeEditorBtn.addEventListener("click", closeEditor);

els.scanBtn.addEventListener("click", runSmartScan);
els.clearScanBtn.addEventListener("click", clearSmartScanResults);

els.imageInput.addEventListener("change", async () => {
  const file = els.imageInput.files?.[0];
  if (!file) return;

  try {
    state.pendingImage = await fileToDataUrl(file);
    state.pendingQrPayload = null;
    els.imagePreview.src = state.pendingImage;
    els.previewWrap.classList.remove("hidden");
    els.scanBtn.disabled = false;
    els.scanStatus.classList.add("hidden");
    state.scanFilledFields.clear();
    els.clearScanBtn.classList.add("hidden");
  } catch (error) {
    els.imageInput.value = "";
    showToast(error.message || "เลือกรูปไม่สำเร็จ");
  }
});

els.qrForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!state.pendingImage) {
    showToast("กรุณาเลือกรูป QR");
    return;
  }

  const now = Date.now();
  const previous = state.editingId ? itemById(state.editingId) : null;

  const item = {
    id: previous?.id || uid(),
    bank: els.bankInput.value,
    category: els.categoryInput.value.trim() || DEFAULT_CATEGORY,
    label: els.labelInput.value.trim(),
    account: els.accountInput.value.trim(),
    accountNumber: els.accountNumberInput.value.trim(),
    image: state.pendingImage,
    qrPayload: state.pendingQrPayload || previous?.qrPayload || null,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };

  if (!item.label) {
    showToast("กรุณาใส่ชื่อที่ใช้เรียก");
    return;
  }

  try {
    await dbPut(item);
    const index = state.items.findIndex((row) => row.id === item.id);
    if (index >= 0) state.items[index] = item;
    else state.items.push(item);

    state.activeCategory = normalizeCategory(item);
    els.editorDialog.close();
    resetEditor();
    render();
    showToast(previous ? "แก้ไข QR แล้ว" : "เพิ่ม QR แล้ว");
  } catch {
    showToast("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
  }
});

els.closeViewerBtn.addEventListener("click", closeViewer);

els.copyViewerAccountBtn.addEventListener("click", () => {
  const item = itemById(state.viewingId);
  if (item) copyAccountNumber(item);
});

els.requestFromViewerBtn.addEventListener("click", () => {
  const id = state.viewingId;
  closeViewer();
  openRequestDialog(id);
});

els.closeRequestBtn.addEventListener("click", closeRequestDialog);
els.requestAccountSelect.addEventListener("change", () => void updateRequestPreview());
els.requestAmountInput.addEventListener("input", () => void updateRequestPreview());
els.requestNoteInput.addEventListener("input", () => void updateRequestPreview());

els.copyRequestAccountBtn.addEventListener("click", () => {
  const item = selectedRequestItem();
  if (item) copyAccountNumber(item);
});

els.copyRequestTextBtn.addEventListener("click", () => {
  const item = selectedRequestItem();
  if (item) copyText(buildRequestText(item), "คัดลอกคำขอรับเงินแล้ว");
});

els.shareRequestBtn.addEventListener("click", sharePaymentRequest);

els.fullscreenBtn.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await els.viewerQrWrap.requestFullscreen();
  } catch {
    showToast("อุปกรณ์นี้ไม่รองรับโหมดเต็มจอ");
  }
});

els.shareBtn.addEventListener("click", async () => {
  const item = itemById(state.viewingId);
  if (!item) return;

  try {
    const file = await dataUrlToFile(
      item.image,
      `${item.label.replace(/[^a-zA-Z0-9ก-๙_-]+/g, "-") || "qr"}-qr.png`,
    );

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: item.label,
        text: `${item.bank} - ${item.label}`,
        files: [file],
      });
      return;
    }

    const a = document.createElement("a");
    a.href = item.image;
    a.download = file.name;
    a.click();
    showToast("ดาวน์โหลด QR แล้ว");
  } catch (error) {
    if (error?.name !== "AbortError") showToast("แชร์ไม่สำเร็จ");
  }
});

els.editBtn.addEventListener("click", () => {
  const id = state.viewingId;
  closeViewer();
  openEditor(id);
});

els.deleteBtn.addEventListener("click", async () => {
  const item = itemById(state.viewingId);
  if (!item) return;

  const confirmed = confirm(`ลบ “${item.label}” ใช่หรือไม่?`);
  if (!confirmed) return;

  try {
    await dbDelete(item.id);
    state.items = state.items.filter((row) => row.id !== item.id);
    closeViewer();
    render();
    showToast("ลบ QR แล้ว");
  } catch {
    showToast("ลบไม่สำเร็จ");
  }
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  state.deferredInstallPrompt = event;
  els.installBtn.classList.remove("hidden");
});

els.installBtn.addEventListener("click", async () => {
  const prompt = state.deferredInstallPrompt;
  if (!prompt) {
    showToast("ใช้เมนูเบราว์เซอร์ > เพิ่มไปยังหน้าจอโฮม");
    return;
  }

  prompt.prompt();
  await prompt.userChoice;
  state.deferredInstallPrompt = null;
  els.installBtn.classList.add("hidden");
});

window.addEventListener("appinstalled", () => {
  state.deferredInstallPrompt = null;
  els.installBtn.classList.add("hidden");
  showToast("ติดตั้ง My QR แล้ว");
});

async function boot() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch {
      // App still works online if service worker registration fails.
    }
  }

  try {
    state.items = await dbGetAll();
    render();
  } catch {
    els.emptyState.querySelector("p").textContent = "เบราว์เซอร์นี้ไม่สามารถเปิดพื้นที่จัดเก็บข้อมูลได้";
    showToast("เปิดพื้นที่จัดเก็บข้อมูลไม่สำเร็จ");
  }
}

boot();
