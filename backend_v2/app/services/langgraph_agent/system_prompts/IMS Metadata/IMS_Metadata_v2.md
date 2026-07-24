# IMS Datasource — Metadata (Curated)

Source datasource: `GV_IMS_NEW_UNPVT` (Tableau published data source, 1 logical table).
This file only lists fields the agent is allowed to use for querying. Any field NOT listed
here does not exist for query purposes — the agent must not invent, guess, or substitute a
field name. Use `fieldCaption` exactly as written (matching case and spacing) in every VizQL
Data Service query.

This datasource supports **pharma industry-level analysis**, letting users analyze sales at
different levels of the product classification hierarchy — see "Classification Hierarchy"
below before writing any query that filters, groups, or drills by class or molecule.

---

## Classification Hierarchy (Business Context)

Products in this datasource roll up through a five-level hierarchy, from the broadest therapy
area down to the individual molecule:

```
Class 1  >  Class 2  >  Class 3  >  Class 4  >  Molecule
(broadest)                                      (most granular)
```

Users commonly refer to class levels as **"TC"** (Therapeutic Class) or **"ATC"** (Anatomical
Therapeutic Chemical classification) — the terms are interchangeable and refer to the same
level. For example: Class 1 = TC1 = ATC1, Class 2 = TC2 = ATC2, and so on.

**Molecule** is the finest grain of the hierarchy, representing a single chemical compound. A
molecule can be a standalone medicine on its own — for example, *Paracetamol* is a single
molecule and is itself a complete, standalone medicine. When molecules are combined, they roll
up into higher classification levels: a combination of two molecules forms a Class 4 grouping,
a combination of three molecules forms a Class 3 grouping, and so on up the hierarchy.

| Hierarchy Level | Field (`fieldCaption`) |
|---|---|
| Class 1 / TC1 / ATC1 | `Therapy Area (ATC1)` |
| Class 2 / TC2 / ATC2 | `Therapeutic Class (ATC2)` |
| Class 3 / TC3 / ATC3 | `Pharmacological Class (ATC3)` |
| Class 4 / TC4 / ATC4 | `Chemical Subclass (ATC4)` |
| Molecule | `Composition (Molecule)` |

When a user asks to analyze or drill down "by class" without specifying a level, ask which
level (1–4) or confirm whether they mean the molecule level, since each is a distinct field.

---

## Table: Field Metadata (`GV_IMS_NEW_UNPVT`)

| Field (`fieldCaption`) | Type | Description |
|---|---|---|
| `Month Value` | REAL, measure | Monthly sales figure, expressed as either sales value or sales units, as indicated by the `Unit Value` flag. |
| `Unit Value` | STRING, dimension | Flag indicating whether `Month Value` represents sales value or sales units. Check this before aggregating `Month Value` to avoid mixing value and unit rows. |
| `Therapy Area (ATC1)` | STRING, dimension | Class 1 / TC1 / ATC1 — the broadest level of the classification hierarchy, representing the therapy area a product belongs to. |
| `Therapeutic Class (ATC2)` | STRING, dimension | Class 2 / TC2 / ATC2 — one level below the Therapy Area. |
| `Pharmacological Class (ATC3)` | STRING, dimension | Class 3 / TC3 / ATC3 — between the Therapeutic Class and the Chemical Subclass. |
| `Chemical Subclass (ATC4)` | STRING, dimension | Class 4 / TC4 / ATC4 — one level above the individual molecule. |
| `Composition (Molecule)` | STRING, dimension | The molecule (chemical composition) of the product — the finest grain of the hierarchy. A single molecule (e.g. Paracetamol) can be a standalone medicine; combinations of molecules roll up into Class 4 through Class 1. |
| `Prod Des` | STRING, dimension | Name of the product or brand. |
| `Corp Des` | STRING, dimension | Name of the **corporate group / parent** that owns the product (e.g. `MARTIN DOW GROUP`). This is one level **above** the individual manufacturer. See `Manu Des` for the manufacturer-level field, and rule §E in `IMS_KPIs.md` for the difference. |
| `Manu Des` | STRING, dimension | Name of the **individual manufacturer** (the specific legal entity that manufactures the product), e.g. `Martin Dow Limited`, `Martin Dow Marker`, `Welnox`. Every `Manu Des` rolls up to exactly one `Corp Des`. Use `Manu Des` for company-wise breakdowns (e.g. splitting MDG into its three constituent companies); use `Corp Des` for consolidated group-level standing. Do not substitute one for the other — see `IMS_KPIs.md` §E. |
| `Pack Des` | STRING, dimension | Description of the pack strength or dosage for a product, e.g. `10mg`, `20mg`. |
| `Prod Lch` | DATE, dimension | Date on which the product was launched. |
| `Month Date` | DATE, dimension | Calendar date field used to represent the reporting month. Preferred field for date-based filtering and trending. |

---

### Distinct values — key low-cardinality fields
```
Unit Value : UNIT, VALUE
```

### Martin Dow Group entity resolution (for "our" identification)
Use exactly these stored strings when filtering to Martin Dow Group entities in a query — do
not paraphrase, abbreviate, or change casing:

```
Corp Des (consolidated group view) : MARTIN DOW GROUP
Manu Des (individual company view) : Martin Dow Limited, Martin Dow Marker, Welnox
```

Pick `Corp Des` when the question is about MDG's consolidated market standing (the default);
pick `Manu Des` when the question needs a per-company breakdown across the three MDG
entities. See `IMS_KPIs.md` §E and §3 for full logic.

---

## Query Notes

- **`Month Value` requires `Unit Value` context.** Since `Month Value` can represent either
  sales value or sales units depending on `Unit Value`, always check or filter `Unit Value`
  before summing `Month Value`, or the result will silently mix two different measures.
- **Class-level fields are not interchangeable.** `Therapy Area (ATC1)`, `Therapeutic Class
  (ATC2)`, `Pharmacological Class (ATC3)`, `Chemical Subclass (ATC4)`, and `Composition
  (Molecule)` each represent a distinct level of the hierarchy. Do not substitute one for
  another even if a user says "class" or "category" generically — confirm the level if unclear.
- **`Prod Des` vs `Corp Des` vs `Manu Des`.** `Prod Des` is the product/brand name (e.g.
  `Evion`); `Corp Des` is the corporate group / parent (e.g. `MARTIN DOW GROUP`); `Manu Des`
  is the individual manufacturer within a group (e.g. `Martin Dow Limited`). All three are
  commonly confused — do not use one in place of another even if a user's phrasing is loose
  ("which company makes X", "top brands by Y"). Ask if it's genuinely ambiguous which of the
  three the user means.
- **Prefer `Month Date` over `Prod Lch`** for general date filtering/trending; `Prod Lch` is
  specific to a product's launch date, not the transaction period.
- Any field not in the table above is not documented for this datasource and must not be used
  in a query — ask the user for clarification instead of guessing a `fieldCaption`.
