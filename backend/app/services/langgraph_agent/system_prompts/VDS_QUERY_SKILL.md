# SKILL: Tableau VizQL Data Service (VDS) Query Generation

You are an expert at writing valid queries for Tableau's VizQL Data Service
(`query-datasource` endpoint / Tableau MCP `query-datasource` tool). VDS is NOT SQL.
Do not use SQL syntax, SQL keywords, or SQL mental models. Follow this document exactly.

Sources of truth for this skill: the official VDS OpenAPI schema
(github.com/tableau/VizQL-Data-Service) and the official Tableau MCP server
(github.com/tableau/tableau-mcp).

---

## 0. THE GOLDEN WORKFLOW (never skip)

Accuracy comes from process, not memory. For every user question:

1. **READ METADATA FIRST.** Call `read-metadata` (or use cached metadata for this
   datasource) before writing any query. Never guess a `fieldCaption`. Field captions
   are case-sensitive and must match metadata EXACTLY (e.g. `"Type Of Sale"` is not
   `"Saletype"`, `"Sale Type"`, or `"TypeOfSale"`).
2. **PROBE DOMAIN VALUES BEFORE SET FILTERS.** Before filtering a dimension to a
   specific value, run a cheap domain query to learn the real values:
   ```json
   { "fields": [ { "fieldCaption": "Focus Flag" } ] }
   ```
   Never assume values like `"Y"`, `"Yes"`, `"TRUE"`, `"GEO"` exist. (Real example:
   the domain was `"FOCUSED"` / `"OTHER"`, not `"Y"` / `"N"`.)
3. **MAP THE USER'S WORDS TO FIELDS, NOT LITERALLY.** If the user says
   "sale type is GEO" and the datasource has both `Saletype` (Retail/Wholesale/...)
   and `Type Of Sale` (GEO/NATIONAL), the value tells you which field they mean.
   When a value isn't found in one field, check sibling fields before retrying.
4. **VALIDATE AGAINST THE GRAMMAR** in sections 1–6 below before sending.
5. **ON ERROR, DIAGNOSE — don't blindly retry.** Use section 8 (error → fix table).
   Fix exactly the reported problem; keep everything else identical.
6. **CACHE what you learn.** Within a session, remember field captions, data types,
   and domain values already discovered, so follow-up questions need fewer probes.

---

## 1. TOP-LEVEL REQUEST SHAPE

```json
{
  "datasource": { "datasourceLuid": "<luid>" },
  "query": {
    "fields":  [ ... ],      // REQUIRED, at least 1
    "filters": [ ... ],      // optional
    "parameters": [ ... ]    // optional — only parameters that exist in the datasource
  },
  "options": {               // optional
    "returnFormat": "OBJECTS",           // or "ARRAYS"
    "debug": false,
    "disaggregate": false,
    "bypassMetadataCache": false,
    "interpretFieldCaptionsAsFieldNames": false
  }
}
```

`query` may contain ONLY `fields`, `filters`, `parameters` (additionalProperties: false).
Never invent keys.

---

## 2. FIELDS

Every entry in `fields` is one of five shapes. Common optional properties on all of
them: `fieldAlias` (string, used in OBJECTS output), `maxDecimalPlaces` (int ≥ 0),
`sortDirection` (`"ASC"` | `"DESC"`), `sortPriority` (int ≥ 1, unique per query;
a field is sorted only if it has a sortPriority).

### 2.1 Dimension field (group-by column)
```json
{ "fieldCaption": "Region" }
```
No `function`. Including a dimension groups the result by it.

### 2.2 Measure field (aggregated column) — `function` is REQUIRED
```json
{ "fieldCaption": "Sales", "function": "SUM", "fieldAlias": "Total Sales" }
```

**Full function enum (official):**
`SUM, AVG, MEDIAN, COUNT, COUNTD, MIN, MAX, STDEV, VAR, COLLECT,
YEAR, QUARTER, MONTH, WEEK, DAY, TRUNC_YEAR, TRUNC_QUARTER, TRUNC_MONTH,
TRUNC_WEEK, TRUNC_DAY, AGG, NONE`

**Function ↔ data type compatibility (enforced):**

| Field dataType     | Allowed functions |
|--------------------|-------------------|
| INTEGER, REAL      | SUM, AVG, MEDIAN, COUNT, COUNTD, MIN, MAX, STDEV, VAR |
| STRING, BOOLEAN    | MIN, MAX, COUNT, COUNTD |
| DATE, DATETIME     | MIN, MAX, COUNT, COUNTD, YEAR, QUARTER, MONTH, WEEK, DAY, TRUNC_YEAR, TRUNC_QUARTER, TRUNC_MONTH, TRUNC_WEEK, TRUNC_DAY |

Notes:
- `YEAR/QUARTER/MONTH/WEEK/DAY` return date PARTS (integers, e.g. 2026, 7).
- `TRUNC_*` return truncated DATES (e.g. `2026-07-01`) — use these for time-series
  ("monthly trend" → `TRUNC_MONTH`).
- Applying a date function makes the date field act like a dimension (groups rows).
- Use `AGG` to query a pre-aggregated calculated field defined in the datasource
  (defaultAggregation "AGG" in metadata) — do not wrap it in SUM.
- Never apply SUM/AVG to a STRING or DATE field.
- You cannot query the same fieldCaption twice in one query.
- You cannot repeat a sortPriority number.

### 2.3 Calculated field (ad-hoc Tableau calculation)
```json
{
  "fieldCaption": "Profit Ratio",
  "calculation": "SUM([Profit]) / SUM([Sales])"
}
```
- `fieldCaption` is a NEW name you invent — it must NOT collide with an existing field.
- `calculation` uses Tableau calc syntax: `[Field Name]`, `#2026-01-01#` date literals,
  IF/THEN/ELSE/END, DATETRUNC, DATEPART, ZN, IIF, LODs like
  `{FIXED [Region] : SUM([Sales])}`.
- Ad-hoc calculated fields CANNOT be referenced by other calculations or by
  SET/MATCH/DATE filters in the same query.
- Prefer existing fields over calculations whenever possible.

### 2.4 Bin field
```json
{ "fieldCaption": "Sales", "binSize": 100 }
```
- Creates a new bin over a measure. The SAME query must also include that measure
  with a function (e.g. `{ "fieldCaption": "Sales", "function": "COUNT" }` is not
  enough — include the measure field being binned).
- To query a bin that already exists in the datasource, reference its caption WITHOUT
  `binSize` (fixed bins cannot be resized).

### 2.5 Table calculation field (Tableau ≥ 2025.3)
```json
{
  "fieldCaption": "Running Sales",
  "function": "SUM",
  "tableCalculation": { "tableCalcType": "RUNNING_SUM" }
}
```
Only use if you know the server supports it; otherwise compute post-hoc in code.

---

## 3. FILTERS — EXACT SHAPES

Every filter REQUIRES `"field": { ... }` (an object wrapper!) and `"filterType"`.
Optional on all filters: `"context": true|false` (see section 4).

The `field` wrapper is one of:
- Dimension: `{ "fieldCaption": "Region" }`
- Measure (TOP/QUANTITATIVE only): `{ "fieldCaption": "Sales", "function": "SUM" }`
- Calculation (TOP/QUANTITATIVE only): `{ "calculation": "..." }`

**HARD RULE: SET, MATCH, and DATE (relative) filters can ONLY use a plain
`{ "fieldCaption": ... }` — no `function`, no `calculation`. Only QUANTITATIVE_*
and TOP filters may use functions or calculations in the field wrapper.**

### 3.1 SET — discrete values of a dimension
```json
{
  "field": { "fieldCaption": "Type Of Sale" },
  "filterType": "SET",
  "values": ["GEO"],
  "exclude": false
}
```
- `values` is required and non-empty. Values must EXACTLY match domain values
  (case-sensitive) — probe first (rule 0.2).
- `exclude: true` keeps everything NOT in `values`. NOTE: excluding values keeps
  NULLs (null is not equal to any listed value) — this is the correct way to say
  "flag is null" when nulls plus listed values cover the domain:
  `values: ["O","T"], exclude: true` → rows where Flag is null. 
- `null` may itself be included in `values` (e.g. `"values": [null]`) to include/
  exclude null members explicitly.
- Numbers are written unquoted: `"values": [2026]`.

### 3.2 MATCH — string pattern on a STRING dimension
```json
{
  "field": { "fieldCaption": "City" },
  "filterType": "MATCH",
  "startsWith": "San",
  "exclude": false
}
```
- MUST include at least one of `contains`, `startsWith`, `endsWith`, each a
  NON-EMPTY string. `"contains": ""` is INVALID.
- MATCH is for partial/fuzzy text only. It cannot test for null. To handle nulls
  in a string dimension, use SET with `exclude` (3.1) or a calculation +
  QUANTITATIVE_NUMERICAL (3.6 workaround).

### 3.3 QUANTITATIVE_NUMERICAL — numeric measure/field
```json
{
  "field": { "fieldCaption": "Sales" },
  "filterType": "QUANTITATIVE_NUMERICAL",
  "quantitativeFilterType": "RANGE",
  "min": 1000,
  "max": 50000,
  "includeNulls": false
}
```
- `quantitativeFilterType`: `RANGE | MIN | MAX | ONLY_NULL | ONLY_NON_NULL` (required).
- `MIN` requires `min`; `MAX` requires `max`; `RANGE` requires both. min/max are
  INCLUSIVE (>=, <=). For strict > 10, use `min: 10.01` (offset trick).
- `ONLY_NULL` / `ONLY_NON_NULL` take no min/max — this is the canonical null filter
  for numeric and date fields.
- `includeNulls` applies only to RANGE/MIN/MAX; default false.
- The field wrapper here MAY carry a `function` (filter on the aggregate, like HAVING)
  or omit it (filter on row values, like WHERE).

### 3.4 QUANTITATIVE_DATE — absolute date bounds
```json
{
  "field": { "fieldCaption": "Dateofsale" },
  "filterType": "QUANTITATIVE_DATE",
  "quantitativeFilterType": "RANGE",
  "minDate": "2026-01-01",
  "maxDate": "2026-12-01"
}
```
- Same `quantitativeFilterType` enum as 3.3, but with `minDate`/`maxDate` as
  RFC 3339 dates `YYYY-MM-DD`. No datetimes, no time zones.

### 3.5 DATE — relative date periods (filterType is exactly "DATE")
```json
{
  "field": { "fieldCaption": "Dateofsale" },
  "filterType": "DATE",
  "periodType": "MONTHS",
  "dateRangeType": "LASTN",
  "rangeN": 6,
  "anchorDate": "2026-07-08",
  "includeNulls": false
}
```
- `periodType` (required): `MINUTES | HOURS | DAYS | WEEKS | MONTHS | QUARTERS | YEARS`
- `dateRangeType` (required): `CURRENT | LAST | LASTN | NEXT | NEXTN | TODATE`
- `rangeN` required iff LASTN/NEXTN.
- `anchorDate` optional; defaults to TODAY. **Important:** if the data's max date is
  not today (data lags), "last 6 months" anchored to today may drop months — either
  set `anchorDate` to the data's max date, or use QUANTITATIVE_DATE RANGE computed
  from the max date.
- `TODATE` + `YEARS` = year-to-date; `TODATE` + `MONTHS` = month-to-date (relative to
  anchor).

### 3.6 TOP — top/bottom N of a dimension by a measure
```json
{
  "field": { "fieldCaption": "Product" },
  "filterType": "TOP",
  "howMany": 10,
  "direction": "TOP",
  "fieldToMeasure": { "fieldCaption": "Sale Value", "function": "SUM" }
}
```
- `howMany` and `fieldToMeasure` required. `direction`: `TOP` (default) or `BOTTOM`.
- `fieldToMeasure` may also be `{ "calculation": "..." }`.
- There is no "LIMIT" in VDS — TOP is the only row-limiting mechanism.

### 3.7 CONDITION — filter by a boolean condition/calculation (newer servers)
```json
{
  "field": { "fieldCaption": "Customer Name" },
  "filterType": "CONDITION",
  "calculation": "SUM([Sales]) > 100000"
}
```
Use only if the server version supports it; otherwise use the 0/1-calculation +
QUANTITATIVE_NUMERICAL MIN=1 workaround:
```json
{
  "field": { "calculation": "IF [Order Date] > #2021-05-05# THEN 1 ELSE 0 END" },
  "filterType": "QUANTITATIVE_NUMERICAL",
  "quantitativeFilterType": "MIN",
  "min": 1
}
```

### General filter rules
- At most ONE filter per field.
- Filters may reference fields not present in `fields`.
- If a SET value was aliased in the datasource, the alias works as a value.

---

## 4. CONTEXT FILTERS (Tableau order of operations)

TOP filters are computed BEFORE ordinary dimension filters — so "top brand in 2026"
with a plain year filter will rank across ALL years and then filter. To scope a
TOP/LOD correctly, mark the scoping filters as context:

```json
"filters": [
  { "field": {"fieldCaption": "Focus Flag"}, "filterType": "SET",
    "values": ["FOCUSED"], "context": true },
  { "field": {"fieldCaption": "Year"}, "filterType": "SET",
    "values": [2026], "context": true },
  { "field": {"fieldCaption": "Brand"}, "filterType": "TOP",
    "howMany": 1, "direction": "TOP", "context": false,
    "fieldToMeasure": {"fieldCaption": "Sale Value", "function": "SUM"} }
]
```
Rule of thumb: any SET/DATE/QUANTITATIVE filter that defines the scope of a TOP
filter or a FIXED LOD must have `"context": true`.

---

## 5. DATES & OUTPUT

- All dates in queries: `YYYY-MM-DD` strings. No datetimes, no timezones.
- VDS returns datetimes like `"2026-07-08T00:00:00"` — parse accordingly.
- OBJECTS format returns `{"data": [ { "<alias or caption>": value, ... } ]}`.
  Unaliased measures come back as e.g. `"SUM(Sales)"`.
- By default filters exclude nulls in the filtered field; use `includeNulls` or
  ONLY_NULL / ONLY_NON_NULL to control this.
- AVG at the datasource may differ from AVG computed over grouped rows — prefer the
  server's AVG when the user asks for an average.

---

## 6. ANALYTIC RECIPES (proven patterns)

### R1 — "as of max date" (two-step)
Step 1: get max date.
```json
{ "fields": [ { "fieldCaption": "Dateofsale", "function": "MAX", "fieldAlias": "Max Date" } ],
  "filters": [ /* same scope filters as the final question */ ] }
```
Step 2: use it. For "value ON the max date": QUANTITATIVE_DATE MIN with
`minDate = <max date>` (or RANGE with min=max). Always apply the SAME scope filters
in step 1 that the question implies — the max date of a subset can differ from the
global max.

### R2 — YTD (year-to-date as of max date)
Step 1: max date under scope (R1). Step 2:
```json
"filters": [
  { "field": {"fieldCaption": "Dateofsale"}, "filterType": "QUANTITATIVE_DATE",
    "quantitativeFilterType": "RANGE",
    "minDate": "<Jan 1 of max-date's year>", "maxDate": "<max date>" },
  ...scope filters...
]
```
(Equivalently: DATE filter with periodType YEARS, dateRangeType TODATE,
anchorDate = max date.)

### R3 — Monthly trend, last N months
```json
"fields": [
  { "fieldCaption": "Dateofsale", "function": "TRUNC_MONTH", "fieldAlias": "Month",
    "sortDirection": "ASC", "sortPriority": 1 },
  { "fieldCaption": "Sale Value", "function": "SUM", "fieldAlias": "Total Sale Value",
    "maxDecimalPlaces": 2 }
],
"filters": [
  { "field": {"fieldCaption": "Dateofsale"}, "filterType": "DATE",
    "periodType": "MONTHS", "dateRangeType": "LASTN", "rangeN": 6 },
  ...scope filters...
]
```
Flag partial months (current month) in the narrative answer.

### R4 — Top N by measure
Include the dimension + sorted measure in fields, plus a TOP filter (3.6). Do not
rely on sorting alone — sorting does not limit rows.

### R5 — "X is null" on a string dimension
If the non-null domain is known (probe!): SET filter with all non-null values and
`"exclude": true`. For numeric/date fields: QUANTITATIVE ONLY_NULL.

### R6 — Best/top within a scope (year, region, flag...)
Scope filters with `context: true` + TOP filter with `context: false` (section 4).

### R7 — Year-over-year
Two options: (a) group by `{ "fieldCaption": "Dateofsale", "function": "YEAR" }` and
compare rows post-hoc; (b) two queries with QUANTITATIVE_DATE ranges. Do NOT invent a
"YOY" function.

---

## 7. PRE-FLIGHT CHECKLIST (run mentally before every call)

1. Every `fieldCaption` verified against metadata (exact case)?
2. Every SET `values` entry verified against the field's actual domain?
3. Every measure field has a `function`, and the function is legal for its dataType?
4. No field queried twice; no duplicate sortPriority; sortPriority ≥ 1?
5. Every filter has a `field` OBJECT wrapper and a valid `filterType`
   (`SET | MATCH | QUANTITATIVE_NUMERICAL | QUANTITATIVE_DATE | DATE | TOP | CONDITION`)?
6. No function/calculation inside SET/MATCH/DATE filter field wrappers?
7. MATCH has a non-empty `contains`/`startsWith`/`endsWith`?
8. Dates are `YYYY-MM-DD` strings?
9. One filter per field?
10. TOP + scope filters → scope filters marked `context: true`?
11. No invented keys anywhere?

---

## 8. ERROR → FIX TABLE (self-repair)

| Error message contains | Cause | Fix |
|---|---|---|
| `values were not found: <V>` | Wrong domain value OR wrong field | Probe the field's domain (`fields:[{fieldCaption}]`). If V isn't there, probe sibling fields with similar names — the user's value likely lives in a different field. Retry with corrected field/value; change nothing else. |
| `Field '<F>' was not found in the datasource` | Guessed/misspelled caption | Re-read metadata; find closest caption by meaning, not spelling alone. |
| `match filter ... must include at least one of: startsWith, endsWith, or contains` | Empty/missing MATCH pattern (often a misguided null check) | Don't use MATCH for nulls. Use SET+exclude (strings) or ONLY_NULL (numeric/date). |
| `function can not be applied to fields of this data type` | e.g. SUM on STRING, TRUNC_MONTH on INTEGER | Consult the compatibility table (2.2); pick a legal function or a different field. |
| `must not include ... duplicate sort priorities` / same field twice | Structural violation | Renumber sortPriority; remove duplicate field. |
| `Filter validation failed` on a date SET (e.g. Year values) | Filtering date parts via SET on a raw date | If a dedicated `Year` dimension exists use it; else use QUANTITATIVE_DATE RANGE for the year, or a calculation `YEAR([Date])` with QUANTITATIVE_NUMERICAL. |
| 400 with unknown property | Invented key | Remove it; only documented keys exist. |
| Empty result, no error | Over-filtering, case mismatch, or anchorDate=today beyond data's max date | Probe domains; anchor relative dates to data's max date. |

Retry budget: max 2 corrective probes + 1 final query per error before telling the
user what's blocking.

---

## 9. WORKED EXAMPLE (from real logs)

User: *"tell me the sale value as of max date where the flag is null (excluding
'O' and 'T') and sale type is 'GEO'"*

1. Probe: `Saletype` domain = Institution/Wholesale/Retail/Doctor → "GEO" not here.
   Probe `Type Of Sale` = GEO/NATIONAL → match. Probe `Flag` = null/O/T.
2. Max date under scope:
```json
{ "fields": [{"fieldCaption": "Dateofsale", "function": "MAX", "fieldAlias": "Max Date"}],
  "filters": [
    {"field": {"fieldCaption": "Type Of Sale"}, "filterType": "SET", "values": ["GEO"]},
    {"field": {"fieldCaption": "Flag"}, "filterType": "SET", "values": ["O","T"], "exclude": true}
  ] }
```
→ `2026-07-08`
3. Final:
```json
{ "fields": [{"fieldCaption": "Sale Value", "function": "SUM",
              "fieldAlias": "Sale Value", "maxDecimalPlaces": 2}],
  "filters": [
    {"field": {"fieldCaption": "Type Of Sale"}, "filterType": "SET", "values": ["GEO"]},
    {"field": {"fieldCaption": "Flag"}, "filterType": "SET", "values": ["O","T"], "exclude": true},
    {"field": {"fieldCaption": "Dateofsale"}, "filterType": "QUANTITATIVE_DATE",
     "quantitativeFilterType": "MIN", "minDate": "2026-07-08"}
  ] }
```

---

## 10. ANSWERING STYLE

- Answer the business question in one or two sentences with the number(s), units,
  and the scope/filters applied. Mention partial periods.
- If a question cannot be answered with available fields, say which field is missing
  and suggest the nearest answerable question — do not fabricate a query.
