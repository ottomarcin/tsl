import { describe, expect, it } from 'vitest';
import { allTlsCitations, cite, sourceLink } from './citations';
import { tlsContent } from './index';

describe('citations', () => {
  it('resolves known ids to their citation objects', () => {
    expect(cite('1')).toMatchObject([{ id: '1', text: expect.stringContaining('Howard SC') }]);
  });

  it('throws on an unknown citation id, catching typos rather than silently returning nothing', () => {
    expect(() => cite('999')).toThrow(/Unknown citation id/);
  });

  it('exposes the 18 references from the scenario script bibliography plus [19], added for the ECG caveat', () => {
    expect(allTlsCitations).toHaveLength(19);
    expect(new Set(allTlsCitations.map((c) => c.id)).size).toBe(19);
    expect(cite('19')[0].text).toContain('Montague');
    expect(cite('19')[0].url).toMatch(/^https:\/\//);
  });

  it('never uses a citation id outside the known registry anywhere in the scene content', () => {
    const knownIds = new Set(allTlsCitations.map((c) => c.id));
    for (const scene of tlsContent.scenes) {
      for (const step of scene.steps) {
        for (const citation of step.learnMore?.citations ?? []) {
          expect(knownIds.has(citation.id)).toBe(true);
        }
      }
    }
  });

  describe('sourceLink', () => {
    it('uses the reference\'s own link when it has one', () => {
      expect(sourceLink(cite('19')[0])).toBe('https://pmc.ncbi.nlm.nih.gov/articles/PMC2390954');
    });
    it('otherwise searches PubMed for journal articles and the web for the online references', () => {
      expect(sourceLink(cite('2')[0])).toMatch(/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\?term=/);
      // StatPearls and the IBCC now have their own links; UpToDate has none to give.
      expect(sourceLink(cite('15')[0])).toMatch(/^https:\/\/www\.google\.com\/search\?q=/);
      expect(sourceLink(cite('12')[0])).toBe('https://www.ncbi.nlm.nih.gov/books/NBK518985/');
      expect(sourceLink(cite('13')[0])).toBe('https://emcrit.org/pulmcrit/tumor-lysis-syndrome/');
    });
    it('puts the whole reference in the search, encoded', () => {
      expect(sourceLink(cite('2')[0])).toContain(encodeURIComponent('Cairo MS, Bishop M.'));
    });
  });

  describe('bibliographic details (checked against the publishers\' records)', () => {
    it('the 2025 BSH guideline is Chan et al., Br J Haematol 2025;207(4):1248–1258, with its DOI', () => {
      const c = cite('5')[0];
      expect(c.text).toMatch(/^Chan YLT, El-Sharkawi D/);
      expect(c.text).toContain('2025;207(4):1248–1258');
      expect(c.url).toBe('https://doi.org/10.1111/bjh.70092');
      expect(c.text).not.toMatch(/Williams/);
    });
    it('the histone paper is Arnaud et al., JASN 2022;33(6):1154–1171', () => {
      const c = cite('7')[0];
      expect(c.text).toMatch(/^Arnaud M/);
      expect(c.text).toContain('2022;33(6):1154–1171');
      expect(c.url).toBe('https://doi.org/10.1681/ASN.2021070997');
      expect(c.text).not.toMatch(/2023/);
    });
    it('the uric-acid AKI review is Ejaz, Johnson, Shimada et al., "The role of uric acid in acute kidney injury"', () => {
      expect(cite('16')[0].text).toMatch(/^Ejaz AA, Johnson RJ, Shimada M, et al\. The role of uric acid in acute kidney injury\. Nephron\. 2019;142\(4\):275–283/);
    });
    it('the ECG reference is Mattu et al., Am J Emerg Med 2000;18(6):721–729', () => {
      expect(cite('18')[0].text).toContain('Am J Emerg Med. 2000;18(6):721–729');
      expect(cite('18')[0].text).not.toMatch(/Perm J/);
    });
    it('StatPearls lists all three authors, and the IBCC chapter carries a date it can be checked against', () => {
      expect(cite('12')[0].text).toMatch(/^Adeyinka A, Kaur A, Bashir K/);
      expect(cite('13')[0].text).toContain('2019 Aug 22');
    });
  });
});
