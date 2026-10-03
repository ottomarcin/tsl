import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '../../components/Button/Button';
import { InterventionPanel } from '../../components/InterventionPanel/InterventionPanel';
import { Modal } from '../../components/Modal/Modal';
import { TimelineScrubber } from '../../components/TimelineScrubber/TimelineScrubber';
import { tlsContent } from '../../content/tls';
import { tlsInterventions } from '../../content/tls/interventions';
import { FREE_PLAY_STEP, SCENE5_HOURS, hoursLabel } from '../../lib/scene5';
import { useAppStore } from '../../store/useAppStore';
import { PEAK_LABS } from '../shared/scene5State';
import { displayedTime, useStoryTime } from './useScene5Labs';
import styles from './Scene5Controls.module.css';

const HEADING = 'Try interventions';
const HINT = 'Adjust the slider and toggles to see how interventions change the cascade. Reset returns you to baseline.';
const NOTE = 'Illustrative: simple multipliers to show direction and size of effect, not a prediction for a patient.';

/** The free-play panel wired to the store: used on the scene and in the text-only version. */
export function FreePlayPanel() {
  const state = useAppStore((s) => s.interventionState);
  const setIntervention = useAppStore((s) => s.setInterventionState);
  const reset = useAppStore((s) => s.resetInterventions);
  return (
    <InterventionPanel
      heading={HEADING}
      hint={HINT}
      interventions={tlsInterventions}
      metrics={tlsContent.metrics}
      baseline={PEAK_LABS}
      state={state}
      onChange={setIntervention}
      onReset={reset}
      resetLabel="Reset T+0"
      labsHeading={`Counterfactual labs at T+${SCENE5_HOURS}h`}
      note={NOTE}
    />
  );
}

/** The time scrubber (from the first intervention on) and the free-play panel (step 5.6); on phones and short landscape screens the panel is a bottom sheet. */
export function Scene5Controls({ stepIndex, asSheet }: { stepIndex: number; asSheet: boolean }) {
  const scrub = useAppStore((s) => s.scrub);
  const setScrub = useAppStore((s) => s.setScrub);
  const [sheetOpen, setSheetOpen] = useState(false);
  const tau = displayedTime(useStoryTime(), scrub);

  const panel = <FreePlayPanel />;
  const scrubber = (
    <TimelineScrubber
      value={tau}
      onChange={setScrub}
      startLabel={hoursLabel(0)}
      endLabel={`T+${SCENE5_HOURS}h`}
      currentLabel={hoursLabel(tau)}
      ariaLabel="Time since lysis began"
    />
  );
  // With the panel in a bottom sheet the scrubber goes in with it, which leaves the scene itself uncluttered.
  const scrubberInSheet = asSheet && stepIndex === FREE_PLAY_STEP;

  return (
    <>
      {stepIndex >= 1 && !scrubberInSheet && <div className={styles.scrubber}>{scrubber}</div>}
      {stepIndex === FREE_PLAY_STEP &&
        (asSheet ? (
          <>
            <div className={styles.sheetButton}>
              <Button variant="secondary" size="md" iconLeading={<SlidersHorizontal size={16} aria-hidden="true" />} onClick={() => setSheetOpen(true)}>
                {HEADING}
              </Button>
            </div>
            <Modal open={sheetOpen} onOpenChange={setSheetOpen} title={HEADING} variant="sheet">
              <div className={styles.sheetScrubber}>{scrubber}</div>
              {panel}
            </Modal>
          </>
        ) : (
          <div className={styles.panel}>{panel}</div>
        ))}
    </>
  );
}
