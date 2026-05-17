# Eurovote

A frontend-only Eurovision scoring explorer built with React, TypeScript, and Vite.

The app loads a scraped Vienna 2026 Grand Final dataset and surfaces scoreboard, public-vote, jury/public split, counterfactual, and voter-network views.

## Local Development

```bash
npm install
npm run dev
```

## Build And Checks

```bash
npm run lint
npm run build
```

The production build is emitted to `dist/`.

## Data

The current event data is stored in `src/data/vienna-2026-grand-final.json`.

To refresh the scrape:

```bash
npm run fetch:data
```

## Deployment

GitHub Pages is deployed by `.github/workflows/deploy-pages.yml` whenever `master` or `main` is pushed.

The Vite base path is configured for:

```text
https://popidge.github.io/Eurovote/
```
