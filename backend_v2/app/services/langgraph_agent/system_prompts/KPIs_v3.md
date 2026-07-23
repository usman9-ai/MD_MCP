# Secondary Sales — KPI Definitions (Curated)

This expands `Secondary_Sales_KPIs.docx` into concrete, field-mapped definitions the agent can
compute. Every KPI below inherits the two mandatory filters from the business-info system prompt
(`Flag`, `Type Of Sale`) unless noted otherwise. Field names refer to
`secondary_sales_datasource_metadata.md`.

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
  - If a user asks for UCC, the agent should answer with `COUNTD(SK_CUSTOMER_KEY)` (distinct chemists
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
- **Distributor Stock** — **[CONFIRMED, with a scope caveat]**. `SUM(Stock)` (units) / `SUM(Vstock)`
  (value), from the `Distributor Stock` table, joined automatically via `Distributor`/`PRD`. This
  table is a **current-day snapshot only** — it has no date dimension to filter or trend on. Only
  answer "what's distributor stock right now / as of today" from this field; if the user asks for
  stock at a past date or a stock trend over time, say historical stock isn't available rather
  than returning today's figure as if it answered the question. `Vstock`'s valuation basis
  (whether it's independently sourced or `Stock × Trade Price`) is still **[NEEDS CONFIRMATION]**
  — hedge on the currency/derivation of that number specifically, even though the field itself is
  now confirmed to exist and be usable.
- **Returns, Bonus, Discount** — `SUM(Returns)`, `SUM(Bonus)`, `SUM(Discount)`, Flag=null.
  **[CONFIRMED]**

## 5. Chemist Count
Metrics: Chemist Count, Chemist Growth, Chemist Count by Region/Zone/Territory, Company-wise
Chemists. Dimensions: Distribution, Year, Month, Saletype, Focused Brand, Brand, SKU, BU, Team,
Distributor, Customer Type, Zone, City, Region, HOS, SM, RM, TSO/MIE, Brick, Chemist.

- **Chemist Count** — `COUNTD(SK_CUSTOMER_KEY)`, filtered to rows with `Sale Value` (or `Sale Unit`) > 0
  in the period, Flag=null. ⚠️ **`SK_CUSTOMER_KEY` is GEO-only** (per metadata file) — every
  Chemist Count query is forced to `Type Of Sale = 'GEO'` regardless of the default, and per
  `agent_rules.md` §2/§13b, **any other metric requested alongside Chemist Count in the same
  answer is forced to GEO too** — don't report Revenue at NATIONAL next to Chemist Count at GEO
  in one answer, even if disclosed. Use `SK_CUSTOMER_KEY`, not `CUSTOMER_NAME` (names can
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
  `Dateofsale`) and `SK_CUSTOMER_KEY`/`CUSTOMER_NAME`. ⚠️ Same GEO-only constraint as §5 —
  `SK_CUSTOMER_KEY` forces `Type Of Sale = 'GEO'` for this whole report, including the sales
  values shown alongside chemist detail. **[CONFIRMED]**
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

## 10. Stock Coverage (Days of Stock)
**[CONFIRMED — formula provided directly by stakeholder.]** How many days the current on-hand
stock will last, at the recent average daily sale rate. Splittable by Region, Distributor, or
Team — the underlying logic doesn't change, only the grouping dimension does.

**Formula:**
```
Avg Daily Sale Units (90d) = SUM(Sale Unit), actuals, over the trailing 90 days ÷ 90
Stock Coverage (Days) = Current Stock (units) ÷ Avg Daily Sale Units (90d)
```
- "Trailing 90 days" = the 90 calendar days ending at the latest available actual-data date
  (§6), not today's calendar date.
- `Stock` comes from the Distributor Stock table (metadata Table 5) — a **current-day snapshot
  only**. It is not date-filtered; it's simply joined in via `Distributor`/`PRD`.
- Per metadata file §13, `Stock`/`Vstock` are **NATIONAL only** — Stock Coverage is always run at
  `Type Of Sale = 'NATIONAL'`, regardless of the default, and per §2/§13b any other metric shown
  alongside Stock Coverage in the same answer is forced to NATIONAL too.
- **Divide-by-zero guard:** if a distributor/product had zero actual sales in the trailing 90
  days, average daily sale rate is 0 and coverage is undefined — return `NULL` and say coverage
  can't be computed for that slice (no recent sales to estimate a burn rate from), rather than an
  error or an infinite/nonsensical number.

**Worked pattern (one query, no separate arithmetic step):**
```json
{
  "fields": [
    { "fieldCaption": "Distributor" },
    { "fieldCaption": "Stock", "fieldAlias": "Current Stock (Units)" },
    { "fieldCaption": "Avg Daily Sale Units (90d)",
      "calculation": "SUM(IIF(ISNULL([Flag]), [Sale Unit], NULL)) / 90" },
    { "fieldCaption": "Stock Coverage (Days)",
      "calculation": "IIF(SUM(IIF(ISNULL([Flag]), [Sale Unit], NULL)) / 90 = 0, NULL, ZN(SUM([Stock])) / (SUM(IIF(ISNULL([Flag]), [Sale Unit], NULL)) / 90))"
       }
      ,
       {
  "fieldCaption": "Above 90 days Stock Coverage (Days) [Avg Sale > 100]",
  "calculation": "IIF((SUM(IIF(ISNULL([Flag]), [Sale Unit], NULL)) / 90) > 100, ZN(SUM([Stock])) / (SUM(IIF(ISNULL([Flag]), [Sale Unit], NULL)) / 90), NULL)",
  "sortPriority": 1, "sortDirection": "DESC"}
  ],
  "filters": [
    { "field": { "fieldCaption": "Type Of Sale" }, "filterType": "SET", "values": ["NATIONAL"] },
    { "field": { "fieldCaption": "Gregorian Date" }, "filterType": "QUANTITATIVE_DATE",
      "quantitativeFilterType": "RANGE", "minDate": "2026-04-21",
      "maxDate": "2026-07-21" }
  ]
}
```
Swap `Distributor` for `Region`/`Team`/`Alt Team` (or drop grouping entirely for a company-wide
figure) per the breakdown requested — the calculated fields don't change, only the grouping
dimension. Sort ascending by default (lowest coverage = most at-risk of stockout, generally the
more actionable direction to surface first) unless the user asks for the opposite.

---

## Cross-cutting rules for every KPI above
1. Apply the mandatory `Flag` and `Type Of Sale` filters from the business-info prompt unless a
   KPI section above explicitly overrides them (e.g., §7 forces GEO). **`Flag` only applies to
   calculations involving `Sale Value`, `Sale Unit`, `Target Value`, `Target Unit`, or their
   OP/override variants** — Stock Coverage (§10) uses `Stock`/`Vstock`, which have no `Flag`
   applicability at all; do not filter or condition on `Flag` for that KPI's stock component.
2. **Default reporting window is YTD** (current fiscal/calendar year to the date passed in via
   `f"Current date: {current_date}"` in the prompt — see recommendation in the accompanying
   review) — never silently pull prior-year totals as the headline number unless the user asks
   for a specific past period or an explicit YoY/GOLY comparison.
3. Where a KPI is marked **[NEEDS CONFIRMATION]**, the agent must state its working assumption
   in plain language as part of the answer, not silently compute and present a number as if it
   were an agreed-upon definition.
4. Where a metric is **[NOT AVAILABLE]**, say so plainly rather than approximating from an
   unrelated field.
