import { Check, ChevronsLeft, ChevronsRight, Circle } from 'lucide-react';
import { Modal } from '../Modal/Modal';
import styles from './SideNav.module.css';

export interface SideNavSubStep {
  /** Short number such as "2.3". */
  label: string;
  /** A two-to-three-word name, shown beside the number. */
  title: string;
  /** What the step says in full: the tooltip. */
  caption?: string;
}

export interface SideNavSceneItem {
  index: number;
  title: string;
  /** Only rendered for the current scene. */
  subSteps?: SideNavSubStep[];
}

export interface SideNavProps {
  scenes: SideNavSceneItem[];
  /** -1 = landing, scenes.length = end card. */
  currentSceneIndex: number;
  expanded: boolean;
  onToggleExpanded: () => void;
  onJumpToScene: (index: number) => void;
  onJumpToLanding: () => void;
  onJumpToEnd: () => void;
  /** Index of the step the viewer is on within the current scene. */
  currentStepIndex?: number;
  /** Jump to a step of the current scene. When omitted the steps are shown but not clickable. */
  onJumpToStep?: (sceneIndex: number, stepIndex: number) => void;
  variant?: 'rail' | 'sheet';
  sheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
}

type ItemState = 'completed' | 'current' | 'future';

function itemIcon(state: ItemState) {
  if (state === 'completed') return <Check size={16} className={styles.iconCompleted} />;
  if (state === 'current') return <Circle size={16} className={styles.iconCurrent} fill="currentColor" />;
  return <Circle size={16} className={styles.iconFuture} />;
}

function SideNavContent({
  scenes,
  currentSceneIndex,
  currentStepIndex = 0,
  onJumpToScene,
  onJumpToLanding,
  onJumpToEnd,
  onJumpToStep,
}: Pick<
  SideNavProps,
  'scenes' | 'currentSceneIndex' | 'currentStepIndex' | 'onJumpToScene' | 'onJumpToLanding' | 'onJumpToEnd' | 'onJumpToStep'
>) {
  const landingState: ItemState = currentSceneIndex > -1 ? 'completed' : 'current';
  const endState: ItemState = currentSceneIndex === scenes.length ? 'current' : 'future';

  return (
    <ul className={styles.list}>
      <li>
        <button type="button" className={styles.item} onClick={onJumpToLanding}>
          {itemIcon(landingState)}
          <span className={styles.itemTitle}>Landing</span>
        </button>
      </li>
      {scenes.map((scene) => {
        const state: ItemState =
          scene.index < currentSceneIndex ? 'completed' : scene.index === currentSceneIndex ? 'current' : 'future';
        return (
          <li key={scene.index}>
            <button
              type="button"
              className={styles.item}
              onClick={() => onJumpToScene(scene.index)}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              {itemIcon(state)}
              <span className={styles.itemTitle}>{scene.title}</span>
            </button>
            {state === 'current' && scene.subSteps && scene.subSteps.length > 0 && (
              <ul className={styles.subList} aria-label={`${scene.title} steps`}>
                {scene.subSteps.map((step, i) => {
                  const stepState: ItemState = i < currentStepIndex ? 'completed' : i === currentStepIndex ? 'current' : 'future';
                  const body = (
                    <>
                      <span className={styles.subNumber}>{step.label}</span>
                      <span className={styles.subCaption}>{step.title}</span>
                    </>
                  );
                  return (
                    <li key={i}>
                      {onJumpToStep ? (
                        <button
                          type="button"
                          className={[styles.subItem, styles[`sub_${stepState}`]].join(' ')}
                          aria-current={stepState === 'current' ? 'step' : undefined}
                          aria-label={`${step.label} ${step.title}`}
                          title={step.caption ?? step.title}
                          onClick={() => onJumpToStep(scene.index, i)}
                        >
                          {body}
                        </button>
                      ) : (
                        <span className={[styles.subItem, styles[`sub_${stepState}`]].join(' ')} title={step.caption ?? step.title}>
                          {body}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
      <li>
        <button type="button" className={styles.item} onClick={onJumpToEnd} aria-current={endState === 'current' ? 'step' : undefined}>
          {itemIcon(endState)}
          <span className={styles.itemTitle}>End card</span>
        </button>
      </li>
    </ul>
  );
}

/** Design spec §6.2. */
export function SideNav({
  scenes,
  currentSceneIndex,
  expanded,
  onToggleExpanded,
  onJumpToScene,
  onJumpToLanding,
  onJumpToEnd,
  currentStepIndex,
  onJumpToStep,
  variant = 'rail',
  sheetOpen = false,
  onSheetOpenChange,
}: SideNavProps) {
  if (variant === 'sheet') {
    return (
      <Modal open={sheetOpen} onOpenChange={onSheetOpenChange ?? (() => {})} title="Navigate" variant="sheet">
        <SideNavContent
          scenes={scenes}
          currentSceneIndex={currentSceneIndex}
          currentStepIndex={currentStepIndex}
          onJumpToScene={onJumpToScene}
          onJumpToLanding={onJumpToLanding}
          onJumpToEnd={onJumpToEnd}
          onJumpToStep={onJumpToStep}
        />
      </Modal>
    );
  }

  return (
    <nav className={[styles.rail, expanded ? styles.expanded : styles.collapsed].join(' ')} aria-label="Scene navigation">
      <div className={styles.projectLabel}>{expanded ? 'TLS' : 'T'}</div>
      {expanded && (
        <SideNavContent
          scenes={scenes}
          currentSceneIndex={currentSceneIndex}
          currentStepIndex={currentStepIndex}
          onJumpToScene={onJumpToScene}
          onJumpToLanding={onJumpToLanding}
          onJumpToEnd={onJumpToEnd}
          onJumpToStep={onJumpToStep}
        />
      )}
      <button
        type="button"
        className={styles.collapseButton}
        onClick={onToggleExpanded}
        aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
      >
        {expanded ? <ChevronsLeft size={18} /> : <ChevronsRight size={18} />}
      </button>
    </nav>
  );
}
