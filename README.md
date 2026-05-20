# SAS Intel Platform

**Live App → [camerondwilson20.github.io/sas-intel/intel/](https://camerondwilson20.github.io/sas-intel/intel/)**

Team intelligence hub for SAS — off-market properties, active requirements, broker contacts, market intel, and deal history. Zero backend, zero login, works in any browser.

---

## Five Modules

| Module | What it tracks |
|--------|---------------|
| **Off-Market Pipeline** | Every off-market property, owner info, stage (Cold → UC), stale tracking |
| **Requirements / ISOs** | Every buyer/tenant requirement, rep broker, size, budget, submarket |
| **Contacts** | Brokers, owners, principals — relationship strength, deal history |
| **Market Intel** | NCDOT projects, permits, zoning changes, comps, supply pipeline |
| **Deal History** | Every SAS closed transaction — price, $/SF, cap rate, lessons learned |

---

## Key Features

- **AI Match Engine** — scores every off-market property against every active requirement, ranks by fit %
- **Pairlist Parser** — paste any Pairlist blast email, auto-extracts all ISOs, one-click import
- **CSV Bulk Import** — drop in any spreadsheet, column headers auto-matched
- **Team Sync** — Export JSON snapshot → teammate imports it → records merge, no duplicates
- **Stale Watchlist** — anything untouched 30+ days flags red automatically
- **Keyboard shortcuts** — `N` to add new record, `Esc` to close modals

---

## Team Usage

1. **Open the app**: [camerondwilson20.github.io/sas-intel/intel/](https://camerondwilson20.github.io/sas-intel/intel/)
2. **Add properties/requirements** as you find them — takes 60 seconds per record
3. **Run Match Engine** daily from the Dashboard to see new property ↔ requirement matches
4. **Sync with teammates**: Export your data → share the JSON file → they import it
5. **Pairlist blast comes in?** Paste it in the Pairlist Parser → import all ISOs in one click

---

## File Structure

```
sas-intel/
├── intel/index.html          ← The full app (5 modules, match engine, all logic)
├── shared/
│   ├── styles.css            ← SAS navy/gold design system
│   ├── db.js                 ← localStorage database layer
│   └── nav.js                ← Top nav + export/import sync
├── .github/workflows/
│   └── deploy.yml            ← Auto-deploys to GitHub Pages on every push
└── README.md
```

---

## To Add a Team Member's Name to Dropdowns

Open `intel/index.html`, search for `id="p-by"` — replace "Team Member 2" / "Team Member 3" with real names. Same pattern appears for Requirements (`id="r-by"`).

---

*Built for SAS · Deployed via GitHub Pages · No backend required*
