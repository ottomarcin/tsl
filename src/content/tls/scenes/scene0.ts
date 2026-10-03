import type { SceneDefinition } from '../../schema';
import { cite } from '../citations';

// Transcribed verbatim from tls_design_specification.md §5.2.
export const scene0: SceneDefinition = {
  id: 'scene-0',
  index: 0,
  title: 'The vulnerable tumor',
  steps: [
    {
      id: 'scene-0-step-1',
      order: 1,
      title: 'Tumor profile',
      caption: 'A bulky, chemosensitive tumor: high cell turnover, high nucleic-acid content.',
      timestamp: 'T+0h',
      labValues: [
        { metricId: 'K', value: 4.2 },
        { metricId: 'Ca', value: 9.4 },
        { metricId: 'PO4', value: 3.5 },
        { metricId: 'UA', value: 5.0 },
        { metricId: 'Cr', value: 0.9 },
      ],
      learnMore: {
        heading: 'Why this tumor, why now',
        body: 'Cell turnover rate and chemosensitivity are the two strongest predictors of TLS. Burkitt lymphoma is the archetype: doubling times measured in days, near-universal response to first-line chemotherapy, and a uric-acid load that scales directly with tumor burden. Risk is not binary. It is stratified into three tiers by baseline biology and modified one tier up by patient-level factors.',
        citations: cite('1'),
      },
    },
    {
      id: 'scene-0-step-2',
      order: 2,
      title: 'Risk factors',
      caption: 'Risk is quantifiable: tumor burden, LDH, renal function, hydration, high-risk diagnoses.',
      learnMore: {
        heading: 'The Cairo-Bishop framework',
        body: 'The 2004 Cairo-Bishop classification, refined by Coiffier (JCO 2008) and adopted by the British Society for Haematology, stratifies risk by malignancy type. Patient-level modifiers — pre-existing CKD, baseline uric acid > 7.5 mg/dL, LDH ≥ 2× ULN, bulky disease, nephrotoxin exposure — upgrade any baseline risk by one tier. In practice, this stratification determines whether the patient receives allopurinol or rasburicase prophylaxis and how aggressively pre-chemo hydration is managed.',
        citations: cite('2', '3', '5'),
      },
    },
    {
      id: 'scene-0-step-3',
      order: 3,
      title: 'High risk',
      caption: 'This patient: high-grade lymphoma, elevated LDH, normal baseline renal function. High risk.',
      learnMore: {
        heading: 'What "high risk" means clinically',
        body: 'A patient classified as high risk receives: rasburicase prophylaxis (typically a fixed 3 mg dose in adults, BSH 2025), IV hydration at 2–3 L/m²/day with a urine output target > 80–100 mL/m²/h, and lab monitoring every 6–8 hours during the first 24–72 hours after cytotoxic initiation. Urinary alkalinization is no longer recommended.',
        citations: cite('5', '3'),
      },
    },
  ],
  chipsStep: 2,
  summaryStep: 3,
  summaryBadge: { label: 'HIGH RISK', state: 'red' },
  // Seven risk factors, asset spec §2.2 table, valued for the scene's example patient (Burkitt lymphoma).
  chips: [
    { id: 'tumor-burden', label: 'Tumor burden', valueText: '85%', state: 'amber', active: true, fill: 0.85, reference: 'Amber above 60% of the reference burden scale.' },
    { id: 'ldh', label: 'LDH', valueText: '2.3× ULN', state: 'amber', active: true, fill: 0.46, reference: 'Amber above 2.0× ULN, red above 3.0× ULN.' },
    { id: 'ckd', label: 'Pre-existing CKD', valueText: 'No', state: 'normal', active: false, reference: 'Red when present: upgrades risk one tier.' },
    { id: 'hydration', label: 'Hydration', valueText: 'Adequate', state: 'normal', active: false, reference: 'Amber when poor: volume depletion upgrades risk one tier.' },
    { id: 'bulky', label: 'Bulky disease', valueText: '>10 cm', state: 'amber', active: true, reference: 'Amber when any mass exceeds 10 cm.' },
    { id: 'high-risk-dx', label: 'High-risk Dx', valueText: 'Burkitt lymphoma', state: 'red', active: true, reference: 'Red for high-risk malignancies (Burkitt, lymphoblastic, B-ALL).' },
    { id: 'nephrotoxins', label: 'Nephrotoxins', valueText: '–', state: 'normal', active: false, reference: 'Amber with recent contrast or other nephrotoxic exposure.' },
  ],
};
