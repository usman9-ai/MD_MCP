# IMS Datasource — KPIs (Curated)

Source datasource: `GV_IMS_NEW_UNPVT` (see `IMS_Metadata.md` for the field list). This file
tells the agent how each business metric on the IMS datasource is computed. Pair it with the
metadata file (which fields exist) and the general agent-rules file (mandatory behavior for
every query).

The IMS datasource is **Pakistan pharma industry-level market data** — the same monthly
figures used to size competitors and measure Martin Dow Group's standing in the market. It is
distinct from the internal Secondary Sales datasource in three ways that shape every KPI here:

1. It covers the **whole industry**, not just MDG's own sell-out — so every competitor
   corporation/manufacturer is a row too.
2. Every fact row is a **month**, not a day — the finest date grain is `Month Date`.
3. Data lags the current calendar month by **2 months** — see cross-cutting rule §A below.

---

## Cross-cutting rules for every IMS KPI

### A. Data lag — latest available month is `current month − 2`
IMS refreshes on a two-month lag. If today is in July 2026, the latest available month in the
data is **May 2026** (June and July are not yet loaded). When August 2026 begins, the data
refreshes and the latest available month becomes **June 2026**. The full history window is a
rolling ~60 months ending at the latest available month.

- **Never treat "current month" as the latest data month.** For any KPI whose date scope
  depends on "now" — MAT, YTD, latest-month, growth — the anchor is the latest available
  month, not the calendar month the query is running in.
- Use the session-injected current date and subtract 2 months to derive the latest available
  month. Do **not** run a `MAX(Month Date)` probe query to discover it — same rule as the
  Secondary Sales latest-date rule; use the derived value directly.
- **State the latest-month anchor in every answer** (e.g. "MAT through May 2026") — a silent
  default risks being misread as through-July.

### B. `Unit Value` mandatory filter or IIF-condition — every query, no exceptions
`Month Value` is a single measure column that stores **both** sales-value rows (PKR) and
sales-unit rows (counts), disambiguated by the `Unit Value` flag:
- `Unit Value = 'VALUE'` → `Month Value` is sales in **PKR**.
- `Unit Value = 'UNIT'` → `Month Value` is **unit count** (packs sold).

An unfiltered `SUM(Month Value)` blends PKR and unit rows into a meaningless number. Every
query must either:
1. Filter `Unit Value` to exactly one of `'VALUE'` or `'UNIT'` at the query level, **or**
2. Wrap every use of `Month Value` in an `IIF([Unit Value] = 'VALUE', [Month Value], NULL)`
   (or `'UNIT'`) inside a calculated field — required whenever value and units need to appear
   side-by-side in the same query.

**Default: `Unit Value = 'VALUE'` (PKR)** unless the user explicitly asks for units, sold
volumes, packs, or a units-based ranking. State the choice in the answer.

### C. Date field is `Month Date`, always
All date filtering, grouping, and trending uses `Month Date` — never `Prod Lch` (that's the
product's original launch date, not the reporting period). Filter with explicit
`YYYY-MM-DD` boundaries (first day of the start month through first day of the end month,
inclusive) — do not rely on `YEAR(...)`/`MONTH(...)` conditions inside calculations for
period differentiation, same discipline as the Secondary Sales rules file.

### D. Class hierarchy — never substitute levels
`Therapy Area (ATC1)`, `Therapeutic Class (ATC2)`, `Pharmacological Class (ATC3)`,
`Chemical Subclass (ATC4)`, and `Composition (Molecule)` are five distinct levels of the
classification hierarchy — not synonyms. If a user says "class" or "TC" without a number, ask
which level. Do not silently pick one.

### E. Corp Des vs Manu Des — the two ways to represent "us"
Both fields identify a selling entity, at different levels of the corporate hierarchy:
- **`Corp Des`** = corporate group / parent-holding level. Martin Dow Group's row here is
  the single value `MARTIN DOW GROUP`. Competitors also appear at their group level.
- **`Manu Des`** = individual manufacturer within a group. Martin Dow Group's rows here are
  the three values `Martin Dow Limited`, `Martin Dow Marker`, and `Welnox` (matching the
  three `Alt Company Code` values in the Secondary Sales datasource).

Every `Manu Des` rolls up to exactly one `Corp Des`. Pick the level that matches the
question — consolidated group standing → `Corp Des`; company-wise breakdown → `Manu Des`.
Default is `Corp Des` (consolidated group view) if the user hasn't specified. See §3 for how
this default applies to Market Standing specifically.

### F. `Prod Des` vs `Corp Des` vs `Manu Des` — commonly confused
- `Prod Des` = the product/brand name (e.g. `Evion`).
- `Corp Des` = corporate group (e.g. `MARTIN DOW GROUP`).
- `Manu Des` = individual manufacturer (e.g. `Martin Dow Limited`).

Do not swap one for another even if the user's phrasing is loose ("which company makes X",
"top brands by Y"). If it's genuinely ambiguous which of the three the user means, ask.

---

## 1. Sale Value / Sale Units
**[CONFIRMED]** The base measure — total PKR sales (or unit count) over a specified period,
optionally cut by any dimension (Corp Des, Manu Des, Prod Des, Pack Des, any Class level,
Molecule).

**Formula:**
```
Sale Value (PKR)  = SUM(Month Value) where Unit Value = 'VALUE'
Sale Units        = SUM(Month Value) where Unit Value = 'UNIT'
```

**Worked pattern — total Sale Value for a given period, grouped by Corp Des:**
```json
{
  "fields": [
    { "fieldCaption": "Corp Des", "fieldAlias": "Corporate Group" },
    {
      "fieldCaption": "Sale Value (PKR)",
      "calculation": "SUM([Month Value])",
      "sortPriority": 1,
      "sortDirection": "DESC",
      "maxDecimalPlaces": 0
    }
  ],
  "filters": [
    { "field": { "fieldCaption": "Unit Value" }, "filterType": "SET", "values": ["VALUE"] },
    {
      "field": { "fieldCaption": "Month Date" },
      "filterType": "QUANTITATIVE_DATE",
      "quantitativeFilterType": "RANGE",
      "minDate": "2025-06-01",
      "maxDate": "2026-05-01"
    }
  ]
}
```
Swap `Corp Des` for `Manu Des`, `Prod Des`, `Composition (Molecule)`, or any class-level
field per the requested cut. For units, swap the `Unit Value` filter to `["UNIT"]` and rename
the field alias accordingly.

---

## 2. MAT — Moving Annual Total (MAT 1 through MAT 5)
**[CONFIRMED]** MAT is a rolling 12-month cumulative — the industry-standard smoothing window
for pharma market analysis, insulating comparisons from month-to-month noise and seasonality.

**Definition:** MAT N = sum of `Month Value` over the 12 months ending at the (N-th most
recent) year boundary, anchored to the latest available month (rule §A). The five MATs
available at any time:

| MAT | Window (relative to latest available month `L`)      |
|----|-------------------------------------------------------|
| MAT 1 | `L − 11 months` through `L`   — the most recent 12 months (rolling year)   |
| MAT 2 | `L − 23 months` through `L − 12 months`  — the year prior to MAT 1         |
| MAT 3 | `L − 35 months` through `L − 24 months`                                    |
| MAT 4 | `L − 47 months` through `L − 36 months`                                    |
| MAT 5 | `L − 59 months` through `L − 48 months`  — the 5th most recent year        |

**Worked example** (illustrative — latest available month = May 2026):
- MAT 1 = **Jun 2025 – May 2026**
- MAT 2 = **Jun 2024 – May 2025**
- MAT 3 = **Jun 2023 – May 2024**
- MAT 4 = **Jun 2022 – May 2023**
- MAT 5 = **Jun 2021 – May 2022**

When the data refreshes (start of a new calendar month), every MAT window rolls forward by
one month — MAT 1 always ends at the newest available month.

**Rules:**
- The MAT window is a whole number of months — always start on the 1st of the start month and
  end on the 1st of the month **after** the end month (VDS `QUANTITATIVE_DATE` `RANGE` treats
  `maxDate` as exclusive of the day after; safest is to use the first of the end-month + 1).
  Alternatively, filter by explicit `Month Date` = first-of-month values for each of the 12
  months to include.
- Default MAT is **MAT 1** unless the user specifies which MAT (e.g. "MAT 3", "5-year trend").
- To show multiple MATs side-by-side, build each one as its own calculated field with its
  hard-coded date boundary — the same "one query, self-contained date logic per calc" pattern
  used for GOLY in the Secondary Sales rules file.

**Worked pattern — MAT 1 vs MAT 2, side-by-side, by Corp Des, with growth:**
The `2026-05-01` / `2025-06-01` / etc. literals below are illustrative — substitute the
current session's latest-available-month boundaries every time.
```json
{
  "fields": [
    { "fieldCaption": "Corp Des", "fieldAlias": "Corporate Group" },
    {
      "fieldCaption": "MAT 1 (Jun 2025 – May 2026)",
      "calculation": "SUM(IIF([Month Date] >= #2025-06-01# AND [Month Date] <= #2026-05-01#, [Month Value], NULL))",
      "maxDecimalPlaces": 0
    },
    {
      "fieldCaption": "MAT 2 (Jun 2024 – May 2025)",
      "calculation": "SUM(IIF([Month Date] >= #2024-06-01# AND [Month Date] <= #2025-05-01#, [Month Value], NULL))",
      "maxDecimalPlaces": 0
    },
    {
      "fieldCaption": "MAT 1 vs MAT 2 Growth %",
      "calculation": "IIF(SUM(IIF([Month Date] >= #2024-06-01# AND [Month Date] <= #2025-05-01#, [Month Value], NULL)) = 0, NULL, (SUM(IIF([Month Date] >= #2025-06-01# AND [Month Date] <= #2026-05-01#, [Month Value], NULL)) - SUM(IIF([Month Date] >= #2024-06-01# AND [Month Date] <= #2025-05-01#, [Month Value], NULL))) / SUM(IIF([Month Date] >= #2024-06-01# AND [Month Date] <= #2025-05-01#, [Month Value], NULL)) * 100)",
      "maxDecimalPlaces": 2,
      "sortPriority": 1,
      "sortDirection": "DESC"
    }
  ],
  "filters": [
    { "field": { "fieldCaption": "Unit Value" }, "filterType": "SET", "values": ["VALUE"] },
    {
      "field": { "fieldCaption": "Month Date" },
      "filterType": "QUANTITATIVE_DATE",
      "quantitativeFilterType": "RANGE",
      "minDate": "2024-06-01",
      "maxDate": "2026-05-01"
    }
  ]
}
```
The outer `Month Date` range filter is a performance guardrail (limits scanned rows to the
union of the two windows) — the per-calc `IIF` date conditions do the actual bucketing, per
the "self-contained date logic per calc" rule.

For a 5-year MAT trend (MAT 1 through MAT 5 side-by-side), extend the same pattern with
three additional calculated fields for MAT 3 / MAT 4 / MAT 5, and widen the outer date filter
to cover the full 60-month span.

---

## 3. Market Standing / Ranking
**[CONFIRMED]** Where Martin Dow Group stands versus other pharma corporations/manufacturers
in the Pakistan market, along any dimension (whole market, a Class 1–4 level, a specific
molecule, or a specific brand). This is the headline "market share / rank" question.

**Approach:**
1. Aggregate `Month Value` (with the appropriate `Unit Value` filter) grouped by the chosen
   competitor grain — **`Corp Des`** by default (group view), **`Manu Des`** if the user asks
   for individual-company breakdown.
2. Sort **descending** on the aggregated total.
3. Report the **top 20** in the answer.
4. Then explicitly state **MDG's position in the same ranked list** — its rank number and
   its total — regardless of whether MDG appears in the top 20 or below it.
5. Include Market Share % (MDG's share of the total across all ranked competitors) as a
   secondary figure — this is what "our standing" ultimately answers.

**Default competitor grain and MDG identifier — match the two:**

| User intent                              | Grouping field | MDG identifier(s)                                     |
|------------------------------------------|----------------|-------------------------------------------------------|
| Consolidated group standing (**default**) | `Corp Des`     | `Corp Des = 'MARTIN DOW GROUP'` (single row)           |
| Company-wise breakdown                    | `Manu Des`     | `Manu Des IN ('Martin Dow Limited','Martin Dow Marker','Welnox')` (three rows, each with its own rank) |

The grouping field and the MDG-identifier field **must match** — do not mix (e.g. rank on
`Corp Des` but then look up individual `Manu Des` values in the result, or vice versa). The
whole ranked list must be at one grain.

**Rules:**
- **Time scope:** default to **MAT 1** (rolling 12 months ending at the latest available
  month) unless the user asks for a different period (a specific MAT, a specific calendar
  year, a specific month). State the window used.
- **Dimension scope:** apply the class/molecule/brand filter (if any) at the query level —
  every competitor in the returned ranking then represents its sales in that same slice, so
  ranks are apples-to-apples.
- **Measure:** default to `Unit Value = 'VALUE'` (PKR-based ranking); switch to `'UNIT'` only
  if explicitly asked (unit-share ranking is a different question and the ranks can differ).
- **Pagination:** pull the full ranked list (not just 20 rows) so MDG's position is
  discoverable even if it falls outside the top 20 — then present only the top 20 plus MDG's
  row in the answer. The Pakistan pharma corporate universe is small enough (order of
  hundreds of Corp Des values) that pulling the full list is not a performance concern.
- **Ties:** exact ties on annual PKR sales are extremely rare at this grain; standard sort
  order suffices.

**Worked pattern — MDG standing in overall Pakistan pharma market, MAT 1 (default), by
`Corp Des`. Substitute the current MAT 1 boundaries every time:**
```json
{
  "fields": [
    { "fieldCaption": "Corp Des", "fieldAlias": "Corporate Group" },
    {
      "fieldCaption": "MAT 1 Sales (PKR)",
      "calculation": "SUM([Month Value])",
      "sortPriority": 1,
      "sortDirection": "DESC",
      "maxDecimalPlaces": 0
    },
    {
      "fieldCaption": "Market Share %",
      "calculation": "SUM([Month Value]) / TOTAL(SUM([Month Value])) * 100",
      "maxDecimalPlaces": 2
    }
  ],
  "filters": [
    { "field": { "fieldCaption": "Unit Value" }, "filterType": "SET", "values": ["VALUE"] },
    {
      "field": { "fieldCaption": "Month Date" },
      "filterType": "QUANTITATIVE_DATE",
      "quantitativeFilterType": "RANGE",
      "minDate": "2025-06-01",
      "maxDate": "2026-05-01"
    }
  ]
}
```

**Worked pattern — MDG standing within a specific Class 2 (e.g. `Vitamins`), MAT 1, by
`Corp Des`.** Add a `Therapeutic Class (ATC2)` `SET` filter for the class value being scoped
to — everything else identical to the pattern above. When ranking within a class/molecule
slice, the "Market Share %" figure is share of that slice, not share of the whole market —
state this in the answer.

**Worked pattern — company-wise (Manu Des) view instead of consolidated group:** swap the
grouping field to `Manu Des` and (if the user asked "where do our companies stand") locate
each of the three MDG `Manu Des` values in the returned ranked list, reporting each rank
separately.

**Answer composition for a market-standing question:**
1. Lead with MDG's headline rank and share (e.g. "MARTIN DOW GROUP ranks #4 in the Pakistan
   pharma market for MAT 1 (Jun 2025 – May 2026), with a 5.8% share of PKR 480 Bn total").
2. Show the top 20 as a compact ranked table.
3. If MDG is outside the top 20, show MDG's own row explicitly below the top-20 table with
   its rank, sales, and share — do not hide it because it didn't make the cut.
4. Disclose scope in the standard way (latest month anchor, MAT window, `Unit Value` used,
   competitor grain used, dimension slice if any).

---

## 4. MAT-over-MAT Growth
**[CONFIRMED]** Year-over-year growth using MAT windows instead of calendar years — same
smoothing benefit as MAT itself; the natural growth measure on this datasource.

**Formula:**
```
MAT-over-MAT Growth % = (MAT N − MAT N+1) ÷ MAT N+1 × 100
```
Default is **MAT 1 vs MAT 2** (most recent rolling year vs the year before it). This is the
"how is the market / how are we growing" question in one number.

Use the same self-contained per-calc date-boundary pattern shown in §2 — one query, both MAT
totals as calculated fields, growth as a third calculated field. Guard the denominator with
an `IIF( ... = 0, NULL, ...)` to avoid divide-by-zero (per general Rule 5 in the agent-rules
file).

Splittable by any dimension the user asks for — `Corp Des` (who's growing fastest), `Prod Des`
(which brands are growing), any class level (which therapy areas are growing). Cross-cut with
Market Standing (§3) to answer "who is gaining/losing share" — but note that Market Share
Change is a distinct KPI from Growth (share can rise while sales fall if the market shrinks
faster) — do not conflate them.

---

## 5. Product / Brand Analysis (`Prod Des`, `Pack Des`, `Prod Lch`)
**[CONFIRMED for the measure; standard filter rules]** Straight product-level sales analysis
— what's selling in the market, at what pack strength, and how a launch is performing.

- **By brand** (`Prod Des`): the "top brands" question — group by `Prod Des`, aggregate
  `Month Value` with the standard `Unit Value` filter, sort DESC. Optionally cross-filter to
  a single `Corp Des` or `Manu Des` to see just that company's brands.
- **By pack** (`Pack Des`): drill into which strengths/dosages of a brand are moving — group
  by `Prod Des` + `Pack Des`, filter to the brand of interest.
- **Launch performance** (`Prod Lch`): use `Prod Lch` only as a **filter/reference dimension**
  ("brands launched after 2023"), never as the date field for trending — trending is always on
  `Month Date` (rule §C). Post-launch trajectory = `Month Value` trended by `Month Date` for
  a brand filtered by `Prod Lch` window.

Same `Unit Value` and `Month Date` discipline as every other KPI here.

---

## Pre-flight checklist (in addition to the general agent-rules checklist)

- [ ] Is `Unit Value` filtered to exactly one of `'VALUE'` / `'UNIT'`, OR is every use of
      `Month Value` wrapped in an `IIF([Unit Value] = ..., [Month Value], NULL)`?
- [ ] Is the `Month Date` scope anchored to the **latest available month** (current calendar
      month − 2), and is that anchor stated in the answer?
- [ ] For MAT queries: is each MAT calculated with its own self-contained date boundary in
      `IIF(...)` rather than relying on the outer date filter alone to differentiate MATs?
- [ ] For class/hierarchy questions: has the user's "class" been resolved to a specific level
      (`Therapy Area (ATC1)` / `Therapeutic Class (ATC2)` / `Pharmacological Class (ATC3)` /
      `Chemical Subclass (ATC4)` / `Composition (Molecule)`)?
- [ ] For market-standing questions: does the grouping field (`Corp Des` or `Manu Des`) match
      the MDG identifier (`MARTIN DOW GROUP` or the three individual companies) in the same
      grain?
- [ ] Is MDG's own rank explicitly reported even if it falls outside the top 20?
- [ ] Is Market Share % computed as share of the correct base (whole market vs class-slice
      vs molecule-slice) and stated as such?
