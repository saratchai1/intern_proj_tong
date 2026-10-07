window.UNDERVALUE_SEED = {
  asOf: "2026-10-06",
  currency: "USD",
  note: "Research-session snapshot. Verify all market data before making an investment decision.",
  companies: [
    {
      ticker: "BKNG", company: "Booking Holdings", sector: "Travel Platforms", marketCap: 118, price: 157.63,
      forwardPE: 14.2, fcfYield: 8.1, revenueGrowth: 12.9, roic: 92, netDebtEbitda: 0.33,
      bearFV: 135, baseFV: 205, bullFV: 255, expected5Y: 14, expected10Y: 12, score: 89,
      moat: "Strong", valueTrap: "Low", conviction: "High", modelKind: "fcf",
      thesis: "Asset-light global travel marketplace with extraordinary capital efficiency, supplier depth, demand aggregation, and large buybacks.",
      narrative: "The market is discounting AI-agent disintermediation and travel-cycle uncertainty more heavily than current cash generation appears to justify.",
      catalyst: "Continued room-night growth, transformation savings, higher direct/merchant mix, and per-share accretion from repurchases.",
      risk: "AI discovery layers or direct supplier channels reduce Booking's take rate or raise traffic-acquisition costs.",
      trapFlags: ["Travel is cyclical", "AI distribution risk"],
      baseGrowth: 9, terminalGrowth: 3, discountRate: 9
    },
    {
      ticker: "UBER", company: "Uber Technologies", sector: "Mobility Platforms", marketCap: 141, price: 69.08,
      forwardPE: 17.0, fcfYield: 7.1, revenueGrowth: 16.7, roic: 19, netDebtEbitda: 0.64,
      bearFV: 58, baseFV: 95, bullFV: 125, expected5Y: 15, expected10Y: 13, score: 88,
      moat: "Expanding", valueTrap: "Low", conviction: "High", modelKind: "fcf",
      thesis: "Mobility, delivery, advertising, business travel, and AV aggregation create multiple growth engines while free cash flow scales.",
      narrative: "The market still prices meaningful autonomous-vehicle disintermediation risk despite Uber's demand aggregation and distribution advantages.",
      catalyst: "FCF margin expansion, advertising, Uber for Business, AV partnerships, and delivery monetization.",
      risk: "Robotaxi operators bypass Uber, insurance costs rise, or regulation compresses marketplace economics.",
      trapFlags: ["AV disruption risk", "Regulatory exposure"],
      baseGrowth: 13, terminalGrowth: 3, discountRate: 9.5
    },
    {
      ticker: "CRM", company: "Salesforce", sector: "Enterprise Software", marketCap: 185, price: 224.99,
      forwardPE: 15.3, fcfYield: 8.2, revenueGrowth: 11.2, roic: 11, netDebtEbitda: 2.4,
      bearFV: 190, baseFV: 300, bullFV: 365, expected5Y: 13, expected10Y: 11, score: 87,
      moat: "Strong", valueTrap: "Low–Med", conviction: "High", modelKind: "fcf",
      thesis: "Deeply embedded enterprise CRM and data workflows can monetize AI agents while margin discipline and buybacks lift per-share FCF.",
      narrative: "The market may be extrapolating AI seat compression faster than Agentforce and Data Cloud can create incremental workloads.",
      catalyst: "Agentforce adoption, cRPO durability, margin expansion, and buybacks.",
      risk: "Organic growth drops into mid-single digits while AI products fail to offset seat compression.",
      trapFlags: ["AI seat compression", "Acquisition leverage"],
      baseGrowth: 9, terminalGrowth: 3, discountRate: 9
    },
    {
      ticker: "ACN", company: "Accenture", sector: "IT Services", marketCap: 115, price: 193.40,
      forwardPE: 13.2, fcfYield: 10.0, revenueGrowth: 6.5, roic: 27, netDebtEbitda: 0.04,
      bearFV: 170, baseFV: 255, bullFV: 305, expected5Y: 12, expected10Y: 10, score: 86,
      moat: "Strong", valueTrap: "Low", conviction: "High", modelKind: "fcf",
      thesis: "AI may automate delivery work but simultaneously increases enterprise demand for integration, process redesign, governance, and change management.",
      narrative: "The market has treated AI primarily as a labor-displacement threat rather than an implementation wave.",
      catalyst: "AI implementation bookings, stable consulting growth, productivity-led margin expansion, and shareholder returns.",
      risk: "AI productivity reduces billable work faster than new transformation demand arrives.",
      trapFlags: ["Labor-model disruption"],
      baseGrowth: 6, terminalGrowth: 2.5, discountRate: 8.5
    },
    {
      ticker: "TSM", company: "Taiwan Semiconductor", sector: "Semiconductors", marketCap: 2090, price: 482.30,
      forwardPE: 20.6, fcfYield: 1.7, revenueGrowth: 30.6, roic: 54, netDebtEbitda: -0.77,
      bearFV: 380, baseFV: 575, bullFV: 720, expected5Y: 13, expected10Y: 11.5, score: 85,
      moat: "Exceptional", valueTrap: "Low", conviction: "High", modelKind: "fcf",
      thesis: "Leading-edge process leadership, yields, ecosystem depth, and customer neutrality make TSMC the critical manufacturing layer of advanced compute.",
      narrative: "The stock is not deep value, but the quality-adjusted multiple remains reasonable if AI and HPC demand persist.",
      catalyst: "Advanced-node mix, packaging demand, AI accelerators, and global capacity expansion.",
      risk: "Taiwan geopolitical shock, weaker-than-expected AI demand, or erosion of leading-edge process leadership.",
      trapFlags: ["Geopolitical concentration", "Heavy capex"],
      baseGrowth: 14, terminalGrowth: 3, discountRate: 10.5
    },
    {
      ticker: "JPM", company: "JPMorgan Chase", sector: "Banks", marketCap: 881, price: 331.28,
      forwardPE: 13.6, fcfYield: null, revenueGrowth: 13.8, roic: null, roe: 17.8, netDebtEbitda: null,
      bearFV: 285, baseFV: 390, bullFV: 455, expected5Y: 10.5, expected10Y: 9.5, score: 84,
      moat: "Exceptional", valueTrap: "Low", conviction: "High", modelKind: "bank",
      thesis: "Scale, deposits, payments, investment banking, markets, and asset management support structurally superior through-cycle returns.",
      narrative: "JPM is not a statistically cheap bank; it is a best-in-class bank trading at a valuation that can still support acceptable long-term returns.",
      catalyst: "Investment-banking normalization, wealth growth, operating leverage, and repurchases.",
      risk: "Credit losses, regulation, capital requirements, and normalization of net-interest income.",
      trapFlags: ["Credit cycle", "Regulatory capital"]
    },
    {
      ticker: "NVO", company: "Novo Nordisk", sector: "Healthcare", marketCap: 164, price: 37.53,
      forwardPE: 11.6, fcfYield: 7.0, revenueGrowth: 5.6, roic: 39, netDebtEbitda: 0.55,
      bearFV: 28, baseFV: 50, bullFV: 68, expected5Y: 12.5, expected10Y: 11, score: 83,
      moat: "Strong / pressured", valueTrap: "Medium", conviction: "Med–High", modelKind: "fcf",
      thesis: "The obesity and diabetes franchise remains highly profitable while the valuation now embeds substantial competitive and pricing deterioration.",
      narrative: "The market may be moving from an overly optimistic monopoly narrative to an overly pessimistic permanent-share-loss narrative.",
      catalyst: "Oral obesity products, next-generation pipeline, manufacturing expansion, and stabilization of GLP-1 share.",
      risk: "Lilly compounds share gains, pipeline disappoints, pricing erodes, or patent risk arrives faster than expected.",
      trapFlags: ["Competitive share loss", "Pipeline risk", "Pricing pressure"],
      baseGrowth: 7, terminalGrowth: 2.5, discountRate: 9
    },
    {
      ticker: "META", company: "Meta Platforms", sector: "Internet Platforms", marketCap: 1880, price: 738.88,
      forwardPE: 23.0, fcfYield: 2.2, revenueGrowth: 27.7, roic: 25, netDebtEbitda: 0.2,
      bearFV: 600, baseFV: 875, bullFV: 1100, expected5Y: 12.5, expected10Y: 11.5, score: 82,
      moat: "Exceptional", valueTrap: "Low", conviction: "High", modelKind: "fcf",
      thesis: "Global social distribution, ad targeting, messaging, and AI recommendation systems remain exceptional economic assets.",
      narrative: "The central debate is whether massive AI capex creates durable incremental economics or becomes a permanent drag on FCF.",
      catalyst: "AI-driven engagement, ad efficiency, messaging monetization, and eventual capex normalization.",
      risk: "AI infrastructure spending remains structurally elevated without proportionate monetization.",
      trapFlags: ["Extreme capex intensity", "Regulatory risk"],
      baseGrowth: 13, terminalGrowth: 3.5, discountRate: 9
    },
    {
      ticker: "GOOG", company: "Alphabet", sector: "Internet Platforms", marketCap: 4240, price: 344.59,
      forwardPE: 24.5, fcfYield: 1.3, revenueGrowth: 20.1, roic: 25, netDebtEbitda: -0.7,
      bearFV: 285, baseFV: 405, bullFV: 500, expected5Y: 11.5, expected10Y: 10.5, score: 81,
      moat: "Exceptional", valueTrap: "Low", conviction: "Med–High", modelKind: "fcf",
      thesis: "Search, YouTube, Cloud, proprietary AI models, distribution, and custom silicon create one of the broadest AI monetization stacks.",
      narrative: "The stock remains attractive only if current AI/data-center capex proves productive rather than a permanently lower-FCF regime.",
      catalyst: "Cloud margin expansion, Gemini monetization, AI search economics, YouTube, and Waymo optionality.",
      risk: "Search disruption, antitrust remedies, and structurally high AI capex.",
      trapFlags: ["Search disruption", "Antitrust", "Extreme capex"],
      baseGrowth: 12, terminalGrowth: 3.5, discountRate: 8.8
    },
    {
      ticker: "UNH", company: "UnitedHealth Group", sector: "Managed Care", marketCap: 338, price: 376.32,
      forwardPE: 17.8, fcfYield: 7.0, revenueGrowth: 6.6, roic: 11, netDebtEbitda: 1.68,
      bearFV: 300, baseFV: 470, bullFV: 560, expected5Y: 11.5, expected10Y: 10, score: 78,
      moat: "Strong", valueTrap: "Medium", conviction: "Medium", modelKind: "fcf",
      thesis: "UnitedHealthcare and Optum remain scaled healthcare assets, but normalized medical-cost economics are unusually uncertain.",
      narrative: "The stock may be discounting too much permanent margin damage, but part of the reset could be structural rather than cyclical.",
      catalyst: "Medical-cost normalization, Optum stabilization, repricing, and operational repair.",
      risk: "Persistent utilization, reimbursement pressure, regulation, and simultaneous Optum deterioration.",
      trapFlags: ["Medical-cost pressure", "Regulatory risk", "Possible structural margin reset"],
      baseGrowth: 6, terminalGrowth: 2.5, discountRate: 9
    }
  ]
};