export interface EndCardContent {
  label: string;
  title: string;
  subtitle: string;
  body: string;
  replayLabel: string;
  sourcesLabel: string;
  restartLabel: string;
  replayTitle: string;
  sourcesTitle: string;
  /** What the content was checked against (names, not a claim of review by anyone). */
  credits: string;
  /** Set only once a clinician has reviewed the content; the line is left out until then. */
  lastReview?: string;
  footer: string;
}
