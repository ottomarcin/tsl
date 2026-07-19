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
}
