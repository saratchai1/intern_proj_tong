# Undervalue Lab

A deterministic equity-research MVP for screening, valuation, reverse DCF, company comparison, and value-trap review.

## What is included

- Screener with market-cap, FCF-yield, ROIC, upside, sector, and value-trap filters
- Presets for quality value, deep value, GARP, and compounders
- Ranked research table
- Company detail view with thesis, market-mispricing hypothesis, catalyst, risk, and value-trap flags
- 2–5 company comparison
- Deterministic 5-year FCF DCF playground
- Reverse DCF that solves for the FCF growth embedded in the current price
- DCF sensitivity matrix
- CSV export
- JSON dataset import
- Local watchlist storage
- Responsive desktop/mobile UI

## Data warning

The bundled data in `data.js` is a **dated research snapshot (2026-10-06)** created from the preceding research session. It is not a live market feed.

The app deliberately separates:

1. **Deterministic finance calculations** — code
2. **Research narrative** — notes in the dataset

Do not treat the bundled fair values or scores as current without verifying the input data.

## Run locally

This MVP has no build step.

```bash
cd undervalue-lab
python -m http.server 8080
```

Open:

```
http://localhost:8080
```

You can also deploy this folder as a static site.

## JSON import format

Minimum fields:

```json
{
  "asOf": "2026-10-07",
  "currency": "USD",
  "companies": [
    {
      "ticker": "EXAMPLE",
      "company": "Example Inc.",
      "sector": "Software",
      "marketCap": 150,
      "price": 100,
      "baseFV": 130,
      "score": 84
    }
  ]
}
```

For the full experience also provide:

- `forwardPE`
- `fcfYield`
- `revenueGrowth`
- `roic`
- `netDebtEbitda`
- `bearFV`, `bullFV`
- `expected5Y`, `expected10Y`
- `moat`, `valueTrap`, `conviction`
- `modelKind` (`fcf` or `bank`)
- `thesis`, `narrative`, `catalyst`, `risk`
- `trapFlags`
- `baseGrowth`, `terminalGrowth`, `discountRate`

## DCF implementation

For non-bank companies, the MVP approximates starting FCF as:

```
market cap × FCF yield
```

It then:

1. grows FCF at a constant user-selected rate for five years;
2. discounts each annual cash flow;
3. calculates a Gordon-growth terminal value;
4. applies a conservative simplified net-debt adjustment;
5. divides by implied shares outstanding.

This is intentionally transparent and editable. It is not intended to replace a company-specific full financial model.

Banks are excluded from FCF DCF because cash flow and debt have different economic meanings for financial institutions.

## Next production phase

Recommended next steps:

1. Add a server-side market/fundamentals provider adapter.
2. Add SEC Company Facts / filing ingestion.
3. Persist snapshots to PostgreSQL.
4. Store valuation assumptions and valuation history.
5. Add normalized-earnings models for cyclicals.
6. Add bank-specific ROTCE / tangible-book models.
7. Add AI research summaries only after deterministic data is available.
8. Add source citations per data point and research claim.
9. Add portfolio construction, VOO benchmark, correlation, and stress tests.
10. Add scheduled re-ranking after earnings.

### Suggested provider interface

```ts
interface MarketDataProvider {
  quote(ticker: string): Promise<Quote>;
  fundamentals(ticker: string): Promise<Fundamentals>;
  estimates(ticker: string): Promise<ConsensusEstimates>;
}
```

API keys should live server-side; do not expose paid-market-data keys in browser JavaScript.
