import type { SceneDefinition } from '../../schema';
import { cite } from '../citations';

// Transcribed verbatim from tls_design_specification.md §5.3.
export const scene1: SceneDefinition = {
  id: 'scene-1',
  index: 1,
  title: 'Cytolysis',
  steps: [
    {
      id: 'scene-1-step-1',
      order: 1,
      title: 'Therapy begins',
      caption: 'Cytotoxic therapy begins. Tumor cells, sensitive to treatment, start to die en masse.',
      timestamp: 'T+6h',
      labValues: [{ metricId: 'K', value: 4.6 }],
      learnMore: {
        heading: 'What "lysis" actually means',
        body: 'Cell lysis in TLS is not a slow apoptotic process. Cytotoxic chemotherapy, radiation, glucocorticoids, or even spontaneous lysis from a large untreated tumor produces rapid membrane rupture in a sensitive cell population. The result is not a death — it is a release.',
        citations: cite('1'),
      },
    },
    {
      id: 'scene-1-step-2',
      order: 2,
      title: 'Cells rupture',
      caption: 'Cell membranes rupture. Intracellular contents spill into the bloodstream.',
      timestamp: 'T+12h',
      labValues: [
        { metricId: 'K', value: 5.5 },
        { metricId: 'PO4', value: 5.5 },
        { metricId: 'UA', value: 7.8 },
      ],
      learnMore: {
        heading: 'Three categories of release',
        body: 'Intracellular potassium concentration is roughly 120–140 mEq/L versus a serum concentration of 3.5–5.0 mEq/L. Even partial release produces clinically meaningful hyperkalemia within hours. Phosphate is released in similar proportions; malignant cells characteristically contain up to four times the intracellular phosphate of normal cells. Nucleic acids follow a slower path through enzymatic conversion to uric acid — but the precursors are released at the same moment as K⁺ and PO₄.',
        citations: cite('11', '1'),
      },
    },
    {
      id: 'scene-1-step-3',
      order: 3,
      title: 'Systemic release',
      caption: 'Within hours, this is no longer local. It is systemic.',
      learnMore: {
        heading: 'Timing matters',
        body: 'TLS onset is typically 12–72 hours after the first dose of cytotoxic therapy. Some patients present with spontaneous TLS at diagnosis, before any treatment, if tumor burden and proliferation rate are sufficient. The systemic phase is when monitoring frequency becomes critical — every 6–8 hours for the first 48 hours, then spaced if values are stable.',
        citations: cite('3'),
      },
    },
  ],
};
