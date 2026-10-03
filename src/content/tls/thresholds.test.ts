import { describe, expect, it } from 'vitest';
import { CA_PO4_SOLUBILITY_PRODUCT_MG2_DL2, caPo4ThresholdMmol2L2, caPo4ThresholdText } from './thresholds';
import { scene2 } from './scenes/scene2';

describe('Ca × PO₄ solubility product', () => {
  it('is 70 mg²/dL², the value the experience standardises on', () => {
    expect(CA_PO4_SOLUBILITY_PRODUCT_MG2_DL2).toBe(70);
  });
  it('converts to the 5.6 mmol²/L² the scenario script quotes', () => {
    expect(caPo4ThresholdMmol2L2(70)).toBeCloseTo(5.64, 2);
    expect(caPo4ThresholdText(70)).toBe('70 mg²/dL² (5.6 mmol²/L²)');
  });
  it('would give 4.8 mmol²/L² for the alternative 60', () => {
    expect(caPo4ThresholdText(60)).toBe('60 mg²/dL² (4.8 mmol²/L²)');
  });
  it('is what Scene 2 step 2.2 tells the viewer, and nothing else in the scene hardcodes another number', () => {
    const body = scene2.steps[1].learnMore!.body;
    expect(body).toContain(caPo4ThresholdText());
    expect(JSON.stringify(scene2)).not.toMatch(/\b60 mg/);
  });
});
