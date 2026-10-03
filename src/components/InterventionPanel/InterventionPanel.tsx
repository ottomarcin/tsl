import * as Slider from '@radix-ui/react-slider';
import * as Switch from '@radix-ui/react-switch';
import { ArrowDown, ArrowUp, RotateCcw } from 'lucide-react';
import type { DiseaseMetric, InterventionDefinition, InterventionStateMap, MetricValueMap } from '../../content/schema';
import styles from './InterventionPanel.module.css';

export interface InterventionPanelProps {
  heading: string;
  hint: string;
  interventions: InterventionDefinition[];
  metrics: DiseaseMetric[];
  /** The untreated values the counterfactuals start from. */
  baseline: MetricValueMap;
  state: InterventionStateMap;
  onChange: (id: string, value: number | boolean) => void;
  onReset: () => void;
  resetLabel: string;
  /** Heading of the lab table, naming the moment it describes (e.g. "Counterfactual labs at T+48h"). */
  labsHeading?: string;
  /** A caveat shown under the numbers (these are illustrations, not predictions). */
  note?: string;
}

const clinicallyBetter = (metric: DiseaseMetric, before: number, after: number) =>
  Math.abs(after - mid(metric)) < Math.abs(before - mid(metric));
const mid = (metric: DiseaseMetric) => (metric.thresholds.normal[0] + metric.thresholds.normal[1]) / 2;

/**
 * Design spec §6.14 / asset spec `s5_intervention_panel`. Generic (tech arch §8.2): it knows nothing about TLS, only
 * the list of interventions (each with its own effect function), the metrics to show and the untreated baseline. The
 * counterfactual is the interventions' effect functions folded over the baseline.
 */
export function InterventionPanel({ heading, hint, interventions, metrics, baseline, state, onChange, onReset, resetLabel, labsHeading = 'Counterfactual labs', note }: InterventionPanelProps) {
  const treated = interventions.reduce((acc, def) => def.applyEffect(acc, state), { ...baseline });
  return (
    <section className={styles.panel} aria-label={heading}>
      <h2 className={styles.heading}>{heading}</h2>
      <p className={styles.hint}>{hint}</p>

      <div className={styles.controls}>
        {interventions.map((def) => {
          if (def.controlType === 'slider') {
            const max = def.slider?.max ?? 1;
            const value = typeof state[def.id] === 'number' ? (state[def.id] as number) : 0;
            return (
              <div key={def.id} className={styles.control}>
                <div className={styles.controlHead}>
                  <label id={`ip-${def.id}`} className={styles.label}>
                    {def.label}
                  </label>
                  <span className={styles.value}>
                    {(value * max).toFixed(1)} {def.slider?.unit}
                  </span>
                </div>
                <Slider.Root className={styles.slider} min={0} max={1} step={0.025} value={[value]} onValueChange={([v]) => onChange(def.id, v)}>
                  <Slider.Track className={styles.track}>
                    <Slider.Range className={styles.range} />
                  </Slider.Track>
                  <Slider.Thumb className={styles.thumb} aria-labelledby={`ip-${def.id}`} aria-valuetext={`${(value * max).toFixed(1)} ${def.slider?.unit ?? ''}`} />
                </Slider.Root>
              </div>
            );
          }
          return (
            <div key={def.id} className={[styles.control, styles.toggleRow].join(' ')}>
              <label htmlFor={`ip-${def.id}`} className={styles.label}>
                {def.label}
              </label>
              <Switch.Root id={`ip-${def.id}`} className={styles.switch} checked={state[def.id] === true} onCheckedChange={(on) => onChange(def.id, on)}>
                <Switch.Thumb className={styles.switchThumb} />
              </Switch.Root>
            </div>
          );
        })}
      </div>

      <table className={styles.labs}>
        <caption className={styles.caption}>{labsHeading}</caption>
        <tbody>
          {metrics.map((m) => {
            const before = baseline[m.id];
            const after = treated[m.id];
            if (before === undefined || after === undefined) return null;
            // Compared as shown: a change too small to show would otherwise get an arrow beside two equal numbers.
            const shown = (v: number) => v.toFixed(m.decimalPlaces);
            const changed = shown(after) !== shown(before);
            const better = clinicallyBetter(m, before, after);
            return (
              <tr key={m.id}>
                <th scope="row" className={styles.metric}>
                  {m.label}
                </th>
                <td className={styles.before}>{shown(before)}</td>
                <td className={styles.arrowCell} aria-hidden="true">
                  →
                </td>
                <td className={changed ? styles.after : styles.same}>
                  {shown(after)} <span className={styles.unit}>{m.unit}</span>
                </td>
                <td className={styles.delta}>
                  {changed && (
                    <span className={better ? styles.better : styles.worse} role="img" aria-label={after < before ? 'lower' : 'higher'}>
                      {after < before ? <ArrowDown size={13} aria-hidden="true" /> : <ArrowUp size={13} aria-hidden="true" />}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {note && <p className={styles.note}>{note}</p>}

      <button type="button" className={styles.reset} onClick={onReset}>
        <RotateCcw size={14} aria-hidden="true" />
        {resetLabel}
      </button>
    </section>
  );
}
