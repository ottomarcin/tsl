import type { ReactNode } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
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

/** A switch that belongs to the app rather than to the story (text-only mode, the quality of the 3D models). */
export interface SideNavSetting {
  id: string;
  label: string;
  /** What it does, in a sentence: the tooltip. */
  description: string;
  /** The current setting in a word ("On", "High"), shown beside the label. */
  value: string;
  pressed: boolean;
  icon: ReactNode;
  onToggle: () => void;
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
  /** App-level switches, at the bottom of the menu: labelled when it is open, icons with tooltips when it is collapsed. */
  settings?: SideNavSetting[];
  /** The project's name: written out when the menu is open, abbreviated when it is collapsed or a sheet. */
  projectName?: string;
  projectAbbreviation?: string;
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

function Settings({ settings, labelled }: { settings: SideNavSetting[]; labelled: boolean }) {
  if (settings.length === 0) return null;
  return (
    <Tooltip.Provider delayDuration={300}>
      <ul className={styles.settings} aria-label="Settings">
        {settings.map((setting) => (
          <li key={setting.id}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  className={[styles.setting, labelled ? '' : styles.settingIconOnly].join(' ')}
                  aria-pressed={setting.pressed}
                  aria-label={`${setting.label}: ${setting.value}`}
                  onClick={setting.onToggle}
                >
                  <span className={styles.settingIcon} aria-hidden="true">
                    {setting.icon}
                  </span>
                  {labelled && (
                    <>
                      <span className={styles.settingLabel}>{setting.label}</span>
                      <span className={styles.settingValue}>{setting.value}</span>
                    </>
                  )}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className={styles.tooltip} side="right" sideOffset={8}>
                  <strong>{setting.label}</strong>
                  <span>{setting.description}</span>
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </li>
        ))}
      </ul>
    </Tooltip.Provider>
  );
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
  settings = [],
  projectName = 'Tumor lysis syndrome',
  projectAbbreviation = 'TLS',
}: SideNavProps) {
  if (variant === 'sheet') {
    return (
      <Modal open={sheetOpen} onOpenChange={onSheetOpenChange ?? (() => {})} title={projectAbbreviation} variant="sheet">
        <SideNavContent
          scenes={scenes}
          currentSceneIndex={currentSceneIndex}
          currentStepIndex={currentStepIndex}
          onJumpToScene={onJumpToScene}
          onJumpToLanding={onJumpToLanding}
          onJumpToEnd={onJumpToEnd}
          onJumpToStep={onJumpToStep}
        />
        <Settings settings={settings} labelled />
      </Modal>
    );
  }

  return (
    <nav className={[styles.rail, expanded ? styles.expanded : styles.collapsed].join(' ')} aria-label="Scene navigation">
      <div className={styles.projectLabel} title={projectName}>
        {expanded ? projectName : projectAbbreviation}
      </div>
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
      <Settings settings={settings} labelled={expanded} />
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
