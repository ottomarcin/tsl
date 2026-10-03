import { describe, expect, it } from 'vitest';
import { tlsMetrics } from '../content/tls/metrics';
import { labAnnouncement, pageTitle, sceneAnnouncement } from './announce';

describe('labAnnouncement', () => {
  it('names the metric, the new value with its unit, and the flag', () => {
    expect(labAnnouncement(tlsMetrics, { K: 4.2 }, { K: 6.3 })).toBe('Potassium now 6.3 mmol/L, critical.');
  });
  it('uses plain words for the flags: normal, abnormal, critical', () => {
    expect(labAnnouncement(tlsMetrics, {}, { K: 4.2 })).toContain('normal');
    expect(labAnnouncement(tlsMetrics, {}, { K: 5.5 })).toContain('abnormal');
    expect(labAnnouncement(tlsMetrics, {}, { Ca: 6.5 })).toContain('critical');
  });
  it('says nothing about values that did not change as shown', () => {
    expect(labAnnouncement(tlsMetrics, { K: 6.3, Ca: 7.0 }, { K: 6.31, Ca: 8.0 })).toBe('Calcium now 8.0 mg/dL, abnormal.');
    expect(labAnnouncement(tlsMetrics, { K: 6.3 }, { K: 6.3 })).toBe('');
  });
  it('lists several changes in the order of the strip', () => {
    const text = labAnnouncement(tlsMetrics, { K: 4.2, Cr: 0.9 }, { K: 6.3, Cr: 3.1 });
    expect(text.indexOf('Potassium')).toBeLessThan(text.indexOf('Creatinine'));
  });
  it('falls back to the label when a metric has no spoken name', () => {
    expect(labAnnouncement([{ ...tlsMetrics[0], name: undefined }], {}, { K: 4.2 })).toMatch(/^K⁺ now/);
  });
});

describe('sceneAnnouncement / pageTitle', () => {
  it('reads "Scene N: Title. Caption"', () => {
    expect(sceneAnnouncement(2, 'The cascade', 'Both branches converge.')).toBe('Scene 2: The cascade. Both branches converge.');
    expect(sceneAnnouncement(2, 'The cascade')).toBe('Scene 2: The cascade.');
  });
  it('titles the document per route', () => {
    expect(pageTitle('Tumor Lysis Syndrome', { kind: 'landing' })).toBe('Tumor Lysis Syndrome');
    expect(pageTitle('Tumor Lysis Syndrome', { kind: 'scene', index: 2, title: 'The cascade' })).toBe('Tumor Lysis Syndrome · Scene 2 — The cascade');
    expect(pageTitle('Tumor Lysis Syndrome', { kind: 'end' })).toBe('Tumor Lysis Syndrome · End');
  });
});
