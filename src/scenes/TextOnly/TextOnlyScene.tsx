import { TextOnlyView } from '../../components/TextOnlyView/TextOnlyView';
import { tlsContent } from '../../content/tls';
import { tlsInterventions } from '../../content/tls/interventions';
import { FREE_PLAY_STEP, SCENE5_INDEX, hoursLabel, interventionsForStep, labsAt } from '../../lib/scene5';
import { labValuesAt, timestampAt } from '../../lib/steps';
import { BASELINE_LABS, PEAK_LABS } from '../shared/scene5State';
import { FreePlayPanel } from '../Scene5/Scene5Controls';

/**
 * A scene as text, with each step's labs. Scene 5's labs are the counterfactuals for the interventions of that step
 * (the first step is the T+0 baseline), and its last step carries the interactive panel, which is plain HTML.
 */
export function TextOnlyScene({ sceneIndex }: { sceneIndex: number }) {
  const scene = tlsContent.scenes[sceneIndex];
  const isScene5 = sceneIndex === SCENE5_INDEX;
  return (
    <TextOnlyView
      scene={scene}
      metrics={tlsContent.metrics}
      labsFor={(i) =>
        isScene5
          ? i === 0
            ? BASELINE_LABS
            : i === FREE_PLAY_STEP
              ? PEAK_LABS
              : labsAt(1, BASELINE_LABS, PEAK_LABS, interventionsForStep(i, {}), tlsInterventions)
          : labValuesAt(tlsContent.scenes, sceneIndex, i)
      }
      timestampFor={(i) => (isScene5 ? hoursLabel(i === 0 ? 0 : 1) : timestampAt(tlsContent.scenes, sceneIndex, i))}
      extraFor={isScene5 ? (i) => (i === FREE_PLAY_STEP ? <FreePlayPanel /> : null) : undefined}
    />
  );
}
