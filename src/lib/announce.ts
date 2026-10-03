import { getFlag, type DiseaseMetric, type FlagLevel } from '../content/schema';

const FLAG_WORD: Record<FlagLevel, string> = { normal: 'normal', amber: 'abnormal', red: 'critical' };

/** "Potassium now 6.3 mmol/L, critical." for each metric whose shown value or flag changed; empty when none did. */
export function labAnnouncement(metrics: DiseaseMetric[], before: Record<string, number>, after: Record<string, number>): string {
  const parts: string[] = [];
  for (const m of metrics) {
    const next = after[m.id];
    if (next === undefined) continue;
    const prev = before[m.id];
    const shown = (v: number) => v.toFixed(m.decimalPlaces);
    if (prev !== undefined && shown(prev) === shown(next)) continue;
    parts.push(`${m.name ?? m.label} now ${shown(next)} ${m.unit}, ${FLAG_WORD[getFlag(m, next)]}.`);
  }
  return parts.join(' ');
}

/** "Scene 2: The cascade. <first caption>" — what a scene change says to a screen reader. */
export function sceneAnnouncement(index: number, title: string, caption?: string): string {
  return `Scene ${index}: ${title}.${caption ? ` ${caption}` : ''}`;
}

/** Document title per scene (design spec §9). */
export function pageTitle(app: string, route: { kind: 'landing' } | { kind: 'end' } | { kind: 'scene'; index: number; title: string }): string {
  if (route.kind === 'landing') return app;
  if (route.kind === 'end') return `${app} · End`;
  return `${app} · Scene ${route.index} — ${route.title}`;
}
