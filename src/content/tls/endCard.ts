import type { EndCardContent } from '../schema';

// Copy from tls_design_specification.md §5.8. The spec's "Last clinical review: June 2026" line is left out until a
// clinician has actually reviewed the content (see tls_clinical_review_questions.md); set `lastReview` then.
export const tlsEndCard: EndCardContent = {
  label: 'End of experience · 6 scenes complete',
  title: 'Tumor lysis syndrome',
  subtitle: 'One trigger, three branches, two convergences, four intervention points.',
  body: 'You can replay any scene, review the underlying sources, or restart from the beginning.',
  replayLabel: 'Replay any scene',
  sourcesLabel: 'View sources',
  restartLabel: 'Restart →',
  replayTitle: 'Replay a scene',
  sourcesTitle: 'Sources',
  credits:
    'Built for clinical education. Checked against: Cairo & Bishop 2004 · Coiffier et al. JCO 2008 · Howard et al. NEJM 2011 · Jones et al. BJH 2015 · Chan et al. BJH 2025 · Arnaud et al. JASN 2022.',
  footer:
    'This visualization is intended for educational use by medical professionals. It is not a substitute for clinical judgment in patient care.',
};
