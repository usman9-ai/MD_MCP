# Secondary Sales — Datasource Metadata (Curated)

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
| `Target Value` | REAL, measure | Fixed (`Flag='T'`) and override (`Flag='O'`) targets, monthly, posted on the 1st of each month. Default to `'T'` unless asked for override/OP. Also filter `Type Of Sale` before summing|
| `Target Unit` | REAL, measure | Same as Target Value, in units. Also filter `Type Of Sale` before summing |
| `Discount` | REAL, measure | Discount given to distributors. Filter `Flag` = null. |
| `Bonus` | REAL, measure | Bonus given to distributors. Filter `Flag` = null. |
| `Returns` | REAL, measure | Returns from distributor. Filter `Flag` = null. |
| `Expired` | REAL, measure | Expired stock/units. Filter `Flag` = null. |
| `TP` | REAL, measure | Trade Price. |
| `SALE_VALUE_PRIMARY` | INTEGER, measure | **Primary** sales value (distributor-facing, distinct from the "secondary" — chemist-facing — sales that this datasource is otherwise about). Needed for the "Distributor 360 View" KPI's "Primary Sales" metric. ⚠️ The auto-generated metadata originally flagged this "not req" — that flag is wrong for this KPI; see Known Issues §1 below. |
| `SALE_UNIT_PRIMARY` | INTEGER, measure | Primary sales, units. Same caveat as above. |
| `Flag` | STRING, dimension **[low-cardinality]** | Row-type discriminator. |
| `Type Of Sale` | STRING, dimension **[low-cardinality]** | GEO (field-force only) vs NATIONAL (GEO + non-field-force, superset). Mandatory filter on every query. |
| `Saletype` | STRING, dimension **[low-cardinality]** | Customer/channel category. Distinct from `Type Of Sale` — do not confuse. |
| `CMP` | STRING, dimension **[low-cardinality]** | Company, full legal name. The authoritative field for company filtering. |
| `Alt Company Code` | STRING, dimension **[low-cardinality]** | Company as short code (MDL/MDM/Welnox). Convenience field — prefer resolving user abbreviations to `CMP`'s full legal strings per Known Issues §2, but this field can be used directly for a short-code filter if simpler. |
| `Cmpid` | STRING, dimension **[low-cardinality]** | Company ID. Internal join/lookup key, not for display. |
| `Cmp Code1` | STRING, dimension **[low-cardinality]** | Alternate company code (1706/2000/5000). Not needed unless a downstream system requires this exact code. |
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
| `Region` | STRING, dimension | Region of the chemist. |
| `City` | STRING, dimension | City of the customer. |
| `State` | STRING, dimension **[low-cardinality]** | ⚠️ Dirty field — see Known Issues §3. Avoid using for filtering/grouping until cleansed. |
| `Brickid` / `Station` | STRING, dimension | Brick (small geography unit) of the chemist. `Station` = "Brick of Chemist" per source description; likely a duplicate of `Brickid` — treat as the same concept, prefer `Brickid` unless a query specifically needs `Station`. |
| `Distributor` | STRING, dimension | Distributor name — distributes to chemists. |
| `DSTBID` | STRING, dimension | Distributor ID, join/lookup key only. |
| `CUSTOMER_NAME` | STRING, dimension | Chemist name. In this business, "customer" = "chemist." High cardinality (~97k) — use for row-level lookups, not for grouping/aggregating unless the user wants per-chemist detail. |
| `Custid` | STRING, dimension | Chemist ID. Use `COUNTD(Custid)` for chemist-count KPIs (see KPI file, §5–6) rather than `CUSTOMER_NAME`, since names can repeat. |
| `CHAIN` | STRING, dimension **[low-cardinality]** | Retail chain the chemist belongs to (Dvago, FDPP, SERVAID, Imtiaz, OTHERS). |
| `Distribution` | STRING, dimension **[low-cardinality]** | Distribution channel (Other PDs / M&P Only). |
| `BU` | STRING, dimension **[low-cardinality]** | Business Unit. |
| `Alt Team` / `Teamname` | STRING, dimension | Team dimension. `Teamname` = "Team names of Martin Dow Group companies" per source; treat `Teamname` as the primary field, `Alt Team` as an alternate/legacy version — confirm which the user's dashboards expect if results differ. |
| `TSO` / `Tsoid` | STRING, dimension | Territory Sales Officer name / ID on the fact table itself. For the full org hierarchy (RSM/DSM/NSM/RM/SM), join to VFF Hierarchy via `Sk Tso Key` — see Table 3. |
| `Dateofsale` | DATE, dimension | Raw transaction date. **Do not** group/trend on this directly — join to Dim Time (`Dateofsale = Gregorian Date`) and use `Gregorian Date` instead, so non-selling days show as gaps/zero rather than disappearing. |



### Distinct values — Secondary Sales Summary
```
Alt Company Code   : MDL, MDM, Welnox
BU                 : Specialty Care, Gynae & Gastro Care, Neuro Care, Neurosciences & Hematology,
                      WELNOX, B.U MDL, B.U Trade, Virtual, Primary & Urocare, Diabetes & Cardio
CHAIN               : Dvago, FDPP, SERVAID, Imtiaz, OTHERS
CMP                 : MARTIN DOW MARKER LTD.   |   MARTIN DOW  LIMITED. (two spaces, trailing period)   |   Welnox (pvt.) Ltd
Category            : CONSUMER, PHARMA, K-A, (null)
Categoryid          : 02, 03, 04, (null)
Cmp Code1           : 1706, 2000, 5000
Cmpid               : 01, 02, 05
Distribution        : Other PDs, M&P Only
Flag                : (null) = Actuals, T = Target, O = Override Target
PRODUCT_TYPE        : Hybrid Product, Trade Products, OTHERS
Saletype             : Institution, Wholesale, Retail, Doctor
State               : QTA, --, -, (null)   ⚠️ see Known Issues §3, avoid filtering on this as-is
Status Prd          : Y, N
Type Of Sale        : GEO, NATIONAL   ⚠️ NOT "GEOGRAPHICAL" — see Known Issues §5
With And Without Bonus : WITH BONUS, WITHOUT BONUS
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

The KPI catalogue (see KPI file) lists **RM, SM, Region, Zone, HOS, TSO/MIE** as
required breakdown dimensions for the "Target vs Achievement," "Chemist Count," "Daily Chemist
Sales," and "Geographical Analysis" reports — all of which are standard KPI views, not
org-lookup questions. Pull this table in for those report types too.

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
| `State (Gv Ff List Fnl)` / `Rmbase` (= Region) / `Dsmbase` / `Rsmbase` / `Smbase` (= Zone) | STRING, dimension | Geography levels of the org hierarchy. Field naming is inconsistent (`Rmbase` is annotated "Region is TSO" in source, `Dsmbase`/`Smbase` annotated "Zone") — confirm exact zone/region mapping with the data owner before using these as the definitive Region/Zone breakdown; the fact table's own `Region` field (Table 1) may be simpler and more reliable for "by Region" questions.
| `Cmp (Gv Ff List Fnl)` / `Cmpid (Gv Ff List Fnl)` | STRING, dimension | Company on the org side — same values as `CMP`/`Cmpid` on the fact table. |
| `Tsoactive` | STRING, dimension | Constant "Y" — this view is pre-filtered to active TSOs only at source (see Known Issues §6). |
| `Emp Name` | STRING, dimension | Generic employee name field — role unclear which level it refers to; avoid unless confirmed. |


### Distinct values — VFF Hierarchy
```
Bu (Gv Ff List Fnl)   : same list as Secondary Sales Summary's BU (see above)
Cmp (Gv Ff List Fnl)  : same list as CMP (see above)
Cmpid (Gv Ff List Fnl): 01, 02, 05
Dsmactive             : Y, N
Tsoactive             : Y (constant — see Known Issues §6)
```

---

## Table 4: Focused Brands (`FOCUSED_BRAND`)

| Field | Type | Notes |
|---|---|---|
| `Focus Flag` | STRING, dimension **[low-cardinality]** | FOCUSED / OTHER. |
| `Prod Group` | STRING, dimension | Focused-brand product group name. |
| `Prod Group Id` | STRING, dimension | Join/lookup key. |
| `Cmp Id` | STRING, dimension **[low-cardinality]** | ⚠️ Values `01,02,04,05` — `04` does not appear in Secondary Sales Summary or VFF Hierarchy (`Cmpid` only has `01,02,05`). See Known Issues §7. |
| `Cmp Name` | STRING, dimension **[low-cardinality]** | Full company name, per Focused Brands (values differ slightly from `CMP` — see below). |
| `Year1` | INTEGER, dimension **[low-cardinality]** | Filter to the current year for "current-year focused brands" — table is pre-loaded through 2027, so an unfiltered query will double/triple count across years. |

### Distinct values — Focused Brands
```
Cmp Id     : 01, 02, 04, 05   ⚠️ '04' has no match elsewhere — see Known Issues §7
Cmp Name   : Martin Dow Limited, Martin Dow Marker Ltd, WELNOX (Pvt.) Ltd, OTHERS
             ⚠️ Different formatting than CMP on the fact table — do not filter Focused Brands
             by these strings and assume they'll match CMP values. Join on Cmp Id, not on name.
Focus Flag : FOCUSED, OTHER
Year1      : 2025, 2026, 2027
```

---

## Table Relationships
```
Secondary Sales Summary → Dim Time        : [Dateofsale] = [Gregorian Date]              (single key)
Secondary Sales Summary → Focused Brands  : [Sk Grp Key] = [Sk Grp Key (Focused Brand)]
                                             AND [Cmpid] = [Cmp Id]                        (composite key)
Secondary Sales Summary → VFF Hierarchy   : [Sk Tso Key] = [Sk Tso Key (Gv Ff List Fnl)]  (single key)
```

---
