# Tumor Lysis Syndrome: a scroll-driven 3D explainer

An interactive, scroll-driven 3D walkthrough of tumor lysis syndrome (TLS) for clinicians. One continuous 3D world
takes the viewer from a bulky, chemosensitive tumor, through cell lysis, the potassium / phosphate / uric-acid
cascade, crystal deposition in the kidney and the systemic effects on the heart and nerves, to the points where
treatment intervenes.

> **Status:** work in progress. The clinical content (ECG shapes, intervention formulas, some model details) is
> awaiting review by a clinician; open questions are listed in
> [`.docs/tls_clinical_review_questions.md`](.docs/tls_clinical_review_questions.md). This is an educational
> visualization, not medical advice.

## The story

| Scene | Topic |
| --- | --- |
| 0 | The vulnerable tumor: risk factors and risk level |
| 1 | Cytolysis: therapy begins and cells rupture |
| 2 | The cascade: potassium, phosphate and calcium, the purine pathway |
| 3 | Renal deposition: crystals in the nephron, four injury mechanisms, the feedback loop |
| 4 | Systemic effects in parallel: hyperkalemia (heart), hypocalcemia (Trousseau's sign) |
| 5 | Where interventions act: rewind, then rasburicase, allopurinol, IV hydration, dialysis, free play |

A live lab strip (K⁺, Ca²⁺, PO₄, uric acid, creatinine) follows the story. Every step has a "Learn more" panel with
numbered sources, and the end card lists the full reference list.

## Features

- Scroll, arrow keys, or the Previous / Next buttons to move through the steps; a breadcrumb shows where you are.
- High / standard 3D model quality, switchable from the side menu (standard runs better on slower machines).
- Light and dark themes.
- Text-only mode: all content as text, no 3D.
- Accessibility: screen-reader announcements, skip link, keyboard navigation, reduced-motion stills, a print layout.
- Responsive from phones to wide desktops.

## Tech stack

- **UI:** React 19, TypeScript, Vite
- **3D:** three.js with react-three-fiber and drei (scroll-driven camera, Draco-compressed glTF models)
- **State:** Zustand
- **Components:** Radix UI primitives (dialog, tooltip, tabs, slider, switch), lucide icons, CSS modules with design tokens
- **Testing:** Vitest, Testing Library, jest-axe (accessibility), `@react-three/test-renderer`; a QA suite checks
  contrast, tokens, copy, and clinical values
- **Component workshop:** Storybook
- **Assets:** 3D models built in Blender (scripts and sources in `assets-src/`)

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build |
| `npm test` | Run the test suite once |
| `npm run coverage` | Tests with coverage |
| `npm run typecheck` | Type-check only |
| `npm run storybook` | Component workshop on port 6006 |

Add `?quality=standard` (or `high`) to the URL to pick the 3D model tier. Deep links such as `/scene/3` open a scene
directly.

## Project layout

```
src/
  engine/       Scroll canvas, camera path, scroll/route sync
  scenes/       One folder per 3D scene (Scene0 … Scene5) plus shared pieces
  components/   UI components, each with a stylesheet, tests and stories
  content/tls/  All copy, lab values, citations (data, not code)
  lib/          Timeline, clinical models, formulas, helpers
  store/        Zustand app store
  assets/       Model loading, quality tiers, preloading
  qa/           Cross-cutting quality tests
assets-src/     Blender sources for the 3D models
public/         Self-hosted Draco decoder and built models
.docs/          Design, asset, scenario and architecture specs; clinical review notes
```

## Documentation

The specs in [`.docs/`](.docs/) are the source of truth:

- [Design specification](.docs/tls_design_specification.md)
- [Scenario script](.docs/tls_scenario_script.md) (including the reference list)
- [Technical architecture](.docs/tls_technical_architecture.md)
- [User stories and tasks](.docs/tls_user_stories_and_tasks.md)
- [Asset specification](.docs/tls_asset_specification.md) and [pipeline](.docs/tls_asset_pipeline.md)
- [Clinical review questions](.docs/tls_clinical_review_questions.md)

## License

[MIT](LICENSE) © 2026 Marcin Otto
