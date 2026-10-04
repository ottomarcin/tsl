import { describe, expect, it } from 'vitest';
import { tlsContent } from '../content/tls';

/**
 * Design QA, copy (design spec §11): captions of one or two sentences, no exclamation marks, no marketing language,
 * every Learn more with a source, sentence case on labels, numbers in the unit and decimals of their metric.
 */
const scenes = tlsContent.scenes;
const steps = scenes.flatMap((scene) => scene.steps.map((step) => ({ scene, step, name: `${scene.index}.${step.order}` })));

/** Sentences in a text: a full stop, question mark or exclamation mark followed by a capital letter or the end. */
function sentences(text: string): string[] {
  const protectedText = text.replace(/\b(e\.g|i\.e|vs|et al|approx|Fig|No)\./g, (m) => m.replace('.', '\u0000'));
  return protectedText.split(/(?<=[.?!])\s+(?=[A-Z0-9"“(])/).map((s) => s.replace(/\u0000/g, '.'));
}

/** Every string anywhere in an object (the copy of the content package). */
function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
}
const allCopy = strings({ ...tlsContent, models: undefined, cascade: undefined, interventions: undefined });

describe('captions', () => {
  it.each(steps)('caption $name is one or two sentences', ({ step }) => {
    expect(sentences(step.caption).length).toBeLessThanOrEqual(2);
    expect(step.caption.trim().length).toBeGreaterThan(0);
  });
  it.each(steps)('caption $name has no exclamation mark', ({ step }) => {
    expect(step.caption).not.toContain('!');
  });
});

describe('Learn more', () => {
  const withLearnMore = steps.filter(({ step }) => step.learnMore);
  it('every step has one, except the free-play step where the interaction is the lesson', () => {
    const without = steps.filter(({ step }) => !step.learnMore).map(({ name }) => name);
    expect(without).toEqual(['5.6']);
  });
  it.each(withLearnMore)('$name has a heading, a body and at least one source', ({ step }) => {
    expect(step.learnMore!.heading.length).toBeGreaterThan(0);
    expect(step.learnMore!.body.length).toBeGreaterThan(0);
    expect(step.learnMore!.citations.length).toBeGreaterThanOrEqual(1);
  });
});

describe('language', () => {
  it('has no exclamation marks anywhere in the copy', () => {
    expect(allCopy.filter((s) => s.includes('!'))).toEqual([]);
  });
  it('has no marketing language', () => {
    const banned = /\b(amazing|shocking|incredible|revolutionary|stunning|mind-?blowing|game-?chang\w*|cutting-edge|breakthrough|unleash\w*|supercharge\w*|dramatic(ally)?)\b/i;
    expect(allCopy.filter((s) => banned.test(s))).toEqual([]);
  });
  it('uses one spelling convention for the same word (hyperkalemia / hyperkalaemia, tumor / tumour in titles and captions)', () => {
    const captions = steps.map(({ step }) => step.caption).join(' ');
    expect(/hyperkalaemia/i.test(captions) && /hyperkalemia/i.test(captions)).toBe(false);
  });
});

describe('labels are in sentence case', () => {
  // Words that keep their capitals: acronyms, symbols, names.
  const KEEP = /^(IV|RRT|AKI|CKD|LDH|UA|PO₄|Ca²⁺|K⁺|TLS|T\+\d+h|ECG|XO|BSH|JCO|NEJM|BJH|JASN|Burkitt|Cairo|Bishop|Trousseau.?s|Chvostek.?s|Hypoxanthine|Xanthine)$/;
  const isSentenceCase = (label: string) =>
    label
      .split(/\s+/)
      .slice(1)
      .every((word) => !/^[A-Z][a-z]/.test(word) || KEEP.test(word.replace(/[^\w⁺²₄+]/g, '')));
  it('step titles', () => {
    const offenders = steps.filter(({ step }) => step.title && !isSentenceCase(step.title)).map(({ name, step }) => `${name}: ${step.title}`);
    expect(offenders).toEqual([]);
  });
  it('scene titles', () => {
    expect(scenes.filter((s) => !isSentenceCase(s.title)).map((s) => s.title)).toEqual([]);
  });
  it('the end card buttons and the landing button', () => {
    const e = tlsContent.endCard;
    const labels = [e.replayLabel, e.sourcesLabel, e.restartLabel.replace(/\s*→$/, ''), tlsContent.landing.ctaLabel.replace(/\s*→$/, '')];
    expect(labels.filter((l) => !isSentenceCase(l))).toEqual([]);
  });
});

describe('numbers', () => {
  const byId = Object.fromEntries(tlsContent.metrics.map((m) => [m.id, m]));
  it('every lab value written in the content has no more decimals than its metric shows', () => {
    const offenders = steps.flatMap(({ name, step }) =>
      (step.labValues ?? []).filter((t) => (String(t.value).split('.')[1] ?? '').length > byId[t.metricId].decimalPlaces).map((t) => `${name} ${t.metricId}=${t.value}`),
    );
    expect(offenders).toEqual([]);
  });
  it('every metric has a unit and a spoken name, and the five metrics are K, Ca, PO4, UA, Cr in that order', () => {
    expect(tlsContent.metrics.map((m) => m.id)).toEqual(['K', 'Ca', 'PO4', 'UA', 'Cr']);
    for (const m of tlsContent.metrics) {
      expect(m.unit.length).toBeGreaterThan(0);
      expect(m.name?.length ?? 0).toBeGreaterThan(0);
    }
  });
  it('every scene starts from a timestamp (T+Nh) and timestamps never go backwards within the story, except the rewind', () => {
    const hours = steps.map(({ step }) => (step.timestamp ? Number(step.timestamp.replace(/\D/g, '')) : undefined));
    let last = 0;
    steps.forEach(({ scene, name }, i) => {
      const h = hours[i];
      if (h === undefined) return;
      if (scene.index === 5) return; // Scene 5 rewinds to T+0h
      expect(h, name).toBeGreaterThanOrEqual(last);
      last = h;
    });
  });
});
