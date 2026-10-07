(() => {
  "use strict";

  const state = {
    source: structuredClone(window.UNDERVALUE_SEED),
    filtered: [],
    selectedTicker: null,
    compare: new Set(),
    watchlist: new Set(JSON.parse(localStorage.getItem("undervalue-watchlist") || "[]")),
    filters: {
      search: "",
      sector: "all",
      minMarketCap: 100,
      minFcfYield: 0,
      minRoic: 0,
      minUpside: 0,
      trap: "all",
      sortBy: "score"
    }
  };

  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
  const money = (v) => v == null ? "—" : "$" + fmt.format(v);
  const pct = (v) => v == null ? "—" : fmt.format(v) + "%";
  const multiple = (v) => v == null ? "—" : fmt.format(v) + "×";

  function baseUpside(s) {
    return ((s.baseFV / s.price) - 1) * 100;
  }

  function fcfB(s) {
    if (s.fcfYield == null) return null;
    return s.marketCap * (s.fcfYield / 100);
  }

  function sharesB(s) {
    return s.marketCap / s.price;
  }

  function median(values) {
    const xs = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (!xs.length) return null;
    const i = Math.floor(xs.length / 2);
    return xs.length % 2 ? xs[i] : (xs[i - 1] + xs[i]) / 2;
  }

  function riskRank(v) {
    const map = { "Low": 0, "Low–Med": 1, "Medium": 2, "High": 3 };
    return map[v] ?? 9;
  }

  function renderSectorOptions() {
    const sectors = [...new Set(state.source.companies.map(x => x.sector))].sort();
    $("sectorFilter").innerHTML = '<option value="all">All sectors</option>' +
      sectors.map(x => '<option value="' + escapeHtml(x) + '">' + escapeHtml(x) + '</option>').join("");
  }

  function applyFilters() {
    const f = state.filters;
    const q = f.search.trim().toLowerCase();

    state.filtered = state.source.companies.filter(s => {
      if (q && !s.ticker.toLowerCase().includes(q) && !s.company.toLowerCase().includes(q)) return false;
      if (f.sector !== "all" && s.sector !== f.sector) return false;
      if (s.marketCap < f.minMarketCap) return false;
      if (f.minFcfYield > 0 && (s.fcfYield == null || s.fcfYield < f.minFcfYield)) return false;
      if (f.minRoic > 0 && (s.roic == null || s.roic < f.minRoic)) return false;
      if (baseUpside(s) < f.minUpside) return false;
      if (f.trap === "Low" && s.valueTrap !== "Low") return false;
      if (f.trap === "Low–Med" && riskRank(s.valueTrap) > 1) return false;
      return true;
    });

    const getters = {
      score: s => s.score,
      upside: baseUpside,
      fcfYield: s => s.fcfYield ?? -Infinity,
      roic: s => s.roic ?? -Infinity,
      expected5Y: s => s.expected5Y,
      marketCap: s => s.marketCap
    };
    const get = getters[f.sortBy] || getters.score;
    state.filtered.sort((a, b) => get(b) - get(a));
    render();
  }

  function render() {
    renderSummary();
    renderRows();
    renderCompare();
    if (state.selectedTicker) renderDetail(state.selectedTicker);
  }

  function renderSummary() {
    $("universeCount").textContent = state.source.companies.length;
    $("passingCount").textContent = state.filtered.length;
    const med = median(state.filtered.map(baseUpside));
    $("medianUpside").textContent = med == null ? "—" : pct(med);
    const top = [...state.filtered].sort((a, b) => b.score - a.score)[0];
    $("topScore").textContent = top ? top.ticker + " " + top.score : "—";
    $("compareCount").textContent = state.compare.size;
    $("dataStatus").textContent = "Snapshot " + state.source.asOf;
  }

  function renderRows() {
    $("stockRows").innerHTML = state.filtered.map((s, i) => {
      const active = s.ticker === state.selectedTicker ? " active-row" : "";
      const checked = state.compare.has(s.ticker) ? " checked" : "";
      const upside = baseUpside(s);
      return '<tr class="' + active + '">' +
        '<td><input class="compare-check" data-ticker="' + s.ticker + '" type="checkbox"' + checked + ' aria-label="Compare ' + s.ticker + '"></td>' +
        '<td>' + (i + 1) + '</td>' +
        '<td><button class="ticker-link" data-open="' + s.ticker + '">' + s.ticker + '</button></td>' +
        '<td><div class="company-cell"><strong>' + escapeHtml(s.company) + '</strong><small>' + escapeHtml(s.sector) + '</small></div></td>' +
        '<td>$' + fmt.format(s.marketCap) + 'B</td>' +
        '<td>' + money(s.price) + '</td>' +
        '<td>' + multiple(s.forwardPE) + '</td>' +
        '<td>' + pct(s.fcfYield) + '</td>' +
        '<td>' + pct(s.revenueGrowth) + '</td>' +
        '<td>' + pct(s.roic) + '</td>' +
        '<td>' + money(s.baseFV) + '</td>' +
        '<td class="' + (upside >= 0 ? "positive" : "negative") + '">' + pct(upside) + '</td>' +
        '<td>' + pct(s.expected5Y) + '</td>' +
        '<td><span class="score score-' + scoreBand(s.score) + '">' + s.score + '</span></td>' +
      '</tr>';
    }).join("");

    document.querySelectorAll("[data-open]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.selectedTicker = btn.dataset.open;
        renderDetail(state.selectedTicker);
        renderRows();
        document.getElementById("detailCard").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll(".compare-check").forEach(input => {
      input.addEventListener("change", () => toggleCompare(input.dataset.ticker, input.checked));
    });
  }

  function scoreBand(score) {
    if (score >= 90) return "s";
    if (score >= 85) return "a";
    if (score >= 80) return "b";
    return "watch";
  }

  function renderDetail(ticker) {
    const s = state.source.companies.find(x => x.ticker === ticker);
    if (!s) return;

    $("detailTitle").textContent = s.ticker + " · " + s.company;
    $("watchBtn").disabled = false;
    $("watchBtn").textContent = state.watchlist.has(s.ticker) ? "Remove from watchlist" : "Add to watchlist";

    const upside = baseUpside(s);
    const returnSource = [
      { label: "Growth / FCF", value: "Primary" },
      { label: "Multiple expansion", value: upside > 35 ? "Meaningful" : "Secondary" },
      { label: "Capital returns", value: s.fcfYield != null && s.fcfYield >= 7 ? "Meaningful" : "Varies" }
    ];

    $("detailBody").className = "";
    $("detailBody").innerHTML =
      '<div class="detail-metrics">' +
        metric("Price", money(s.price)) +
        metric("Bear FV", money(s.bearFV)) +
        metric("Base FV", money(s.baseFV)) +
        metric("Bull FV", money(s.bullFV)) +
        metric("Base upside", pct(upside), upside >= 0 ? "positive" : "negative") +
        metric("5Y CAGR", pct(s.expected5Y)) +
        metric("Moat", s.moat) +
        metric("Trap risk", s.valueTrap) +
      '</div>' +
      '<div class="research-grid">' +
        researchBlock("Long-term thesis", s.thesis) +
        researchBlock("Why market may be wrong", s.narrative) +
        researchBlock("Primary catalyst", s.catalyst) +
        researchBlock("Thesis-breaking risk", s.risk) +
      '</div>' +
      '<div class="flag-row">' + s.trapFlags.map(x => '<span class="risk-chip">' + escapeHtml(x) + '</span>').join("") + '</div>' +
      '<div class="return-source">' +
        '<h3>Expected-return dependence</h3>' +
        '<div class="mini-grid">' + returnSource.map(x => '<div><span>' + x.label + '</span><strong>' + x.value + '</strong></div>').join("") + '</div>' +
      '</div>';

    renderDcf(s);
    renderReverseDcf(s);
  }

  function metric(label, value, className = "") {
    return '<div class="detail-metric ' + className + '"><span>' + label + '</span><strong>' + value + '</strong></div>';
  }

  function researchBlock(title, body) {
    return '<article><h3>' + title + '</h3><p>' + escapeHtml(body) + '</p></article>';
  }

  function toggleCompare(ticker, checked) {
    if (checked) {
      if (state.compare.size >= 5) {
        alert("Compare supports up to 5 companies.");
        renderRows();
        return;
      }
      state.compare.add(ticker);
    } else {
      state.compare.delete(ticker);
    }
    renderSummary();
    renderCompare();
  }

  function renderCompare() {
    const items = [...state.compare].map(t => state.source.companies.find(x => x.ticker === t)).filter(Boolean);
    if (items.length < 2) {
      $("compareArea").className = "empty-state";
      $("compareArea").textContent = "Select 2–5 companies from the screener.";
      return;
    }

    const rows = [
      ["Price", s => money(s.price)],
      ["Market cap", s => "$" + fmt.format(s.marketCap) + "B"],
      ["Forward P/E", s => multiple(s.forwardPE)],
      ["FCF yield", s => pct(s.fcfYield)],
      ["Revenue growth", s => pct(s.revenueGrowth)],
      ["ROIC", s => pct(s.roic)],
      ["Base upside", s => pct(baseUpside(s))],
      ["5Y expected CAGR", s => pct(s.expected5Y)],
      ["Moat", s => s.moat],
      ["Value-trap risk", s => s.valueTrap],
      ["Score", s => s.score]
    ];

    $("compareArea").className = "compare-table-wrap";
    $("compareArea").innerHTML = '<table class="compare-table"><thead><tr><th>Metric</th>' +
      items.map(s => '<th>' + s.ticker + '</th>').join("") +
      '</tr></thead><tbody>' +
      rows.map(([label, get]) => '<tr><th>' + label + '</th>' + items.map(s => '<td>' + get(s) + '</td>').join("") + '</tr>').join("") +
      '</tbody></table>' +
      '<div class="compare-verdict">' + compareVerdict(items) + '</div>';
  }

  function compareVerdict(items) {
    const by = (get, dir = "max") => [...items].sort((a,b) => dir === "max" ? get(b) - get(a) : get(a) - get(b))[0];
    const bestScore = by(x => x.score);
    const bestUpside = by(baseUpside);
    const bestFcf = by(x => x.fcfYield ?? -Infinity);
    const bestGrowth = by(x => x.revenueGrowth);
    return '<div><span>Highest overall score</span><strong>' + bestScore.ticker + '</strong></div>' +
      '<div><span>Largest base upside</span><strong>' + bestUpside.ticker + '</strong></div>' +
      '<div><span>Highest FCF yield</span><strong>' + bestFcf.ticker + '</strong></div>' +
      '<div><span>Fastest revenue growth</span><strong>' + bestGrowth.ticker + '</strong></div>';
  }

  function dcfFairValue(s, growth, discount, terminal) {
    const startFcf = fcfB(s);
    if (startFcf == null || discount <= terminal) return null;
    let pv = 0;
    let fcf = startFcf;
    for (let year = 1; year <= 5; year++) {
      fcf *= 1 + growth / 100;
      pv += fcf / Math.pow(1 + discount / 100, year);
    }
    const terminalValue = (fcf * (1 + terminal / 100)) / ((discount - terminal) / 100);
    pv += terminalValue / Math.pow(1 + discount / 100, 5);
    const netDebtB = Number.isFinite(s.netDebtEbitda) && s.netDebtEbitda > 0
      ? Math.min(s.marketCap * 0.08, s.marketCap * 0.02 * s.netDebtEbitda)
      : 0;
    const equityValue = pv - netDebtB;
    return equityValue / sharesB(s);
  }

  function renderDcf(s) {
    $("dcfTicker").textContent = s.ticker;
    if (s.modelKind === "bank" || s.fcfYield == null) {
      $("dcfArea").className = "empty-state";
      $("dcfArea").innerHTML = "A conventional FCF DCF is not appropriate for banks. Use normalized ROTCE / book-value economics instead.";
      return;
    }

    const g = s.baseGrowth ?? 8;
    const d = s.discountRate ?? 9;
    const t = s.terminalGrowth ?? 3;
    $("dcfArea").className = "";
    $("dcfArea").innerHTML =
      '<div class="model-controls">' +
        rangeControl("growthRange", "5Y FCF growth", g, 0, 25, 0.5, "%") +
        rangeControl("discountRange", "Discount rate", d, 6, 15, 0.1, "%") +
        rangeControl("terminalRange", "Terminal growth", t, 0, 5, 0.1, "%") +
      '</div>' +
      '<div class="dcf-output">' +
        '<div><span>Current price</span><strong>' + money(s.price) + '</strong></div>' +
        '<div><span>Implied fair value</span><strong id="dcfValue">—</strong></div>' +
        '<div><span>Upside / downside</span><strong id="dcfUpside">—</strong></div>' +
      '</div>' +
      '<div class="sensitivity" id="sensitivity"></div>';

    ["growthRange", "discountRange", "terminalRange"].forEach(id => $(id).addEventListener("input", () => updateDcf(s)));
    updateDcf(s);
  }

  function rangeControl(id, label, value, min, max, step, suffix) {
    return '<label class="range-control"><span>' + label + '<strong id="' + id + 'Value">' + value + suffix + '</strong></span>' +
      '<input id="' + id + '" type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '"></label>';
  }

  function updateDcf(s) {
    const g = +$("growthRange").value;
    const d = +$("discountRange").value;
    const t = +$("terminalRange").value;
    $("growthRangeValue").textContent = g.toFixed(1) + "%";
    $("discountRangeValue").textContent = d.toFixed(1) + "%";
    $("terminalRangeValue").textContent = t.toFixed(1) + "%";
    const fv = dcfFairValue(s, g, d, t);
    $("dcfValue").textContent = fv == null ? "Invalid" : money(fv);
    const up = fv == null ? null : ((fv / s.price) - 1) * 100;
    $("dcfUpside").textContent = up == null ? "—" : pct(up);
    $("dcfUpside").className = up == null ? "" : (up >= 0 ? "positive" : "negative");
    renderSensitivity(s, g, t);
  }

  function renderSensitivity(s, growth, terminal) {
    const discounts = [8, 9, 10, 11];
    const terminals = [Math.max(0, terminal - 1), terminal, Math.min(5, terminal + 1)];
    $("sensitivity").innerHTML = '<h3>Discount-rate sensitivity</h3><div class="table-wrap"><table><thead><tr><th>Terminal \\ WACC</th>' +
      discounts.map(x => '<th>' + x + '%</th>').join("") + '</tr></thead><tbody>' +
      terminals.map(t => '<tr><th>' + t.toFixed(1) + '%</th>' +
        discounts.map(d => '<td>' + money(dcfFairValue(s, growth, d, t)) + '</td>').join("") + '</tr>').join("") +
      '</tbody></table></div>';
  }

  function impliedGrowth(s) {
    if (s.modelKind === "bank" || s.fcfYield == null) return null;
    let lo = -10, hi = 40;
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      const fv = dcfFairValue(s, mid, s.discountRate ?? 9, s.terminalGrowth ?? 3);
      if (fv == null) return null;
      if (fv < s.price) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  function renderReverseDcf(s) {
    if (s.modelKind === "bank" || s.fcfYield == null) {
      $("reverseArea").className = "empty-state";
      $("reverseArea").innerHTML = "Reverse FCF DCF is disabled for banks in this MVP.";
      return;
    }
    const ig = impliedGrowth(s);
    const base = s.baseGrowth ?? 8;
    let classification = "REASONABLE";
    if (ig < base - 5) classification = "EXTREMELY PESSIMISTIC";
    else if (ig < base - 2) classification = "PESSIMISTIC";
    else if (ig > base + 5) classification = "EXTREMELY OPTIMISTIC";
    else if (ig > base + 2) classification = "OPTIMISTIC";

    $("reverseArea").className = "";
    $("reverseArea").innerHTML =
      '<div class="reverse-summary"><span>Market-implied 5Y FCF growth</span><strong>' + pct(ig) + '</strong></div>' +
      '<div class="reverse-summary"><span>Research base assumption</span><strong>' + pct(base) + '</strong></div>' +
      '<div class="expectation ' + classification.toLowerCase().replaceAll(" ", "-") + '">' + classification + '</div>' +
      '<p class="muted">This solves for the constant 5-year FCF growth rate that makes the deterministic DCF equal the current stock price, holding discount and terminal-growth assumptions fixed.</p>';
  }

  function exportCsv() {
    const columns = ["ticker","company","sector","marketCap","price","forwardPE","fcfYield","revenueGrowth","roic","baseFV","upside","expected5Y","score","valueTrap"];
    const rows = state.filtered.map(s => ({
      ...s,
      upside: baseUpside(s).toFixed(2)
    }));
    const csv = [columns.join(",")].concat(rows.map(r => columns.map(c => csvCell(r[c])).join(","))).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "undervalue-screen-" + state.source.asOf + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function csvCell(v) {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replaceAll('"','""') + '"' : s;
  }

  async function importJson(file) {
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.companies)) throw new Error("JSON must contain a companies array.");
    const required = ["ticker","company","sector","marketCap","price","baseFV","score"];
    parsed.companies.forEach((s, i) => {
      required.forEach(key => {
        if (s[key] == null) throw new Error("Company #" + (i + 1) + " is missing " + key);
      });
    });
    state.source = {
      asOf: parsed.asOf || new Date().toISOString().slice(0,10),
      currency: parsed.currency || "USD",
      note: parsed.note || "Imported dataset",
      companies: parsed.companies
    };
    state.compare.clear();
    state.selectedTicker = null;
    renderSectorOptions();
    applyFilters();
  }

  function resetFilters() {
    state.filters = { search:"", sector:"all", minMarketCap:100, minFcfYield:0, minRoic:0, minUpside:0, trap:"all", sortBy:"score" };
    $("searchInput").value = "";
    $("sectorFilter").value = "all";
    $("minMarketCap").value = 100;
    $("minFcfYield").value = 0;
    $("minRoic").value = 0;
    $("minUpside").value = 0;
    $("trapFilter").value = "all";
    $("sortBy").value = "score";
    applyFilters();
  }

  function applyPreset(name) {
    resetFilters();
    if (name === "quality") {
      $("minFcfYield").value = 5;
      $("minRoic").value = 15;
      $("minUpside").value = 10;
      $("trapFilter").value = "Low–Med";
      $("sortBy").value = "score";
    } else if (name === "deep") {
      $("minFcfYield").value = 7;
      $("minUpside").value = 20;
      $("sortBy").value = "upside";
    } else if (name === "garp") {
      $("minUpside").value = 10;
      $("sortBy").value = "expected5Y";
    } else if (name === "compounder") {
      $("minRoic").value = 20;
      $("trapFilter").value = "Low–Med";
      $("sortBy").value = "score";
    }
    syncFilterState();
  }

  function syncFilterState() {
    state.filters.search = $("searchInput").value;
    state.filters.sector = $("sectorFilter").value;
    state.filters.minMarketCap = +$("minMarketCap").value || 0;
    state.filters.minFcfYield = +$("minFcfYield").value || 0;
    state.filters.minRoic = +$("minRoic").value || 0;
    state.filters.minUpside = +$("minUpside").value || 0;
    state.filters.trap = $("trapFilter").value;
    state.filters.sortBy = $("sortBy").value;
    applyFilters();
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }

  ["searchInput","sectorFilter","minMarketCap","minFcfYield","minRoic","minUpside","trapFilter","sortBy"].forEach(id => {
    $(id).addEventListener("input", syncFilterState);
    $(id).addEventListener("change", syncFilterState);
  });

  $("resetFilters").addEventListener("click", resetFilters);
  $("clearCompare").addEventListener("click", () => { state.compare.clear(); render(); });
  $("exportBtn").addEventListener("click", exportCsv);
  $("watchBtn").addEventListener("click", () => {
    if (!state.selectedTicker) return;
    if (state.watchlist.has(state.selectedTicker)) state.watchlist.delete(state.selectedTicker);
    else state.watchlist.add(state.selectedTicker);
    localStorage.setItem("undervalue-watchlist", JSON.stringify([...state.watchlist]));
    renderDetail(state.selectedTicker);
  });
  $("importInput").addEventListener("change", async (e) => {
    try {
      if (!e.target.files?.[0]) return;
      await importJson(e.target.files[0]);
    } catch (err) {
      alert(err.message || "Could not import JSON.");
    } finally {
      e.target.value = "";
    }
  });
  document.querySelectorAll("[data-preset]").forEach(btn => btn.addEventListener("click", () => applyPreset(btn.dataset.preset)));

  renderSectorOptions();
  applyFilters();
})();