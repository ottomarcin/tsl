import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { getFlag, type DiseaseMetric, type SceneDefinition } from '../../content/schema';
import styles from './TextOnlyView.module.css';

export interface TextOnlyViewProps {
  scene: SceneDefinition;
  metrics: DiseaseMetric[];
  /** Lab values at a step (0-based). */
  labsFor: (stepIndex: number) => Record<string, number>;
  timestampFor: (stepIndex: number) => string | undefined;
  /** Extra content under a step (e.g. an interactive panel). */
  extraFor?: (stepIndex: number) => ReactNode;
}

const FLAG_WORD = { normal: 'normal', amber: 'abnormal', red: 'critical' } as const;

/** The id of a step's section, so the side navigation can scroll to it. */
export const textStepId = (sceneIndex: number, stepIndex: number) => `step-${sceneIndex}-${stepIndex}`;

/**
 * The whole scene as text (design spec §9, "Accessibility mode"): every step's caption, its labs and its full Learn
 * more content with sources, in order, in place of the 3D scene. Nothing here depends on the canvas.
 */
export function TextOnlyView({ scene, metrics, labsFor, timestampFor, extraFor }: TextOnlyViewProps) {
  return (
    <article className={styles.article} aria-labelledby={`scene-title-${scene.index}`}>
      <h1 id={`scene-title-${scene.index}`} className={styles.sceneTitle}>
        Scene {scene.index}: {scene.title}
      </h1>
      {scene.steps.map((step, i) => {
        const labs = labsFor(i);
        const stamp = timestampFor(i);
        return (
          <section key={step.id} id={textStepId(scene.index, i)} className={styles.step} aria-labelledby={`${step.id}-title`}>
            <h2 id={`${step.id}-title`} className={styles.stepTitle}>
              <span className={styles.number}>
                {scene.index}.{step.order}
              </span>{' '}
              {step.title ?? step.caption}
            </h2>
            <p className={styles.caption}>{step.caption}</p>
            {Object.keys(labs).length > 0 && (
              <>
                <h3 className={styles.labsTitle}>Lab values{stamp ? ` at ${stamp}` : ''}</h3>
                <ul className={styles.labs}>
                  {metrics
                    .filter((m) => labs[m.id] !== undefined)
                    .map((m) => (
                      <li key={m.id}>
                        {m.name ?? m.label}: {labs[m.id].toFixed(m.decimalPlaces)} {m.unit} ({FLAG_WORD[getFlag(m, labs[m.id])]})
                      </li>
                    ))}
                </ul>
              </>
            )}
            {step.learnMore && (
              <div className={styles.learn}>
                <h3 className={styles.learnTitle}>{step.learnMore.heading}</h3>
                <p className={styles.body}>{step.learnMore.body}</p>
                {step.learnMore.citations.length > 0 && (
                  <>
                    <p className={styles.sourcesLabel}>Sources for this step</p>
                    <ul className={styles.sources}>
                      {step.learnMore.citations.map((c) => (
                        <li key={c.id}>
                          {c.url ? (
                            <a href={c.url} target="_blank" rel="noreferrer noopener">
                              {c.text} [{c.id}] <ExternalLink size={12} aria-hidden="true" />
                            </a>
                          ) : (
                            <span>
                              {c.text} [{c.id}]
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
            {extraFor?.(i)}
          </section>
        );
      })}
    </article>
  );
}
