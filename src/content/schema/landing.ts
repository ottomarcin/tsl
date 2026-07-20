export interface LandingContent {
  label: string;
  title: string;
  subtitle: string;
  body: string;
  ctaLabel: string;
  meta: string;
  /** Shown below the CTA if loading exceeds ~2s. */
  slowLoadMessage: string;
  /** Replaces the CTA entirely when WebGL isn't supported. */
  webglUnsupportedMessage: string;
}
