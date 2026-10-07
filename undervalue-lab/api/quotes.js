const MAX_SYMBOLS = 20;

function normalizeSymbols(value) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z0-9.^=-]{1,15}$/.test(s))
    .slice(0, MAX_SYMBOLS);
}

async function fetchQuote(symbol) {
  const url =
    "https://query1.finance.yahoo.com/v8/finance/chart/" +
    encodeURIComponent(symbol) +
    "?interval=1d&range=5d";

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 UndervalueLab/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(symbol + ": upstream " + response.status);
  }

  const payload = await response.json();
  const result = payload?.chart?.result?.[0];
  const meta = result?.meta;

  if (!meta || !Number.isFinite(meta.regularMarketPrice)) {
    throw new Error(symbol + ": no regularMarketPrice");
  }

  return {
    symbol,
    price: meta.regularMarketPrice,
    previousClose: Number.isFinite(meta.chartPreviousClose)
      ? meta.chartPreviousClose
      : Number.isFinite(meta.previousClose)
        ? meta.previousClose
        : null,
    currency: meta.currency || null,
    exchange: meta.exchangeName || null,
    marketState: meta.marketState || null
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const symbols = normalizeSymbols(req.query.symbols);
  if (!symbols.length) {
    return res.status(400).json({ error: "Pass ?symbols=GOOG,TSM" });
  }

  const settled = await Promise.allSettled(symbols.map(fetchQuote));
  const quotes = [];
  const errors = [];

  settled.forEach((item, index) => {
    if (item.status === "fulfilled") quotes.push(item.value);
    else errors.push({ symbol: symbols[index], error: item.reason?.message || "Unknown error" });
  });

  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  return res.status(quotes.length ? 200 : 502).json({
    asOf: new Date().toISOString(),
    source: "Yahoo Finance chart endpoint",
    quotes,
    errors
  });
};
