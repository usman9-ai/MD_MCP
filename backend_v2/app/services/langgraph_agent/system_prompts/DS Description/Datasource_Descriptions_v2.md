# Datasource Classification — Descriptions

This file is fed to the routing/classifier node that decides which datasource(s) are required
to answer a given user question. Each entry below describes what a datasource covers and the
kinds of business questions/insights it can answer, so the classifier can match a question to
the right datasource(s) without needing to inspect field-level metadata.

If a question needs data from more than one datasource, return all of the relevant datasources
in the list. If no datasource can answer the question, return an empty list `[]`.

**Required output format** (return valid JSON only — no other text, no markdown formatting, no code fences, no explanation):

[{"datasource_name": "name", "datasource_id": "datasource_uuid"}]

If no datasource applies, return [].
---

## Datasource 1: IMS (Pharma Market / Industry-Level Data)

- **datasource_name:** `IMS New - DS - BDC - Pulse`
- **datasource_id:** `5dbf9178-f029-4787-aa07-54dd1e00100b` 

**What it covers:** Industry-level (IMS) pharma market data — sales performance across the
*entire market*, not just one company's own distribution network. It captures monthly sales
value/units by product, corporation (manufacturer), and pack, along with each product's
position in the pharmaceutical classification hierarchy (Therapy Area → Therapeutic Class →
Pharmacological Class → Chemical Subclass → Molecule).

**What it can answer / insights it provides:**
- Market-level sales trends over time (monthly value or unit sales) for any product, brand,
  manufacturer, or pack.
- Classification/therapy-level analysis — e.g. "which therapy areas are growing," "market size
  of a given ATC class," "sales broken down by molecule or molecule combination."
- Competitive/manufacturer-level views — comparing a corporation's products against the broader
  market at any classification level.
- Product launch timing analysis, using product launch dates.
- Questions phrased in terms of "class," "TC," "ATC," or "molecule" level (Class 1–4 or
  molecule) belong here, not in the Secondary Sales datasource.
- This is a **market/industry** view, not the company's own internal distributor/chemist sales
  pipeline — use this datasource when the question is about overall market size, market share,
  or competitor/therapy-level positioning rather than the company's own field-force or
  distributor operations.

*(Full field-level metadata: `IMS_Metadata.md`.)*

---

## Datasource 2: Secondary Sales (Internal Distribution & Field-Force Data)

- **datasource_name:** `Secondary Sales DS - BDC`
- **datasource_id:** `b6bbffe2-ebdb-4deb-808c-825fe0896e85`

**What it covers:** The company's own internal "secondary sales" pipeline — sales from
distributors down to chemists (as opposed to "primary sales," which is company-to-distributor,
also available here as a supporting field). It spans sales transactions, targets, discounts,
bonuses, returns, expired stock, distributor stock levels, the field-force/sales-org hierarchy
(TSO → RM/RSM/DSM/NSM/SM), focused-brand designations, and geography (region, city, brick,
zone).

**What it can answer / insights it provides:**
- Sales performance vs. target: Day/MTD/YTD achievement %, growth over last year (GOLY), at any
  org or product grouping level (Company, BU, Team, Brand, SKU, Distributor, Region, etc.).
- Comparative analysis of Sales, Target, Bonus, Discount, and Returns between two user-specified
  time periods.
- Distributor-level 360° views — primary sales, secondary sales, stock on hand, returns, bonus,
  discount for a given distributor.
- Chemist coverage and activity — chemist counts, chemist growth, and chemist-level sales,
  broken down by geography or org hierarchy (including TSO/DSM/RSM/RM/NSM roles).
- Daily/weekly chemist sales trends, including trailing-3-month week-wise breakdowns.
- Geography-scoped sales views (field-force-only "GEO" sales vs. the broader "NATIONAL" scope).
- Discount and bonus analysis by year, distributor, or SKU, including "with vs. without bonus"
  product splits.
- Distributor stock levels and **Stock Coverage (days of stock remaining)**, based on current
  on-hand stock vs. trailing 90-day average sale rate.
- Focused-brand performance (achievement, growth, contribution %) for products flagged as
  strategic focus brands.
- Questions about internal sales operations, field-force performance, distributor/chemist
  relationships, targets, discounts/bonuses, or stock belong here — not in the IMS datasource,
  which reflects the broader external market rather than the company's own distribution
  pipeline.

*(Full field-level metadata: `Meta_Data_v5.md`; KPI formulas: `KPIs_v5.md`.)*

---

## Disambiguation note for the classifier

Both datasources contain "sales" and "products," so use this rule of thumb:

- **IMS already includes our own company's data** (via `Corp Des`) alongside every competitor,
  because it's a total-market view. So any question about market standing, market share, market
  size, "how are we doing vs. the market," competitor comparison, or therapy/molecule-level
  analysis is answerable from **IMS alone** — do **not** pull in Secondary Sales just because the
  question mentions "our" performance in a market context. Example: *"Where do we stand in the
  market"* → **IMS only**.

- **Secondary Sales is only needed when the question specifically requires one of these internal
  operational dimensions**, none of which exist in IMS:
  - Target / achievement % (MTD, YTD, GOLY vs. target)
  - Distributor-level detail (distributor 360 view, distributor stock/inventory)
  - Discount or bonus analysis
  - Brick-level geography
  - Chemist / customer-level analysis (chemist count, chemist coverage, daily chemist sales)
  - Field-force / org hierarchy (TSO, RM, RSM, DSM, NSM, SM, Team, BU)
  - Any other Secondary Sales–specific metric (e.g. returns, expired stock, stock coverage/days
    of stock)

  If the question needs any of the above, include **Secondary Sales** (with or without IMS,
  depending on whether market context is also asked for).

- **Use both** only when the user explicitly wants an internal metric from the list above
  *combined with* market-level context in the same answer (e.g. "compare our discount-adjusted
  growth to the overall market growth in this therapy area").

**Default rule of thumb:** a generic "how are we doing" / "market position" / "market share"
question → **IMS only**. Only add Secondary Sales when the question names a dimension from the
list above.
