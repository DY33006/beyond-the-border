# Beyond the Border

A small, static CS448B visual essay about similar overall refugee-policy scores, different protections, and the language behind selected codes. Dataset observations end in 2022. This is an exploratory student project, not a current legal guide.

## Run

Node 20+ and Python 3 are sufficient to serve the committed site; there are no runtime JavaScript dependencies.

```sh
npm run build
npm test
npm run dev
```

Open http://localhost:3000. Opening the HTML directly with file:// will not load JSON.

## Reproduce the calculations

```sh
python3 -m pip install -r requirements.txt
python3 scripts/prepare_data.py --check
```

To intentionally regenerate, run `python3 scripts/prepare_data.py`, review the changed JSON/CSV, then repeat `--check` and `npm test`. Do not edit generated numeric JSON by hand. Source XLSX is immutable. A new data release requires a new source version and reviewed expectations.

### File boundaries

| Files | Responsibility |
| --- | --- |
| `data/raw/dwrap_index.xlsx` | Original supplied workbook; SHA-256 recorded in audit |
| `data/raw/DWRAP_Technical_Guide_2024.pdf` | Supplied codebook and methodology |
| `scripts/prepare_data.py` | All pair selection, field gaps, coverage and transition calculations |
| `dist/data/comparison.json`, `history.json`, `audit.json`, `mixed-transitions.json`, CSV | Generated numerical outputs |
| `data/editorial/evidence.json` | Manually curated, cited legal evidence; edit this source, then run `npm run build` |
| `dist/index.html`, `styles.css`, `app.js` | Editorial text, styling and interaction; no index reconstruction |
| `tests/data.test.mjs` | Independent arithmetic, completeness, range and documentary-code consistency checks |
| `docs/EDITORIAL.md` | Contribution, visual design decisions and evidence limits |

## Two-person workflow

Use one GitHub repository as the shared source of truth. Add the second person as a collaborator in repository settings. Each person works on a feature branch and opens a pull request; the other reviews it. Never share account passwords or deployment tokens.

Suggested split: one person owns data/evidence and one owns interface/editorial layout. Both review legal claims. Run the data checks before merging any change to numbers or sources. The included GitHub Actions workflow runs them on pushes and pull requests without deployment credentials.

Vercel can import this repository with framework **Other**, build command **npm run build**, and output directory **dist**. `vercel.json` includes these settings. The pipeline does not need to install Python on Vercel: reviewed generated outputs are committed, and Python regeneration happens locally or in GitHub Actions.

Vercel's Git integration creates preview deployments for non-production branches. For a private repository with both authors deploying, use a Vercel team plan that supports collaboration (the official documentation currently specifies Pro/Enterprise; Hobby does not support private-repository collaboration). Public-repository collaboration follows different rules, but do not make coursework public without agreeing together. Source collaboration on GitHub and hosting access on Vercel are separate permissions.

See https://vercel.com/docs/deployments/troubleshoot-project-collaboration and https://vercel.com/docs/git/vercel-for-github. No GitHub collaborator has been invited automatically by this package.

## Data rules

- Source: supplied DWRAP workbook, 11,628 rows and 102 columns; remove only COW IDs 998 and 999 (144 benchmark rows).
- Retain 11,484 observations, 205 historical entities, 198 entities in 2022. These are workbook entities, not a claim about the number of current UN member states.
- Use published ICW values at full floating-point precision. These are not percentages of rights and do not sum across fields. No weighted index is reconstructed.
- Close pair = absolute total difference <= 0.005 in 2022. There are 405 of 19,503 pairs. Rank by largest absolute field gap, descending, then total gap, IDs. Curated cases are editorial selections, not necessarily rank one.
- Compare historical changes only across adjacent years; epsilon 1e-8. There are 848 transitions with at least one field change; 197 have both positive and negative changes. These are score changes, not inferred legal causes.
- Missing country-years remain absent. UI rounding never feeds back into calculations.
- `docs_fee` in the workbook differs from `docs_pay` in the guide; no unverified semantic relabeling is used in the article.

## Evidence policy

The Finland–Namibia excerpts concern selected movement provisions. They do not validate all five component codes or explain the entire movement-field gap. Finland's same law contains residence/reporting exceptions; Namibia's restriction is conditional on a served residence order. Both have `camp=1` in the supplied row.

The Philippines EO163 is a source-coverage audit lead. The missing document title does not prove how it was treated by coders. No score is overwritten. Other selected pairs have an explicit unverified-evidence state.

## Attribution

World Bank; Christopher W. Blair, Guy Grossman and Jeremy M. Weinstein. 2024. *Dataset of World Refugee and Asylum Policies*. World Bank Development Data Hub. https://datacatalog.worldbank.org/search/dataset/0066171/dataset-of-world-refugee-and-asylum-policies-dwrap . See the source catalog for dataset license terms.

Finland statutory translation: Ministry of the Interior / Finlex. Namibia statutory reproduction: Laws.Africa via UNHCR Refworld (CC BY 4.0 for the PDF; legislative text has no copyright). Philippines EO163: Supreme Court E-Library. Exact URLs, page numbers, versions, and scope are in the evidence JSON. Fonts: Google Fonts DM Sans and Libre Caslon Display, with local fallbacks.
