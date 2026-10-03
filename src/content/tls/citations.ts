import type { Citation } from '../schema';

// The reference list of tls_scenario_script.md, in one format (NLM/Vancouver): authors (the first six, then "et al."),
// title, journal abbreviation, year;volume(issue):pages, and the DOI where the script gives one. Ids match that
// document's bracket numbers (e.g. "1" == [1]) so scene content can cite them directly. [19] was added later.
const REGISTRY: Record<string, Citation> = {
  '1': {
    id: '1',
    text: 'Howard SC, Jones DP, Pui CH. The tumor lysis syndrome. N Engl J Med. 2011;364(19):1844–1854. doi:10.1056/NEJMra0904569',
    url: 'https://doi.org/10.1056/NEJMra0904569',
  },
  '2': {
    id: '2',
    text: 'Cairo MS, Bishop M. Tumour lysis syndrome: new therapeutic strategies and classification. Br J Haematol. 2004;127(1):3–11.',
  },
  '3': {
    id: '3',
    text: 'Coiffier B, Altman A, Pui CH, Younes A, Cairo MS. Guidelines for the management of pediatric and adult tumor lysis syndrome: an evidence-based review. J Clin Oncol. 2008;26(16):2767–2778. doi:10.1200/JCO.2007.15.0177',
    url: 'https://doi.org/10.1200/JCO.2007.15.0177',
  },
  '4': {
    id: '4',
    text: 'Jones GL, Will A, Jackson GH, Webb NJ, Rule S; British Committee for Standards in Haematology. Guidelines for the management of tumour lysis syndrome in adults and children with haematological malignancies. Br J Haematol. 2015;169(5):661–671.',
  },
  '5': {
    id: '5',
    text: 'Chan YLT, El-Sharkawi D, Shah P, Chanouzas D, O\'Connor D, Marks SD, et al.; BSH Committee. British Society for Haematology updated guidelines for the diagnosis and management of tumour lysis syndrome in adults and children with haematological malignancies: a focus on patient safety. Br J Haematol. 2025;207(4):1248–1258. doi:10.1111/bjh.70092',
    url: 'https://doi.org/10.1111/bjh.70092',
  },
  '6': {
    id: '6',
    text: 'Perazella MA, Herlitz LC. The crystalline nephropathies. Kidney Int Rep. 2021;6(12):2942–2957. doi:10.1016/j.ekir.2021.09.003',
    url: 'https://doi.org/10.1016/j.ekir.2021.09.003',
  },
  '7': {
    id: '7',
    text: 'Arnaud M, Loiselle M, Vaganay C, Pons S, Letavernier E, Demonchy J, et al. Tumor lysis syndrome and AKI: beyond crystal mechanisms. J Am Soc Nephrol. 2022;33(6):1154–1171. doi:10.1681/ASN.2021070997',
    url: 'https://doi.org/10.1681/ASN.2021070997',
  },
  '8': {
    id: '8',
    text: 'Howard SC, Trifilio S, Gregory TK, Baxter N, McBride A. Tumor lysis syndrome in the era of novel and targeted agents in patients with hematologic malignancies: a systematic review. Ann Hematol. 2016;95(4):563–573.',
  },
  '9': {
    id: '9',
    text: 'Clase CM, Carrero JJ, Ellison DH, et al.; KDIGO Controversies Conference. Potassium homeostasis and management of dyskalemia in kidney diseases. Kidney Int. 2020;97(1):42–61.',
  },
  '10': {
    id: '10',
    text: 'Spina M, Nagy Z, Ribera JM, et al. FLORENCE: a randomized, double-blind, phase III pivotal study of febuxostat versus allopurinol for the prevention of tumor lysis syndrome in patients with hematologic malignancies at intermediate to high TLS risk. Ann Oncol. 2015;26(10):2155–2161.',
  },
  '11': {
    id: '11',
    text: 'Belay Y, Yirdaw K, Enawgaw B. Tumor lysis syndrome in patients with hematological malignancies. J Oncol. 2017;2017:9684909.',
  },
  '12': {
    id: '12',
    text: 'Adeyinka A, Kaur A, Bashir K. Tumor lysis syndrome. In: StatPearls [Internet]. Treasure Island (FL): StatPearls Publishing; updated 2024 Oct. Bookshelf ID: NBK518985.',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK518985/',
  },
  '13': {
    id: '13',
    text: 'Farkas J. Tumor lysis syndrome. In: Internet Book of Critical Care [Internet]. EMCrit Project; first published 2019 Aug 22.',
    url: 'https://emcrit.org/pulmcrit/tumor-lysis-syndrome/',
  },
  '14': {
    id: '14',
    text: 'Tosi P, Barosi G, Lazzaro C, et al. Consensus conference on the management of tumor lysis syndrome. Haematologica. 2008;93(12):1877–1885.',
  },
  '15': {
    id: '15',
    text: 'Larson RA, Pui CH. Tumor lysis syndrome: pathogenesis, clinical manifestations, definition, etiology and risk factors. In: UpToDate [Internet]. Regularly updated.',
  },
  '16': {
    id: '16',
    text: 'Ejaz AA, Johnson RJ, Shimada M, et al. The role of uric acid in acute kidney injury. Nephron. 2019;142(4):275–283.',
  },
  '17': {
    id: '17',
    text: 'Cairo MS, Coiffier B, Reiter A, Younes A; TLS Expert Panel. Recommendations for the evaluation of risk and prophylaxis of tumour lysis syndrome in adults and children with malignant diseases: an expert TLS panel consensus. Br J Haematol. 2010;149(4):578–586.',
  },
  '18': {
    id: '18',
    text: 'Mattu A, Brady WJ, Robinson DA. Electrocardiographic manifestations of hyperkalemia. Am J Emerg Med. 2000;18(6):721–729.',
  },
  '19': {
    id: '19',
    text: 'Montague BT, Ouellette JR, Buller GK. Retrospective review of the frequency of ECG changes in hyperkalemia. Clin J Am Soc Nephrol. 2008;3(2):324–330.',
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

/**
 * Where to read a reference: its own link when it has one, otherwise a search for it. The scenario script lists
 * journal references without identifiers, and a link made up from memory could point at the wrong paper, so these are
 * searches (PubMed for journal articles, the web for the online references).
 */
export function sourceLink(citation: Citation): string {
  if (citation.url) return citation.url;
  const query = encodeURIComponent(citation.text.replace(/\s+/g, ' '));
  return /StatPearls|Internet Book|UpToDate/.test(citation.text)
    ? `https://www.google.com/search?q=${query}`
    : `https://pubmed.ncbi.nlm.nih.gov/?term=${query}`;
}
