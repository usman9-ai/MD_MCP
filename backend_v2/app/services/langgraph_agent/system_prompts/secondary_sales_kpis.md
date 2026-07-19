# Secondary Sales — KPI Definitions (Curated)

Every KPI below inherits the two mandatory filters from the business-info system prompt
(`Flag`, `Type Of Sale`) unless noted otherwise.

Definitions marked **[CONFIRMED]** are directly computable from the datasource with formulas
established in the existing business-info prompt or unambiguous from field descriptions.
Definitions marked **[NEEDS CONFIRMATION]** use business terminology (GOLY, UCC, etc.) whose
exact calculation isn't fully specified in the source documents — the agent should state its
assumed definition in the answer and flag it as unconfirmed, rather than presenting it as
certain, until a stakeholder confirms.

---

## 1. Executive Summary (National Sales)
**Scope:** `Type Of Sale = NATIONAL`. Dimensions available to break down by: Company, Date,
Saletype, BU, Team, Focused Brand, Brand, SKU (`PRD`), Distributor, Distributor City.

- **Day Sales** — `SUM(Sale Value)` / `SUM(Sale Unit)`, Flag=null, for the single latest
  `Gregorian Date` with data (or a user-specified day). **[CONFIRMED]**
- **MTD Achievement % of Target and Sales** — `SUM(Sale Value)` MTD ÷ `SUM(Target Value)` MTD.
  Since `Target Value` posts once on the 1st of the month, the MTD target must be pro-rated:
  `Target Value (month) × (elapsed calendar days in month ÷ total days in month)`, per the
  existing business-info rule. **[CONFIRMED]**
- **YTD Achievement %** — same pattern, summed from the 1st of the fiscal/calendar year (default
  calendar year unless the user asks for fiscal year) through the current date, vs. the sum of
  all posted monthly targets in that span (no pro-ration needed for full elapsed months; only
  the current partial month needs pro-ration). **[CONFIRMED]**
- **GOLY (Growth Over Last Year)** — `(Current Year Sale Value − Last Year Sale Value) ÷ Last
  Year Sale Value`, computed over the same YTD window in both years (i.e., same date range,
  different `Year`). **[CONFIRMED — standard YoY growth definition; matches "Current Year Sales
  and Last Year Sales" being listed alongside it in the same report.]**
- **Focused Brands: Achievement, GOLY, Contribution (%)** — filter to `Focus Flag = 'FOCUSED'`
  via the Focused Brands join (remember to also filter `Year1` to the relevant year). Achievement
  and GOLY use the same formulas as above, scoped to focused products only. Contribution % =
  `SUM(Sale Value) where Focus Flag='FOCUSED' ÷ SUM(Sale Value) all products`, same period/scope.
  **[CONFIRMED]**

## 2. Comparative Analysis
Compares Target, Sales, Bonus, Discount, Returns across two user-specified date periods.
Dimensions: Company, Saletype, BU, Team, Focused Brand, Brand, SKU, Distributor, `With And
Without Bonus`.

- Each metric is `SUM(field)` for Period A vs. Period B, both filtered with the same Flag/Type Of
  Sale scope, differing only in the `Gregorian Date` range. Present as a side-by-side comparison
  with absolute and % change. **[CONFIRMED]**
- If the user doesn't name two periods explicitly, ask which two periods to compare rather than
  guessing — this report is inherently a two-period comparison, so a single default period isn't
  a safe assumption.

## 3. Target vs Achievement
Breakdown by Region, Brand, SKU. Metrics: LY Targets, CY Sales, CY Targets, UCC, LY UCC, UCC
Growth %. Dimensions: Company, Year, Month, Saletype, BU, Team, Focused Brand, Brand, SKU,
Category, Zone, Region, SM, RM, Brick (`Brickid`).

- **LY/CY Targets, CY Sales** — same `Target Value`/`Sale Value` aggregation pattern as §1, with
  `Year` filtered to last year vs. current year respectively. **[CONFIRMED]**
- **UCC / LY UCC / UCC Growth %** — **[NEEDS CONFIRMATION]**. Not defined in either source
  document. In pharma secondary-sales reporting "UCC" commonly stands for something like "Unique
  Chemist Count" or "Universe Chemist Coverage," but that is an assumption, not a confirmed
  definition from this project's stakeholders. Until confirmed:
  - If a user asks for UCC, the agent should answer with `COUNTD(Custid)` (distinct chemists
    with `Sale Value` > 0 in the period, Flag=null, scoped Type Of Sale) as the most defensible
    reading, but must explicitly say "I'm using Unique Chemist Count (distinct chemists with a
    sale) as the definition of UCC — let me know if your team means something different."
  - **Action item for you (not the agent):** confirm the exact UCC definition and formula with
    the business stakeholder before shipping this KPI; update this file once confirmed so the
    agent stops hedging.

## 4. Distributor's 360 View
Distributor-wise: Primary Sales, Secondary Sales, Distributor Stock, Returns, Bonus, Discount.
Dimensions: Company, Year, Month, Distributor, SKU, Focused Brand.

- **Primary Sales** — `SUM(SALE_VALUE_PRIMARY)` / `SUM(SALE_UNIT_PRIMARY)`. **[CONFIRMED field
  exists — see Known Issue in metadata file; this field was originally excluded as "not
  required" but is needed here.]** Filter conventions (Flag/Type Of Sale) for this field aren't
  documented — confirm whether Primary Sales rows carry the same Flag semantics as Secondary
  Sales, or whether they're a separate, unflagged series. Treat as **[NEEDS CONFIRMATION]** on
  the filter mechanics specifically, even though the field itself is confirmed.
- **Secondary Sales** — `SUM(Sale Value)` / `SUM(Sale Unit)`, standard Flag/Type Of Sale filters.
  **[CONFIRMED]**
- **Distributor Stock** — **[NOT AVAILABLE IN THIS DATASOURCE]**. No stock/inventory field exists
  in any of the four logical tables. If asked, the agent should say this metric isn't available
  from the current data source rather than approximating it (e.g., don't infer stock from
  sales-minus-returns, which would be a made-up proxy, not the actual metric).
- **Returns, Bonus, Discount** — `SUM(Returns)`, `SUM(Bonus)`, `SUM(Discount)`, Flag=null.
  **[CONFIRMED]**

## 5. Chemist Count
Metrics: Chemist Count, Chemist Growth, Chemist Count by Region/Zone/Territory, Company-wise
Chemists. Dimensions: Distribution, Year, Month, Saletype, Focused Brand, Brand, SKU, BU, Team,
Distributor, Customer Type, Zone, City, Region, HOS, SM, RM, TSO/MIE, Brick, Chemist.

- **Chemist Count** — `COUNTD(Custid)`, filtered to rows with `Sale Value` (or `Sale Unit`) > 0
  in the period, Flag=null, Type Of Sale as scoped. Use `Custid`, not `CUSTOMER_NAME` (names can
  repeat across distinct chemist IDs). **[CONFIRMED — standard distinct-count pattern; not
  explicitly spelled out in source docs but this is the only way to compute "count of chemists"
  from a transaction-grain fact table, so treat as safe to use without hedging in the answer.]**
- **Chemist Growth** — `(Current Period Chemist Count − Prior Period Chemist Count) ÷ Prior
  Period Chemist Count`, same COUNTD pattern for each period. **[CONFIRMED]**
- **By Region/Zone/Territory/Company** — same COUNTD, grouped by `Region` (fact table), or by
  the VFF Hierarchy geography fields for Zone/Territory framing — see the "Correction to
  business-info guidance" note in the metadata file about pulling in VFF Hierarchy for this
  report type. **[CONFIRMED pattern; NEEDS CONFIRMATION on which exact VFF Hierarchy field maps
  to "Zone" vs "Territory," since `Dsmbase`/`Smbase`/`Tercode` are all geography-adjacent but
  inconsistently documented — see metadata file, Table 3.]**
- **HOS, TSO/MIE** — these role labels appear in the KPI doc's dimension list but do not have an
  exact matching field name in the metadata (`VFF Hierarchy` has no field literally called `HOS`
  or `MIE`). **[NEEDS CONFIRMATION]** — confirm which VFF Hierarchy field these map to before the
  agent attempts to break results down by them; otherwise it risks silently substituting the
  wrong field.

## 6. Daily Chemist Sales
Same dimension set as §5. Metrics: last 3 months chemist sales (week-wise, by Team/Zone/RM),
daily chemist sales.

- **Daily chemist sales** — `SUM(Sale Value)` / `SUM(Sale Unit)` grouped by `Gregorian Date` (not
  `Dateofsale`) and `Custid`/`CUSTOMER_NAME`, standard Flag/Type Of Sale filters. **[CONFIRMED]**
- **Week-wise, last 3 months** — filter `Gregorian Date` to the trailing 3 calendar months from
  the current date (passed in via the date context, see the note at the end of this file), grouped
  by `Week Number` (Dim Time) and the requested org dimension (Team/Zone/RM). **[CONFIRMED
  pattern]**

## 7. Geographical Analysis (Geographical Sales)
Same headline metrics as §1 (Day Sales, MTD/YTD Achievement, GOLY) but explicitly scoped to
`Type Of Sale = GEO`. Dimensions: Company, Date, Saletype, BU, Team, Focused Brand, Brand, SKU,
Category, Distributor, Zone, Region, SM, RM, TSO/MIE, Brick.

- All formulas identical to §1, with the `Type Of Sale` filter forced to `GEO` regardless of the
  business-info default (NATIONAL). This report is GEO by definition — the agent doesn't need to
  ask which scope for this report type specifically. **[CONFIRMED]**

## 8. Discount & Bonus Analysis
Breakdown of Discount, Bonus by Year, Distributor, SKU. Dimensions: Company, Year, Sale Type, BU,
Team, Focused Brands, Brand, Product, Region.

- `SUM(Discount)`, `SUM(Bonus)`, Flag=null, grouped by the requested dimension(s), no additional
  logic beyond standard filters. **[CONFIRMED]**

## 9. OP vs Actual Discount / Bonus
Year-on-year: Gross Sales, FOC Value, Discount Value, Net Sales. Dimensions: Company, Year,
Month, Saletype, BU, Team, Focused Brands, Product, Region.

- **Gross Sales** — **[NEEDS CONFIRMATION]**. Likely `Sale Value` before discount/bonus deduction,
  but no field is explicitly labeled "Gross Sales" — confirm whether this equals `Sale Value` as
  currently defined, or `Sale Value + Discount` (i.e., whether the stored `Sale Value` is already
  net of discount).
- **FOC Value** ("Free of Cost") — **[NEEDS CONFIRMATION]**. No field maps to this directly.
  Possibly derived from `Bonus` (bonus units given free), but bonus is currently defined as a
  value/amount field, not explicitly "free stock value" — confirm before using `Bonus` as a proxy.
- **Discount Value** — `SUM(Discount)`. **[CONFIRMED]**
- **Net Sales** — **[NEEDS CONFIRMATION]**, pending resolution of Gross Sales above (`Net Sales =
  Gross Sales − Discount Value − FOC Value`, algebraically, once those two are confirmed).
- **"OP vs Actual"** in the report title refers to `Flag='O'` (override/operational target) vs.
  `Flag=null` (actual) — consistent with the Known Issue in the metadata file about the O/T
  target semantics not being fully confirmed either.

---

## General rules for every question
1. Apply the mandatory `Flag` and `Type Of Sale` filters from the business-info prompt unless a
   KPI section above explicitly overrides them (e.g., §7 forces GEO).
2. **Default reporting window is YTD** (current fiscal/calendar year to the date passed in via
   `f"Current date: {current_date}"` in the prompt — see recommendation in the accompanying
   review) — never silently pull prior-year totals as the headline number unless the user asks
   for a specific past period or an explicit YoY/GOLY comparison.
3. Where a KPI is marked **[NEEDS CONFIRMATION]**, the agent must state its working assumption
   in plain language as part of the answer, not silently compute and present a number as if it
   were an agreed-upon definition.
4. Where a metric is **[NOT AVAILABLE]**, say so plainly rather than approximating from an
   unrelated field.
