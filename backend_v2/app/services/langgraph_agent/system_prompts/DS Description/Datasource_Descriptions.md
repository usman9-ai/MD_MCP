# Datasource Classification — Descriptions

This file is fed to the routing/classifier node that decides which datasource(s) are required
to answer a given user question. Each entry below describes what a datasource covers and the
kinds of business questions/insights it can answer, so the classifier can match a question to
the right datasource(s) without needing to inspect field-level metadata.

If a question needs data from more than one datasource, return all of the relevant datasources
in the list. If no datasource can answer the question, return an empty list `[]`.

**Required output format** (return only this — no other text):
```python
[{'datasource_name': 'name', 'datasource_id': 'datasource_uuid'}]
```

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


---

## Disambiguation note for the classifier

Both datasources contain "sales" and "products," so use this rule of thumb:
- **Market share, competitor comparison, therapy/molecule-level analysis, overall market size**
  → **IMS**.
- **Company's own distributor/chemist sales, targets, field-force/org performance, distributor
  stock, discounts/bonuses/returns** → **Secondary Sales**.
- A question comparing the company's performance *against the total market* needs **both**
  datasources.
