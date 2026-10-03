import type { FlagLevel } from './metric';

export interface Citation {
  id: string;
  text: string;
  url?: string;
}

/** A target value a metric tweens to at this step. Metrics not listed hold their prior value. */
export interface MetricTarget {
  metricId: string;
  value: number;
}

export interface LearnMore {
  heading: string;
  body: string;
  citations: Citation[];
}

export interface ScrollStep {
  id: string;
  order: number;
  /** 1–2 sentences, per the design spec's copy rule. */
  caption: string;
  labValues?: MetricTarget[];
  /** Timestamp label shown in the lab strip for this step, e.g. "T+12h". */
  timestamp?: string;
  learnMore?: LearnMore;
}

export interface SceneDefinition {
  /** e.g. 'scene-0' … 'scene-5'. */
  id: string;
  /** Matches the route /scene/:index. */
  index: number;
  title: string;
  steps: ScrollStep[];
  /** Chips that stagger in at `chipsStep` and merge into `summaryBadge` at `summaryStep` (step `order` values). */
  chips?: ChipDefinition[];
  chipsStep?: number;
  summaryBadge?: SummaryBadge;
  summaryStep?: number;
  toggle?: ModeToggle;
}

/** A labelled factor shown as a chip around a scene's 3D subject (design spec §6.7). */
export interface ChipDefinition {
  id: string;
  label: string;
  /** Display string, e.g. "2.3× ULN". */
  valueText: string;
  state: FlagLevel;
  /** False renders the chip dimmed (factor not present for this case). */
  active: boolean;
  /** 0–1; present only for quantitative chips. */
  fill?: number;
  /** Shown in the chip's tooltip. */
  reference: string;
}

/** The single badge a scene's chips consolidate into. */
export interface SummaryBadge {
  label: string;
  state: FlagLevel;
}

/** One choice in a scene's mode toggle (e.g. a mechanism overlay). */
export interface ModeOption {
  id: string;
  label: string;
  /** Short qualifier shown beside the label, e.g. "emerging". */
  badge?: string;
  /** One line shown under the toggle while this option is active. */
  hint?: string;
}

/** A segmented control that switches what a scene highlights, available from `fromStep` on. */
export interface ModeToggle {
  label: string;
  /** Step `order` from which the control is shown. */
  fromStep: number;
  defaultId: string;
  options: ModeOption[];
}
