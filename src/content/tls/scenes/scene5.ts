import type { SceneDefinition } from '../../schema';
import { cite } from '../citations';

// Transcribed verbatim from tls_design_specification.md §5.7.
export const scene5: SceneDefinition = {
  id: 'scene-5',
  index: 5,
  title: 'Where interventions act',
  steps: [
    {
      id: 'scene-5-step-1',
      order: 1,
      title: 'Rewind',
      caption: 'Rewind. What if we had intervened before lysis began?',
      timestamp: 'T+0h',
      labValues: [
        { metricId: 'K', value: 4.2 },
        { metricId: 'Ca', value: 9.4 },
        { metricId: 'PO4', value: 3.5 },
        { metricId: 'UA', value: 5.0 },
        { metricId: 'Cr', value: 0.9 },
      ],
      learnMore: {
        heading: 'Prophylaxis vs treatment',
        body: 'TLS has the unusual property of being highly preventable. Patients identified as high-risk before cytotoxic therapy initiation can be given prophylactic XO inhibition (allopurinol or febuxostat) or, for the highest-risk patients, rasburicase. Hydration begins 24–48 hours before chemotherapy in this group. The interventions in this scene work much better as prophylaxis than as treatment of established TLS.',
        citations: cite('1', '3'),
      },
    },
    {
      id: 'scene-5-step-2',
      order: 2,
      title: 'Rasburicase',
      caption: 'Rasburicase breaks down uric acid before it can crystallize.',
      labValues: [{ metricId: 'UA', value: 5.5 }],
      learnMore: {
        heading: 'How rasburicase works',
        body: 'Rasburicase is recombinant urate oxidase. It converts existing uric acid into allantoin, which is 5–10× more soluble than uric acid and is excreted renally. A single fixed 3 mg dose is sufficient for most adult prophylaxis (BSH 2025); the licensed dose of 0.2 mg/kg/day for up to 7 days is reserved for established clinical TLS. G6PD status must be confirmed before administration. Rasburicase is contraindicated in G6PD deficiency because the hydrogen peroxide generated as a byproduct can cause severe hemolysis.',
        citations: cite('5', '4'),
      },
    },
    {
      id: 'scene-5-step-3',
      order: 3,
      title: 'Allopurinol',
      caption: 'Allopurinol works upstream, blocking xanthine oxidase itself.',
      learnMore: {
        heading: 'Allopurinol vs rasburicase',
        body: 'Allopurinol prevents new uric acid formation but does nothing to clear existing uric acid. It is appropriate for low- and intermediate-risk prophylaxis. For patients with already-elevated uric acid or high tumor burden, rasburicase is preferred because it works on both the existing pool and ongoing production. Combining the two is rarely indicated — allopurinol can theoretically slow rasburicase\'s substrate availability — though some centres sequence allopurinol after rasburicase as tumor burden declines. Febuxostat is an alternative XO inhibitor (FLORENCE trial, Spina et al., 2015) for patients intolerant of allopurinol.',
        citations: cite('10'),
      },
    },
    {
      id: 'scene-5-step-4',
      order: 4,
      title: 'IV hydration',
      caption: 'Aggressive IV hydration dilutes everything and supports tubular flow.',
      learnMore: {
        heading: 'Hydration targets',
        body: "Target 2–3 L/m²/day of IV fluid with a urine output goal of > 80–100 mL/m²/h. Normal saline or 0.45% saline are equally acceptable; the choice is driven by the patient's sodium status and underlying cardiac function. Diuretics are used only if needed to maintain the urine output target — not prophylactically. Urinary alkalinization (bicarbonate infusion) was once standard but is now contraindicated because it promotes calcium-phosphate precipitation. Rasburicase has eliminated the need for it.",
        citations: cite('13', '3'),
      },
    },
    {
      id: 'scene-5-step-5',
      order: 5,
      title: 'Dialysis',
      caption: 'If TLS still develops despite prophylaxis, dialysis intercepts at the systemic stage.',
      learnMore: {
        heading: 'When to escalate to RRT',
        body: 'Indications for renal replacement therapy in TLS include: oliguria or anuria not responsive to fluid resuscitation; severe or rapidly rising hyperkalemia refractory to medical therapy; severe hyperphosphatemia with symptomatic hypocalcemia; fluid overload precluding further hydration; uremic symptoms. Continuous renal replacement therapy (CRRT) is generally preferred over intermittent hemodialysis in critically ill patients because of gentler solute clearance and better hemodynamic tolerance.',
        citations: cite('1'),
      },
    },
    {
      id: 'scene-5-step-6',
      order: 6,
      title: 'Try it yourself',
      caption: 'Try it yourself. Adjust each intervention and watch the cascade change.',
      // No Learn More for this step — the interaction is the lesson (design spec §5.7, step 5.6).
    },
  ],
};
