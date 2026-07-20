import type { LandingContent } from '../schema';

// Transcribed verbatim from tls_design_specification.md §5.1.
export const tlsLanding: LandingContent = {
  label: 'Clinical visualization · 6 scenes · ~8 minutes',
  title: 'Tumor Lysis Syndrome',
  subtitle: 'A scroll-driven cascade — from cell lysis to renal failure to intervention.',
  body: 'Six scenes walk through the pathophysiology, systemic consequences, and management of TLS. Sources at every step.',
  ctaLabel: 'Begin →',
  meta: 'For medical specialists and senior trainees. Last updated June 2026 · Reviewed against BSH 2025 guidelines',
  slowLoadMessage: 'Preparing the 3D scene. This may take a moment on slower connections.',
  webglUnsupportedMessage:
    'This experience requires WebGL, which your browser does not support. Try Chrome, Firefox, or Safari on a desktop or modern phone.',
};
