# Secondary Sales — Datasource Metadata (Curated)

Source datasource: `GV_SEC_SALES_FNL` (Tableau published data source, 4 logical tables).
This file replaces `metadata.txt` as the metadata block fed into the agent's system prompt.
It only lists fields the agent is allowed to use. Any field NOT listed here does not exist
for query purposes — the agent must not invent, guess, or substitute a field name.

Every field marked **[low-cardinality]** has its complete, verbatim list of stored values below
it. When filtering on that field, the agent MUST use one of the exact listed values (matching
case, spacing and punctuation) — never a paraphrase, abbreviation, or the user's own wording.

---

## Table 1: Secondary Sales Summary (`GV_SEC_SALES_FNL`)
The core transactional fact table. Almost every business question is answered from this table
(joined to Dim Time for dates).

| Field (`fieldCaption`) | Type | Description |
|---|---|---|
| `Sale Value` | REAL, measure | Actual sale value in PKR. Filter `Flag` to null + `Type Of Sale` before summing. |
| `Sale Unit` | REAL, measure | Actual units sold. Same filter rules as Sale Value. |
| `Target Value` | REAL, measure | Fixed (`Flag='T'`) and override (`Flag='O'`) targets, monthly, posted on the 1st of each month. Default to `'T'` unless asked for override/OP. |
| `Target Unit` | REAL, measure | Same as Target Value, in units. |
| `Discount` | REAL, measure | Discount given to distributors. Filter `Flag` = null. |
| `Bonus` | REAL, measure | Bonus given to distributors. Filter `Flag` = null. |
| `Returns` | REAL, measure | Returns from distributor. Filter `Flag` = null. |
| `Expired` | REAL, measure | Expired stock/units. Filter `Flag` = null. |
| `TP` | REAL, measure | Trade Price. |
| `SALE_VALUE_PRIMARY` | INTEGER, measure | **Primary** sales value (distributor-facing, distinct from the "secondary" — chemist-facing — sales that this datasource is otherwise about). Needed for the "Distributor 360 View" KPI's "Primary Sales" metric. ⚠️ The auto-generated metadata originally flagged this "not req" — that flag is wrong for this KPI; see Known Issues §1 below. |
| `SALE_UNIT_PRIMARY` | INTEGER, measure | Primary sales, units. Same caveat as above. |
| `Flag` | STRING, dimension **[low-cardinality]** | Row-type discriminator. |
| `Type Of Sale` | STRING, dimension **[low-cardinality]** | GEO (field-force only) vs NATIONAL (GEO + non-field-force, superset). Mandatory filter on every query. |
| `Saletype` | STRING, dimension **[low-cardinality]** | distributor/customer channel category. Distinct from `Type Of Sale` — do not confuse. |
| `Alt Company Code` | STRING, dimension **[low-cardinality]** | Company as short code (MDL/MDM/Welnox). |
| `PRD` / `Product` | STRING, dimension | Product name. `PRD` is the default field for "top-selling products" (per prior confirmed usage); `Product` is a duplicate/alias — use `PRD`. |
| `Prdid` | STRING, dimension | Product ID (unique key), for joins/lookups only, not for display. |
| `Brand` | STRING, dimension | Product grouping — one brand can span 4–5 products. Use when the question is by brand rather than SKU. |
| `Brand Rename` | STRING, dimension | Cleaned version of `Brand` (source data has some brands misassigned to the wrong company). Prefer `Brand Rename` over `Brand` when the two disagree; if unsure which to use, default to `Brand` and flag the discrepancy in the answer rather than silently picking one. |
| `GRP` | STRING, dimension | Duplicate of `Brand` (`GRP` = `Brand`, per source). Do not use — use `Brand`/`Brand Rename` instead. |
| `Category` | STRING, dimension **[low-cardinality]** | Category of sale (CONSUMER / PHARMA / K-A). |
| `Categoryid` | STRING, dimension **[low-cardinality]** | Category ID, join/lookup key only. |
| `PRODUCT_TYPE` | STRING, dimension **[low-cardinality]** | Hybrid Product / Trade Products / OTHERS. |
| `Status Prd` | STRING, dimension **[low-cardinality]** | Y/N — likely active/discontinued product flag. Confirm meaning with stakeholder before using as a filter; not otherwise documented. |
| `With And Without Bonus` | STRING, dimension **[low-cardinality]** | Frontend-derived split of products with vs. without bonus. Used by the "Bonus Products (with and without bonus)" dimension in KPI report #2 (Comparative Analysis). |
| `Region` | STRING, dimension | Region of the chemist and it must be used only when `Type Of Sale` is filtered to `NATIONAL`. |
| `City` | STRING, dimension | City of the distributor. |
| `Brickid` / `Station` | STRING, dimension | Brick (small geography unit) of the chemist. `Brickid` contains id of the brick and `Station` = "Name of Brick of Chemist". Prefer `Station` unless a query specifically needs `Brickid`. |
| `Distributor` | STRING, dimension | Distributor name — distributes to chemists. |
| `DSTBID` | STRING, dimension | Distributor ID, join/lookup key only. |
| `CUSTOMER_NAME` | STRING, dimension | Chemist name. In this business, "customer" = "chemist." High cardinality (~97k) — use for row-level lookups, not for grouping/aggregating unless the user wants per-chemist detail. |
| `SK_CUSTOMER_KEY` | STRING, dimension | Chemist ID. Use `COUNTD(SK_CUSTOMER_KEY)` for chemist-count KPIs (see KPI file, §5–6) rather than `CUSTOMER_NAME`, since names can repeat. use with `Type Of Sale` = 'GEO' |
| `CHAIN` | STRING, dimension **[low-cardinality]** | Retail chain the chemist belongs to (Dvago, FDPP, SERVAID, Imtiaz, OTHERS). |
| `Distribution` | STRING, dimension **[low-cardinality]** | Distribution channel (Other PDs / M&P Only). |
| `BU` | STRING, dimension **[low-cardinality]** | Business Unit. |
| `Alt Team` / `Teamname` | STRING, dimension | Team dimension. `Teamname` = "Team names of Martin Dow Group companies" per source; treat `Teamname` as the primary field, `Alt Team` as an alternate/legacy version — confirm which the user's dashboards expect if results differ. |
| `TSO` / `Tsoid` | STRING, dimension | Territory Sales Officer name / ID on the fact table itself. For the full org hierarchy (RSM/DSM/NSM/RM/SM), join to VFF Hierarchy via `Sk Tso Key` — see Table 3. |


### Distinct values — Secondary Sales Summary
```
Alt Company Code   : MDL, MDM, Welnox
BU                 : Specialty Care, Gynae & Gastro Care, Neuro Care, Neurosciences & Hematology,
                      WELNOX, B.U MDL, B.U Trade, Virtual, Primary & Urocare, Diabetes & Cardio
CHAIN               : Dvago, FDPP, SERVAID, Imtiaz, OTHERS
Category            : CONSUMER, PHARMA, K-A, (null)
Categoryid          : 02, 03, 04, (null)
Distribution        : Other PDs, M&P Only
Flag                : (null) = Actuals, T = Target, O = Override Target
PRODUCT_TYPE        : Hybrid Product, Trade Products, OTHERS
Saletype             : Institution, Wholesale, Retail, Doctor
Status Prd          : Y, N
Type Of Sale        : GEO, NATIONAL  
With And Without Bonus : WITH BONUS, WITHOUT BONUS
```
### Company Name Full Forms
```
MDL      : Martin Dow Limited
MDM      : Martin Dow Marker
Welnox   : Welnow Pvt Limited
```
---

## Table 2: Dim Time (calendar table)
Joined to Secondary Sales Summary via `Dateofsale = Gregorian Date`. Use for ALL date filtering,
grouping, and trending.

| Field | Type | Notes |
|---|---|---|
| `Gregorian Date` | DATE, dimension | **The** field to filter/group/trend on. |
| `Year` | INTEGER, dimension | |
| `Fiscal Year` | STRING, dimension | Use only if the user explicitly asks for fiscal-year framing; otherwise default to calendar `Year`. |

---

## Table 3: VFF Hierarchy (`GV_FF_LIST_FNL`) — field-force org structure
Joined via `Sk Tso Key = Sk Tso Key (Gv Ff List Fnl)`.


| Field | Type | Notes |
|---|---|---|
| `Tso (Gv Ff List Fnl)` / `TSO` | STRING, dimension | Territory Sales Officer name. |
| `RM` | STRING, dimension | Regional Manager. |
| `RSM` | STRING, dimension | Regional Sales Manager. |
| `DSM` | STRING, dimension | District Sales Manager. |
| `NSM` | STRING, dimension | National Sales Manager. |
| `SM` | STRING, dimension | Sales Manager. |
| `SPO` | STRING, dimension | Sales Promotion Officer (or equivalent field role) — appears in the "Daily Chemist Sales" / TSO-level dimension lists. |
| `Bu (Gv Ff List Fnl)` | STRING, dimension | Business unit of the TSO. |
| `Teamname (Gv Ff List Fnl)` | STRING, dimension | Team of the TSO. |
| `Rmbase` | STRING, dimension | Contains the Name of Regional Managers. |
| `Rsmbase (Gv Ff List Fnl)` | STRING, dimension | Contains the Name of the geographical area under the RM and this area is reffered as Zone |
| `Dsmbase` | STRING, dimension |  Contains the Name of the geographical area under the district sales manager and this area is reffered as Region |
| `Tsoactive` | STRING, dimension | Constant "Y" — this view is pre-filtered to active TSOs only at source (see Known Issues §6). |
| `Emp Name` | STRING, dimension | Generic employee name field — role unclear which level it refers to; avoid unless confirmed. |


### Distinct values — VFF Hierarchy
```
Bu (Gv Ff List Fnl)   : same list as Secondary Sales Summary's BU (see above)
Dsmactive             : Y, N
Tsoactive             : Y (constant — see Known Issues §6)
```

---

## Table 4: Focused Brands (`FOCUSED_BRAND`)
Joined via composite key `Sk Grp Key = Sk Grp Key (Focused Brand)` AND `Cmpid = Cmp Id`.

| Field | Type | Notes |
|---|---|---|
| `Focus Flag` | STRING, dimension **[low-cardinality]** | FOCUSED / OTHER. |
| `Prod Group` | STRING, dimension | Focused-brand product group name. |
| `Prod Group Id` | STRING, dimension | Join/lookup key. |
| `Year1` | INTEGER, dimension **[low-cardinality]** | Filter to the current year for "current-year focused brands" — table is pre-loaded through 2027, so an unfiltered query will double/triple count across years. |

### Distinct values — Focused Brands
```
Focus Flag : FOCUSED, OTHER
Year1      : 2025, 2026, 2027
```

---

## Table 5: Distributor Stock (`GV_DLY_STOCK_FNL`)
Joined via composite key `DSTBID = SAP_DSTB_ID` AND `PRDID = SAP_PRDT_ID`.

**This table holds a daily stock snapshot with real historical depth — it is NOT a current-day-only
table.** Every date that has a stock load carries its own `Stock`/`Vstock` row, going back
historically. Because of this, `Stock`/`Vstock` **must always be filtered on `Gregorian Date`**
(joined via Dim Time, same as the fact table) — an unfiltered `SUM(Stock)` will blend many
historical days together into a meaningless total, not return "today's" stock.

**Default behavior: use the latest available date only.** Unless the user explicitly asks for a
past date or a stock trend over time, filter `Gregorian Date` to the single latest date for which
stock data is available and report that as "current stock." Do not run a `MAX(Gregorian Date)`
probe query against this table to find that date — use the same latest-available-date value that
is already used for the sales default (per `agent_rules.md` §6), unless a stock-specific probe
shows stock data lags sales data (in which case say so rather than assuming the two are in sync).
State the as-of date in the answer. If the user asks for a stock trend or a past-date figure, this
is now answerable (unlike a true current-day-only snapshot) — filter/group `Gregorian Date`
accordingly and disclose the range used, same as any other date-scoped query.

`Stock`/`Vstock` work with **both** `Type Of Sale = 'GEO'` and `'NATIONAL'`; default NATIONAL. If
a regional split is required, use `Dsmbase` (VFF Hierarchy) as the region dimension — see
`agent_rules.md` §13. **`Flag` does not apply to this table** — do not filter or condition on
`Flag` when computing `Stock`/`Vstock`; there is no actual/target row-type distinction here.


Only 2 fields are exposed to the agent — everything else in this table is either a join key
(resolved automatically by VDS once `Stock`/`Vstock` are requested alongside a Secondary Sales
Summary dimension like `Distributor`/`PRD`) or redundant with fields already on the fact table.

| Field | Type | Notes |
|---|---|---|
| `Stock` | INTEGER, measure | Stock quantity, in units, for a given `Gregorian Date`. `SUM(Stock)` — always with a `Gregorian Date` filter; default to the latest available date (see above). |
| `Vstock` | REAL, measure | Value of stock, for a given `Gregorian Date`. `SUM(Vstock)` — same date-filtering rule as `Stock`.|

---

## Table Relationships
```
Secondary Sales Summary → Dim Time          : [Dateofsale] = [Gregorian Date]              (single key)
Secondary Sales Summary → Focused Brands    : [Sk Grp Key] = [Sk Grp Key (Focused Brand)]
                                               AND [Cmpid] = [Cmp Id]                        (composite key)
Secondary Sales Summary → VFF Hierarchy     : [Sk Tso Key] = [Sk Tso Key (Gv Ff List Fnl)]  (single key)
Secondary Sales Summary → Distributor Stock : [DSTBID] = [SAP_DSTB_ID]
                                               AND [PRDID] = [SAP_PRDT_ID]                   (composite key)
```

---

## Known Issues / Open Questions (agent should NOT silently resolve these — flag to the user if the question touches them)

1. **`SALE_VALUE_PRIMARY` / `SALE_UNIT_PRIMARY` were flagged "not required" in the original
   metadata pass, but the KPI catalogue's "Distributor's 360 View" report explicitly needs
   "Primary Sales."** These fields must be included, contrary to the original blanket rule of
   dropping undocumented columns. Always re-check a "not required" field against the KPI list
   before excluding it.

4. **`Sales Category` is contradictory between sources**: the metadata template describes it as
   "Category of sale like Doctor, Institution, Retail, Wholesale etc.," but the distinct-values
   audit confirms it is 100% null / dead in the live data. Treat it as **not usable** — that
   concept (channel-type breakdown) is actually served by `Saletype`, not `Sales Category`.
5. **`Type Of Sale` actual stored values are `GEO` and `NATIONAL`** — not "GEOGRAPHICAL" as an
   earlier auto-generated field description suggested. Always filter on `GEO`/`NATIONAL` exactly.
6. **`Tsoactive` is constant `Y`** in this table — inactive TSOs already appear to be filtered
   out at source. If a "how many TSOs" question ever returns a suspiciously stable/full count,
   this is why; it's not a bug in the query.

8. **`Flag = 'O'` (override target) vs `Flag = 'T'` (fixed target)**: it is not yet confirmed
   whether 'O' should ever supersede 'T' for specific products, or whether they're always two
   independent, user-selectable target bases. Until confirmed, keep the existing default
   (`Flag='T'`) and only use `'O'` when the user explicitly asks for "operational" or "override"
   targets — do not have the agent decide between them automatically.

