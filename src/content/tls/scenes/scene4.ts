import type { SceneDefinition } from '../../schema';
import { cite } from '../citations';

// Transcribed verbatim from tls_design_specification.md §5.6.
export const scene4: SceneDefinition = {
  id: 'scene-4',
  index: 4,
  title: 'Systemic effects in parallel',
  steps: [
    {
      id: 'scene-4-step-1',
      order: 1,
      title: 'Same origin',
      caption: 'Both consequences trace back to the same moment of lysis. Different paths, same patient, same time.',
      timestamp: 'T+48h',
      labValues: [
        { metricId: 'K', value: 6.3 },
        { metricId: 'Ca', value: 7.0 },
        { metricId: 'PO4', value: 7.8 },
        { metricId: 'UA', value: 11.4 },
        { metricId: 'Cr', value: 3.1 },
      ],
      learnMore: {
        heading: 'Parallel, not sequential',
        body: 'Both potassium release and phosphate-driven calcium consumption happen at the same lysis event, in the same time frame. Hyperkalemia tends to manifest slightly earlier because K⁺ acts directly, with no intermediate step. Hypocalcemia follows only once phosphate has accumulated to chelating concentrations. But both are typically abnormal together within the same 24-hour window. Treating them as a sequence is a common conceptual error.',
        citations: cite('1'),
      },
    },
    {
      id: 'scene-4-step-2',
      order: 2,
      title: 'Hyperkalemia',
      caption: 'Hyperkalemia: the most acutely lethal, the most reversible if caught.',
      learnMore: {
        heading: 'ECG progression — pattern, not precise thresholds',
        body: 'The classical progression — peaked T waves → PR prolongation → P-wave flattening → QRS widening → sine wave → ventricular fibrillation or asystole — correlates only loosely with absolute serum K⁺. Individual presentation depends on rate of rise, concurrent ionized calcium and magnesium, acid-base status, and Na⁺ channel availability. The pattern is reliable; the numeric thresholds are not. Cairo-Bishop laboratory cutoff: K⁺ ≥ 6.0 mmol/L. Critical-action threshold (regardless of ECG): K⁺ ≥ 6.5 mmol/L.',
        citations: cite('9', '18', '2', '17'),
      },
    },
    {
      id: 'scene-4-step-3',
      order: 3,
      title: 'Hypocalcemia',
      caption: 'Hypocalcemia: neuromuscular irritability from the same lysis event, via phosphate.',
      learnMore: {
        heading: 'Neuromuscular manifestations',
        body: "Hypocalcemia in TLS produces the standard spectrum: paresthesias around the mouth and fingertips, muscle cramps, Chvostek's sign (facial twitch on tapping the facial nerve), Trousseau's sign (carpopedal spasm with blood pressure cuff inflation), tetany, laryngospasm, QT prolongation, and at extremes seizures. IV calcium replacement is given only for symptomatic hypocalcemia. Asymptomatic hypocalcemia in TLS is treated by lowering phosphate (with phosphate binders and dialysis), not by giving calcium — which would accelerate precipitation.",
        citations: cite('1', '11'),
      },
    },
    {
      id: 'scene-4-step-4',
      order: 4,
      title: 'Two clocks',
      caption: 'Two clocks, one cause. Both need attention now.',
      timestamp: 'T+48h',
      learnMore: {
        heading: 'Combined risk is additive',
        body: 'Severe hyperkalemia plus severe hypocalcemia is additively dangerous on cardiac conduction. Low ionized calcium worsens hyperkalemic arrhythmia risk by further destabilizing the membrane potential. This is why IV calcium gluconate is used as a membrane stabilizer in severe hyperkalemia — even when serum calcium is also low — but only briefly, and never as a substitute for definitive K⁺-lowering therapy.',
        citations: cite('1', '9'),
      },
    },
  ],
};
