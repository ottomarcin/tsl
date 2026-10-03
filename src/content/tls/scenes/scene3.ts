import type { SceneDefinition } from '../../schema';
import { cite } from '../citations';

// Transcribed verbatim from tls_design_specification.md §5.5.
export const scene3: SceneDefinition = {
  id: 'scene-3',
  index: 3,
  title: 'Renal deposition',
  steps: [
    {
      id: 'scene-3-step-1',
      order: 1,
      title: 'Crystals arrive',
      caption: "Crystals arrive at the nephron, the kidney's filtering unit.",
      timestamp: 'T+30h',
      labValues: [{ metricId: 'Cr', value: 0.9 }],
      learnMore: {
        heading: 'The lag between mechanism and lab',
        body: 'Creatinine is a delayed marker. By the time creatinine rises, GFR has already dropped substantially and tubular damage is established. This is why TLS monitoring focuses on the upstream solutes (K⁺, PO₄, UA) and urine output, not on creatinine alone. A patient with normal creatinine and rising potassium is already in TLS.',
        citations: cite('1'),
      },
    },
    {
      id: 'scene-3-step-2',
      order: 2,
      title: 'Crystals lodge',
      caption: 'Crystals lodge in the tubule lumen. Flow narrows.',
      timestamp: 'T+36h',
      labValues: [{ metricId: 'Cr', value: 1.4 }],
      learnMore: {
        heading: 'Crystal obstruction as primary mechanism',
        body: 'Mechanical obstruction by crystal accumulation was historically considered the dominant mechanism of TLS-associated AKI. Recent autopsy and biopsy studies (Arnaud et al., JASN 2022) have complicated this picture — crystal deposits are sometimes absent despite severe AKI. Crystal-independent mechanisms are likely co-dominant.',
        citations: cite('6', '7'),
      },
    },
    {
      id: 'scene-3-step-3',
      order: 3,
      title: 'Four mechanisms',
      caption:
        'Obstruction is only part of it. Crystals injure tubular cells directly, vasoconstriction reduces flow, and histones from lysed cells damage endothelium.',
      timestamp: 'T+42h',
      labValues: [{ metricId: 'Cr', value: 2.1 }],
      learnMore: {
        heading: 'Four mechanisms, one outcome',
        body: 'TLS-AKI is multifactorial. Crystal obstruction, direct crystal cytotoxicity on tubular cells, uric-acid-induced vasoconstriction via endothelial dysfunction, and the emerging role of extracellular histones (released from lysed cells) all contribute. Clinically, the distinction matters because not all mechanisms respond to the same intervention: obstruction responds to hydration and rasburicase; vasoconstriction is harder to reverse pharmacologically; histone-mediated injury is an active research target.',
        citations: cite('6', '16', '7'),
      },
    },
    {
      id: 'scene-3-step-4',
      order: 4,
      title: 'Feedback loop',
      caption: 'Acute kidney injury. The kidney can no longer clear the very things causing it.',
      timestamp: 'T+48h',
      labValues: [
        { metricId: 'Cr', value: 2.8 },
        { metricId: 'K', value: 6.3 },
        { metricId: 'PO4', value: 7.5 },
        { metricId: 'UA', value: 11.0 },
      ],
      learnMore: {
        heading: 'The feedback loop',
        body: 'Once AKI is established, every upstream solute accumulates faster. Reduced GFR means reduced K⁺ excretion (worsening hyperkalemia), reduced phosphate excretion (more calcium consumption, worse hypocalcemia), and reduced uric acid excretion (despite rasburicase if given, because rasburicase requires renal clearance of allantoin). This is the point at which renal replacement therapy is often considered.',
        citations: cite('1'),
      },
    },
  ],
  // The four mechanisms of step 3.3. The wording of the hints and the "emerging" qualifier on histone injury are
  // open clinical-review points (S3.1-S3.3 in tls_clinical_review_questions.md).
  toggle: {
    label: 'Injury mechanism',
    fromStep: 3,
    defaultId: 'obstruction',
    options: [
      { id: 'obstruction', label: 'Obstruction', hint: 'Crystals lodge in the lumen and block flow.' },
      { id: 'cytotoxicity', label: 'Direct cytotoxicity', hint: 'Crystals injure the tubular cells they touch.' },
      { id: 'vasoconstriction', label: 'Vasoconstriction', hint: 'The afferent arteriole narrows; perfusion of the tubule falls.' },
      { id: 'histone', label: 'Histone-mediated', badge: 'emerging', hint: 'Histones released from lysed cells damage the endothelium. Evidence is still emerging.' },
    ],
  },
};
