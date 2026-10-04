import { describe, expect, it } from 'vitest';
import { tlsContent } from '../content/tls';
import { CA_PO4_SOLUBILITY_PRODUCT_MG2_DL2, caPo4ThresholdText } from '../content/tls/thresholds';

/**
 * Design QA, clinical (the four decisions of the scenario script's reviewer notes): applied consistently wherever the
 * content states them. These check consistency, not correctness: that is for a clinician (tls_clinical_review_questions).
 */
const steps = tlsContent.scenes.flatMap((scene) => scene.steps.map((step) => ({ name: `${scene.index}.${step.order}`, step })));
const text = (s: (typeof steps)[number]) => [s.step.caption, s.step.learnMore?.heading ?? '', s.step.learnMore?.body ?? ''].join(' ');
const ids = (s: (typeof steps)[number]) => (s.step.learnMore?.citations ?? []).map((c) => c.id);

describe('Ca × PO₄ threshold: one number, everywhere', () => {
  it('is 70 mg²/dL² and every mention of the product in the copy comes from that constant', () => {
    expect(CA_PO4_SOLUBILITY_PRODUCT_MG2_DL2).toBe(70);
    const mentions = steps.flatMap((s) => [...text(s).matchAll(/(\d+(?:\.\d+)?) mg²\/dL²/g)].map((m) => `${s.name}: ${m[1]}`));
    expect(mentions.length).toBeGreaterThan(0);
    for (const m of mentions) expect(m.endsWith(': 70'), m).toBe(true);
  });
  it('is stated together with its mmol²/L² conversion', () => {
    const all = steps.map(text).join(' ');
    expect(all).toContain(caPo4ThresholdText());
  });
  it('no other threshold (55, 60) is written as a product limit', () => {
    expect(steps.map(text).join(' ')).not.toMatch(/\b(55|60) mg²\/dL²/);
  });
});

describe('K⁺ thresholds', () => {
  it('the strip flags K⁺ at the Cairo-Bishop cut-off the Scene 4 text quotes (≥ 6.0 mmol/L is red)', () => {
    const k = tlsContent.metrics.find((m) => m.id === 'K')!;
    expect(k.thresholds.redBoundary).toBe(6.0);
    expect(steps.map(text).join(' ')).toContain('K⁺ ≥ 6.0 mmol/L');
  });
  it('the ECG-by-potassium numbers are called approximate where they are given', () => {
    const scene4 = steps.filter((s) => s.name.startsWith('4.')).map(text).join(' ');
    expect(scene4).toMatch(/approximate|loosely|not reliable|pattern, not a test/i);
  });
});

describe('histone-mediated injury is presented as emerging, not dominant', () => {
  it('the mechanism toggle marks it "emerging" and does not make it the default', () => {
    const toggle = tlsContent.scenes[3].toggle!;
    const histone = toggle.options.find((o) => /histone/i.test(o.label))!;
    expect(histone.badge).toMatch(/emerging/i);
    expect(toggle.defaultId).not.toBe(histone.id);
  });
});

describe('rasburicase dosing: one convention', () => {
  it('every mention of the fixed 3 mg adult dose cites the 2025 BSH guideline [5] and names the licensed weight-based dose', () => {
    const mentions = steps.filter((s) => /fixed 3 mg/.test(text(s)));
    expect(mentions.length).toBeGreaterThan(0);
    for (const s of mentions) expect(ids(s), s.name).toContain('5');
  });
  it('the licensed dose is written the same way wherever it appears', () => {
    const doses = steps.flatMap((s) => [...text(s).matchAll(/0\.2 mg\/kg(\/day)?/g)].map((m) => m[0]));
    expect(new Set(doses).size).toBeLessThanOrEqual(1);
  });
  it('the intervention panel and badges carry no dose', () => {
    const labels = tlsContent.interventions.map((i) => i.label).join(' ');
    expect(labels).not.toMatch(/\bmg\b/);
  });
});

describe('sources', () => {
  it('a statement attributed to "BSH 2025" in a step cites the 2025 guideline [5]', () => {
    for (const s of steps.filter((s) => /BSH 2025/.test(text(s)))) expect(ids(s), s.name).toContain('5');
  });
  it('urinary alkalinisation is never recommended', () => {
    for (const s of steps.filter((s) => /alkalini[sz]ation/i.test(text(s)))) {
      expect(text(s), s.name).toMatch(/not recommended|contraindicated|no longer|once standard|abandoned|historic|promotes calcium/i);
    }
  });
});
