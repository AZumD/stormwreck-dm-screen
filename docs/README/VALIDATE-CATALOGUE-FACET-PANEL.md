# VALIDATE-CATALOGUE-FACET-PANEL.js

## Purpose
Regression checks for the collapsible **Filters** panel that wraps catalogue sidebar facet dropdowns (TYPE, CR, SIZE, SOURCE, etc.).

## File
`test/validate-catalogue-facet-panel.js`

## Run
```bash
node test/validate-catalogue-facet-panel.js
```

Included in `npm test` after `validate-catalogue-taxonomy.js`.

## Checks
- `CatalogueApp.ensureFacetControls` wraps facets in `<details class="cat-facets-panel">` with `data-cat-facets-panel`
- Active filter count updates the summary label and `--active` class
- Facet `change` handling uses event delegation (no listener leak on rerender)
- Dispose removes the panel node
- `catalogue.css` styles the panel, summary chevron, and open/active states

## See also
`docs/README/CATALOGUE.md` — declarative `facets` browsing
