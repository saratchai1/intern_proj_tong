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
  previewWrap: document.querySelector("#previewWrap"),
  imagePreview: document.querySelector("#imagePreview"),
  cancelEditorBtn: document.querySelector("#cancelEditorBtn"),
  closeEditorBtn: document.querySelector("#closeEditorBtn"),
  viewerDialog: document.querySelector("#viewerDialog"),
  viewerBank: document.querySelector("#viewerBank"),
  viewerCategory: document.querySelector("#viewerCategory"),
  viewerLabel: document.querySelector("#viewerLabel"),
  viewerAccount: document.querySelector("#viewerAccount"),
  viewerAccountNumber: document.querySelector("#viewerAccountNumber"),
  viewerImage: document.querySelector("#viewerImage"),
  viewerQrWrap: document.querySelector("#viewerQrWrap"),
  closeViewerBtn: document.querySelector("#closeViewerBtn"),
  fullscreenBtn: document.querySelector("#fullscreenBtn"),
  shareBtn: document.querySelector("#shareBtn"),
  editBtn: document.querySelector("#editBtn"),
  deleteBtn: document.querySelector("#deleteBtn"),
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
    const card = document.createElement("button");
    card.type = "button";
    card.className = "qr-card";
    card.setAttribute("aria-label", `เปิด ${item.label}`);

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

    card.append(thumb, meta);
    card.addEventListener("click", () => openViewer(item.id));
    els.qrGrid.append(card);
  }
}

function resetEditor() {
  state.editingId = null;
  state.pendingImage = null;
  els.editorTitle.textContent = "เพิ่ม QR";
  els.qrForm.reset();
  els.bankInput.value = "PromptPay";
  els.categoryInput.value = DEFAULT_CATEGORY;
  els.previewWrap.classList.add("hidden");
  els.imagePreview.removeAttribute("src");
  els.imageInput.required = true;
  els.imageHelp.textContent = "รองรับ PNG, JPG, WebP แนะนำภาพคมชัดและไม่มีข้อมูลส่วนเกิน";
}

function openEditor(id = null) {
  resetEditor();

  if (id) {
    const item = itemById(id);
    if (!item) return;
    state.editingId = id;
    state.pendingImage = item.image;
    els.editorTitle.textContent = "แก้ไข QR";
    els.bankInput.value = item.bank;
    els.categoryInput.value = normalizeCategory(item);
    els.labelInput.value = item.label;
    els.accountInput.value = item.account || "";
    els.accountNumberInput.value = item.accountNumber || "";
    els.imageInput.required = false;
    els.imageHelp.textContent = "ไม่ต้องเลือกรูปใหม่ หากต้องการใช้ QR เดิม";
    els.imagePreview.src = item.image;
    els.previewWrap.classList.remove("hidden");
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
  els.viewerAccountNumber.classList.toggle("hidden", !item.accountNumber);

  els.viewerImage.src = item.image;
  els.viewerDialog.showModal();
}

function closeViewer() {
  state.viewingId = null;
  els.viewerDialog.close();
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

function closeEditor() {
  els.editorDialog.close();
  resetEditor();
}

els.cancelEditorBtn.addEventListener("click", closeEditor);
els.closeEditorBtn.addEventListener("click", closeEditor);

els.imageInput.addEventListener("change", async () => {
  const file = els.imageInput.files?.[0];
  if (!file) return;

  try {
    state.pendingImage = await fileToDataUrl(file);
    els.imagePreview.src = state.pendingImage;
    els.previewWrap.classList.remove("hidden");
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
