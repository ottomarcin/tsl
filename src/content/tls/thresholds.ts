/**
 * Calcium × phosphate solubility product above which calcium phosphate precipitates, in mg²/dL².
 *
 * The scenario script's reviewer notes leave 60 vs 70 open; the experience uses 70 everywhere. To switch, change this
 * one number: the Scene 2 Learn more text (including the mmol²/L² conversion) is built from it.
 */
export const CA_PO4_SOLUBILITY_PRODUCT_MG2_DL2 = 70;

/** mg/dL → mmol/L for calcium (40.08 g/mol) and phosphorus (30.97 g/mol): the product converts by 1 / (4.008 × 3.097). */
const MG_TO_MMOL_PRODUCT = 1 / (4.008 * 3.097);

export function caPo4ThresholdMmol2L2(mg2dl2 = CA_PO4_SOLUBILITY_PRODUCT_MG2_DL2): number {
  return mg2dl2 * MG_TO_MMOL_PRODUCT;
}

/** "70 mg²/dL² (5.6 mmol²/L²)" */
export function caPo4ThresholdText(mg2dl2 = CA_PO4_SOLUBILITY_PRODUCT_MG2_DL2): string {
  return `${mg2dl2} mg²/dL² (${caPo4ThresholdMmol2L2(mg2dl2).toFixed(1)} mmol²/L²)`;
}
