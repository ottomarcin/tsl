import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { useMediaQuery, useBreakpoint, useFirstRunHint, useReducedMotion, useRouteSync, useWebGLSupport } from './hooks';
import { Menu } from 'lucide-react';
import { ScrollCanvas } from './engine/ScrollCanvas';
import { tlsContent } from './content/tls';
import { LandingScreen } from './components/LandingScreen/LandingScreen';
import { ThemeToggle } from './components/ThemeToggle/ThemeToggle';
import { LabStrip } from './components/LabStrip/LabStrip';
import { SideNav } from './components/SideNav/SideNav';
import { ColorLegend } from './components/ColorLegend/ColorLegend';
import { CascadeMinimap } from './components/CascadeMinimap/CascadeMinimap';
import { CaptionBlock } from './components/CaptionBlock/CaptionBlock';
import { ChipCluster, type ChipClusterPhase } from './components/ChipCluster/ChipCluster';
import { HighRiskBadge } from './components/HighRiskBadge/HighRiskBadge';
import { labValuesAt, latestTimestamp, stepIndexFromProgress } from './lib/steps';
import { FirstRunScrollHint } from './components/FirstRunScrollHint/FirstRunScrollHint';
import styles from './App.module.css';

const STAGE_LABELS = tlsContent.scenes.map((s) => s.title);

const SIDE_NAV_SCENES = tlsContent.scenes.map((scene) => ({
  index: scene.index,
  title: scene.title,
  // Short nav labels ("0.1", "0.2", …) — full step captions belong to each scene epic's caption block, not the nav.
  subSteps: scene.steps.map((step) => `${scene.index}.${step.order}`),
}));

const LEGEND_ITEMS = [
  ...tlsContent.cascade.branches.map((b) => ({ colorToken: b.colorToken, label: b.label })),
  { colorToken: '--crystal', label: 'Crystals' },
  { colorToken: '--monitor-trace', label: 'Monitor', indicator: 'line' as const },
  { colorToken: '--flag-red', label: 'Flagged', indicator: 'line' as const },
];

/**
 * Coarse placeholder mapping from scene index to minimap highlight — the
 * design spec ties this to which specific cascade section is in view, which
 * requires per-step granularity that belongs to each scene epic (Epic 3+),
 * not this infrastructure chunk. Refined once those scenes exist.
 */
function minimapHighlightFor(sceneIndex: number): string | 'full' | null {
  if (sceneIndex < 3) return null;
  if (sceneIndex === 3) return 'purines';
  return 'full';
}

export function App() {
  const reducedMotion = useReducedMotion();
  const setReducedMotion = useAppStore((s) => s.setReducedMotion);
  const setLabValues = useAppStore((s) => s.setLabValues);
  const webglSupported = useWebGLSupport();

  const route = useAppStore((s) => s.route);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const sideNavExpanded = useAppStore((s) => s.sideNavExpanded);
  const toggleSideNav = useAppStore((s) => s.toggleSideNav);
  const labValues = useAppStore((s) => s.labValues);
  const jumpToScene = useAppStore((s) => s.jumpToScene);
  const goToLanding = useAppStore((s) => s.goToLanding);
  const goToEnd = useAppStore((s) => s.goToEnd);

  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';
  // Landscape phones: too short for the caption below the mass, so the caption moves to a left column.
  const shortViewport = useMediaQuery('(max-height: 560px)');
  const [navSheetOpen, setNavSheetOpen] = useState(false);
  const setSideNavExpanded = useAppStore((s) => s.setSideNavExpanded);
  const { visible: hintVisible, dismiss: dismissHint } = useFirstRunHint();
  const [legendExpanded, setLegendExpanded] = useState(false);

  useRouteSync();

  // Rail defaults: expanded on desktop, icon rail on tablet (design spec §4.3). The user can still toggle it.
  useEffect(() => {
    if (breakpoint === 'desktop') setSideNavExpanded(true);
    else if (breakpoint === 'tablet') setSideNavExpanded(false);
  }, [breakpoint, setSideNavExpanded]);

  useEffect(() => {
    setReducedMotion(reducedMotion);
  }, [reducedMotion, setReducedMotion]);

  const sceneProgress = useAppStore((s) => s.sceneProgress);
  const activeScene = route.kind === 'scene' ? tlsContent.scenes[route.index] : undefined;
  const stepIndex = activeScene ? stepIndexFromProgress(sceneProgress, activeScene.steps.length) : 0;
  const activeStep = activeScene?.steps[stepIndex];

  // Lab values follow the story position: all targets up to the active step, so deep links and skipped steps stay correct.
  const activeSceneIndex = activeScene?.index;
  useEffect(() => {
    if (activeSceneIndex === undefined) return;
    setLabValues(labValuesAt(tlsContent.scenes, activeSceneIndex, stepIndex));
  }, [activeSceneIndex, stepIndex, setLabValues]);

  if (!webglSupported) {
    return (
      <LandingScreen
        content={tlsContent.landing}
        theme={theme}
        onToggleTheme={toggleTheme}
        webglSupported={false}
        onBegin={() => {}}
      />
    );
  }

  if (route.kind === 'landing') {
    return (
      <LandingScreen
        content={tlsContent.landing}
        theme={theme}
        onToggleTheme={toggleTheme}
        webglSupported
        onBegin={() => jumpToScene(0)}
      />
    );
  }

  if (route.kind === 'end') {
    return (
      <div className={styles.sceneLayout}>
        <SideNav
          scenes={SIDE_NAV_SCENES}
          currentSceneIndex={tlsContent.scenes.length}
          expanded={sideNavExpanded}
          onToggleExpanded={toggleSideNav}
          onJumpToScene={jumpToScene}
          onJumpToLanding={goToLanding}
          onJumpToEnd={goToEnd}
        />
        <div className={styles.mainArea}>
          <div className={styles.themeToggleFloating}>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
          <div className={styles.endPlaceholder}>End card — Epic 9</div>
        </div>
      </div>
    );
  }

  const sceneIndex = route.index;
  const scene = tlsContent.scenes[sceneIndex];
  const timestamp = scene ? latestTimestamp(scene.steps, stepIndex) : undefined;
  const stepOrder = activeStep?.order ?? 0;
  const chipPhase: ChipClusterPhase =
    scene?.summaryStep !== undefined && stepOrder >= scene.summaryStep
      ? 'merged'
      : scene?.chipsStep !== undefined && stepOrder >= scene.chipsStep
        ? 'shown'
        : 'hidden';
  const badgeVisible = scene?.summaryStep !== undefined && stepOrder >= scene.summaryStep;
  const minimapHighlight = minimapHighlightFor(sceneIndex);

  return (
    <div className={styles.sceneLayout} data-testid="app-shell">
      <SideNav
        scenes={SIDE_NAV_SCENES}
        currentSceneIndex={sceneIndex}
        expanded={sideNavExpanded}
        onToggleExpanded={toggleSideNav}
        onJumpToScene={(i) => {
          setNavSheetOpen(false);
          jumpToScene(i);
        }}
        onJumpToLanding={() => {
          setNavSheetOpen(false);
          goToLanding();
        }}
        onJumpToEnd={() => {
          setNavSheetOpen(false);
          goToEnd();
        }}
        variant={isMobile ? 'sheet' : 'rail'}
        sheetOpen={navSheetOpen}
        onSheetOpenChange={setNavSheetOpen}
      />
      <div className={styles.mainArea}>
        {isMobile && (
          <button type="button" className={styles.menuButton} aria-label="Open navigation" onClick={() => setNavSheetOpen(true)}>
            <Menu size={20} aria-hidden="true" />
          </button>
        )}
        <div className={styles.themeToggleFloating}>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
        {minimapHighlight && (
          <div className={styles.minimapFloating}>
            <CascadeMinimap branches={tlsContent.cascade.branches} highlightedId={minimapHighlight} />
          </div>
        )}
        {sceneIndex === 0 && (
          <div className={styles.firstRunHintFloating}>
            <FirstRunScrollHint visible={hintVisible} onDismiss={dismissHint} />
          </div>
        )}
        <div className={styles.canvasArea}>
          <ScrollCanvas viewShift={shortViewport && !isMobile ? 0.22 : 0} />
          {scene?.chips && <ChipCluster chips={scene.chips} phase={chipPhase} reducedMotion={reducedMotion} layout={isMobile ? 'column' : 'ring'} shifted={shortViewport && !isMobile} />}
          {scene?.summaryBadge && (
            <div className={styles.badgeSlot}>
              <HighRiskBadge
                label={scene.summaryBadge.label}
                state={scene.summaryBadge.state}
                visible={badgeVisible}
                reducedMotion={reducedMotion}
              />
            </div>
          )}
          <div className={styles.bottomStack}>
            {scene && activeStep && (
              <CaptionBlock key={activeStep.id} sceneTitle={scene.title} caption={activeStep.caption} learnMore={activeStep.learnMore} />
            )}
            <ColorLegend items={LEGEND_ITEMS} expanded={legendExpanded} onToggleExpanded={() => setLegendExpanded((e) => !e)} />
          </div>
        </div>
        <LabStrip
          metrics={tlsContent.metrics}
          values={labValues}
          timestamp={timestamp}
          currentStage={sceneIndex}
          totalStages={tlsContent.scenes.length}
          stageLabels={STAGE_LABELS}
          onJumpToStage={jumpToScene}
          reducedMotion={reducedMotion}
        />
      </div>
    </div>
  );
}

export default App;
