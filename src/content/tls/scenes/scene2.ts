import type { SceneDefinition } from '../../schema';
import { cite } from '../citations';

// Transcribed verbatim from tls_design_specification.md §5.4.
export const scene2: SceneDefinition = {
  id: 'scene-2',
  index: 2,
  title: 'The cascade',
  steps: [
    {
      id: 'scene-2-step-1',
      order: 1,
      caption: 'Potassium needs no conversion. It goes straight to where it is dangerous.',
      labValues: [{ metricId: 'K', value: 5.8 }],
      learnMore: {
        heading: 'Why potassium is the most acute threat',
        body: 'Cardiac myocytes are exquisitely sensitive to extracellular potassium. The resting membrane potential depends on the transmembrane K⁺ gradient; small absolute changes in serum K⁺ cause large changes in conduction. Hyperkalemia is also the most rapidly reversible electrolyte disturbance in TLS — calcium gluconate stabilizes the membrane within minutes; insulin/glucose and beta-agonists shift K⁺ intracellularly within 30 minutes.',
        citations: cite('1'),
      },
    },
    {
      id: 'scene-2-step-2',
      order: 2,
      caption: 'Phosphate does not act alone. It needs a partner.',
      labValues: [
        { metricId: 'PO4', value: 6.2 },
        { metricId: 'Ca', value: 7.8 },
      ],
      learnMore: {
        heading: 'Hypocalcemia is secondary',
        body: 'This is the most commonly misunderstood mechanism in TLS. Calcium does not fall because of any primary loss. It falls because phosphate, released in massive quantities, chelates serum calcium into insoluble calcium-phosphate complexes. When the Ca × PO₄ product exceeds approximately 70 mg²/dL² (5.6 mmol²/L²), precipitation accelerates. The complexes deposit in tubules and soft tissue. Treating the calcium directly with IV calcium is dangerous in this setting — it accelerates precipitation and worsens tubular injury. Calcium is reserved for symptomatic hypocalcemia (tetany, seizures, severe ECG changes) where the risk of arrhythmia outweighs the precipitation risk.',
        citations: cite('1', '14', '11'),
      },
    },
    {
      id: 'scene-2-step-3',
      order: 3,
      caption: 'Nucleic acids take the longest road, but end at the same place.',
      labValues: [{ metricId: 'UA', value: 9.5 }],
      learnMore: {
        heading: 'The enzymatic pathway',
        body: 'Adenine and guanine released from nucleic acids are catabolized through hypoxanthine and xanthine to uric acid. The final two conversions are catalyzed by xanthine oxidase (XO). This is the target of allopurinol and febuxostat — both are XO inhibitors, blocking the pathway upstream so uric acid is never formed. Rasburicase, by contrast, acts downstream by converting existing uric acid into the highly water-soluble allantoin. Humans lack uricase (the natural enzyme that does this conversion in most other mammals). Rasburicase is the recombinant version of this missing enzyme.',
        citations: cite('1'),
      },
    },
    {
      id: 'scene-2-step-4',
      order: 4,
      caption: 'Two different molecules. Same destination: crystal deposition.',
      timestamp: 'T+24h',
      labValues: [
        { metricId: 'Ca', value: 7.6 },
        { metricId: 'PO4', value: 6.5 },
        { metricId: 'UA', value: 10.2 },
      ],
      learnMore: {
        heading: 'Why this convergence matters',
        body: 'Calcium-phosphate crystals deposit throughout the kidney — tubules and interstitium. Uric acid crystals deposit preferentially in distal tubules and collecting ducts, where the urine is most acidic (uric acid pKa ~5.6, much less soluble below this pH). The two crystal types are independent in chemistry but converge in consequence: tubular obstruction, direct cytotoxicity, and inflammation, all converging on acute kidney injury. This convergence is also why urinary alkalinization was abandoned. Raising urinary pH improves uric acid solubility but simultaneously worsens calcium-phosphate precipitation. Rasburicase eliminates the uric acid problem without needing pH manipulation.',
        citations: cite('1', '6', '15'),
      },
    },
  ],
};
