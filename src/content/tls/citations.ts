import type { Citation } from '../schema';

// Full reference list transcribed verbatim from tls_scenario_script.md's
// "Full reference list" section. Ids match that document's bracket numbers
// (e.g. "1" == [1]) so scene content can cite them directly.
const REGISTRY: Record<string, Citation> = {
  '1': { id: '1', text: 'Howard SC, Jones DP, Pui CH. The tumor lysis syndrome. N Engl J Med 2011;364(19):1844–1854.' },
  '2': { id: '2', text: 'Cairo MS, Bishop M. Tumour lysis syndrome: new therapeutic strategies and classification. Br J Haematol 2004;127(1):3–11.' },
  '3': {
    id: '3',
    text: 'Coiffier B, Altman A, Pui CH, Younes A, Cairo MS. Guidelines for the management of pediatric and adult tumor lysis syndrome: an evidence-based review. J Clin Oncol 2008;26(16):2767–2778.',
  },
  '4': {
    id: '4',
    text: 'Jones GL, Will A, Jackson GH, Webb NJ, Rule S. Guidelines for the management of tumour lysis syndrome in adults and children with haematological malignancies on behalf of the British Committee for Standards in Haematology. Br J Haematol 2015;169(5):661–671.',
  },
  '5': {
    id: '5',
    text: 'Williams et al. (BSH). British Society for Haematology updated guidelines for the diagnosis and management of tumour lysis syndrome in adults and children with haematological malignancies. Br J Haematol 2025.',
  },
  '6': { id: '6', text: 'Perazella MA, Herlitz LC. The Crystalline Nephropathies. Kidney Int Rep 2021;6(12):2942–2957.' },
  '7': {
    id: '7',
    text: 'Zafrani L, Canet E, Darmon M et al. Tumor lysis syndrome and acute kidney injury: beyond crystal mechanisms. J Am Soc Nephrol 2023.',
  },
  '8': {
    id: '8',
    text: 'Howard SC, Trifilio S, Gregory TK, Baxter N, McBride A. Tumor lysis syndrome in the era of novel and targeted agents in patients with hematologic malignancies: a systematic review. Ann Hematol 2016;95(4):563–573.',
  },
  '9': {
    id: '9',
    text: 'Clase CM, Carrero JJ, Ellison DH et al. (KDIGO Controversies Conference). Potassium homeostasis and management of dyskalemia in kidney diseases. Kidney Int 2020;97(1):42–61.',
  },
  '10': {
    id: '10',
    text: 'Spina M, Nagy Z, Ribera JM et al. FLORENCE: a randomized, double-blind, phase III pivotal study of febuxostat versus allopurinol for the prevention of tumor lysis syndrome in patients with hematologic malignancies at intermediate to high TLS risk. Ann Oncol 2015;26:2155–2161.',
  },
  '11': { id: '11', text: 'Belay Y, Yirdaw K, Enawgaw B. Tumor Lysis Syndrome in Patients with Hematological Malignancies. J Oncol 2017;2017:9684909.' },
  '12': { id: '12', text: 'Adeyinka A, Bashir K. Tumor Lysis Syndrome. StatPearls (NCBI Bookshelf), updated 2024. NBK518985.' },
  '13': { id: '13', text: 'Farkas J. Tumor Lysis Syndrome. Internet Book of Critical Care (IBCC), EMCrit, updated 2025.' },
  '14': {
    id: '14',
    text: 'Tosi P, Barosi G, Lazzaro C et al. Consensus conference on the management of tumor lysis syndrome. Haematologica 2008;93(12):1877–1885.',
  },
  '15': {
    id: '15',
    text: 'Larson RA, Pui CH. Tumor lysis syndrome: pathogenesis, clinical manifestations, definition, etiology and risk factors. UpToDate.',
  },
  '16': { id: '16', text: 'Shimada M, Johnson RJ et al. Hyperuricemia, uric acid, and acute kidney injury. Nephron 2019;142(4):275–283.' },
  '17': {
    id: '17',
    text: 'Cairo MS, Coiffier B, Reiter A, Younes A (TLS Expert Panel). Recommendations for the evaluation of risk and prophylaxis of tumour lysis syndrome in adults and children with malignant diseases: an expert TLS panel consensus. Br J Haematol 2010;149(4):578–586.',
  },
  '18': { id: '18', text: 'Mattu A, Brady WJ, Robinson DA. ECG Diagnosis: Hyperkalemia. Perm J 2014;18(2):e120.' },
  // Added after the scenario script was written, to source the caveat that the classical ECG sequence is unreliable.
  '19': {
    id: '19',
    text: 'Montague BT, Ouellette JR, Buller GK. Retrospective review of the frequency of ECG changes in hyperkalemia. Clin J Am Soc Nephrol 2008;3(2):324–330.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2390954',
  },
};

export function cite(...ids: string[]): Citation[] {
  return ids.map((id) => {
    const citation = REGISTRY[id];
    if (!citation) throw new Error(`Unknown citation id: ${id}`);
    return citation;
  });
}

export const allTlsCitations: Citation[] = Object.values(REGISTRY);
