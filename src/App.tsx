import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { useReducedMotion, useRouteSync, useWebGLSupport } from './hooks';
import { ScrollCanvas } from './engine/ScrollCanvas';
import { tlsContent } from './content/tls';

/**
 * Minimal Epic 0 shell: theme/routing/reduced-motion wiring plus a
 * placeholder 3D canvas. Landing screen, persistent chrome (lab strip, side
 * nav, theme toggle), and real scene content are separate epics — see
 * tls_user_stories_and_tasks.md.
 */
export function App() {
  const reducedMotion = useReducedMotion();
  const setReducedMotion = useAppStore((s) => s.setReducedMotion);
  const setLabValues = useAppStore((s) => s.setLabValues);
  const webglSupported = useWebGLSupport();

  useRouteSync();

  useEffect(() => {
    setReducedMotion(reducedMotion);
  }, [reducedMotion, setReducedMotion]);

  useEffect(() => {
    const firstStepLabs = tlsContent.scenes[0]?.steps[0]?.labValues;
    if (!firstStepLabs) return;
    const values = Object.fromEntries(firstStepLabs.map((v) => [v.metricId, v.value]));
    setLabValues(values);
  }, [setLabValues]);

  if (!webglSupported) {
    return (
      <main data-testid="webgl-unsupported" style={{ padding: 'var(--space-8)' }}>
        <h1 style={{ font: '600 19px/28px var(--font-sans)' }}>This experience requires WebGL</h1>
        <p>Your browser does not support 3D graphics rendering. Try Chrome, Firefox, or Safari on a desktop computer or modern phone.</p>
      </main>
    );
  }

  return (
    <div data-testid="app-shell" style={{ position: 'fixed', inset: 0 }}>
      <ScrollCanvas />
    </div>
  );
}

export default App;
