import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { useMediaQuery, useBreakpoint, useFirstRunHint, useReducedMotion, useRouteSync, useWebGLSupport } from './hooks';
import { Menu } from 'lucide-react';
import { ScrollCanvas } from './engine/ScrollCanvas';
import { tlsContent } from './content/tls';
import { LandingScreen } from './components/LandingScreen/LandingScreen';
import { ThemeToggle } from './components/ThemeToggle/ThemeToggle';
import { QualityToggle } from './components/QualityToggle/QualityToggle';
import { AssetLoadingBar } from './components/AssetLoadingBar/AssetLoadingBar';
import { useProgress } from '@react-three/drei';
import { preloadScene } from './assets/useModel';
import { LabStrip } from './components/LabStrip/LabStrip';
import { SideNav } from './components/SideNav/SideNav';
import { ColorLegend } from './components/ColorLegend/ColorLegend';
import { CascadeMinimap } from './components/CascadeMinimap/CascadeMinimap';
import { CaptionBlock } from './components/CaptionBlock/CaptionBlock';
import { ChipCluster, type ChipClusterPhase } from './components/ChipCluster/ChipCluster';
import { ModeToggle } from './components/ModeToggle/ModeToggle';
import { HighRiskBadge } from './components/HighRiskBadge/HighRiskBadge';
import { forwardedWheelDelta } from './lib/wheelForward';
import { Scene5Controls } from './scenes/Scene5/Scene5Controls';
import { useScene5Labs } from './scenes/Scene5/useScene5Labs';
import { SCENE5_INDEX } from './lib/scene5';
import { SYSTEMIC_START } from './lib/timeline';
import { labValuesAt, stepIndexFromProgress, timestampAt } from './lib/steps';
import { FirstRunScrollHint } from './components/FirstRunScrollHint/FirstRunScrollHint';
import styles from './App.module.css';

const STAGE_LABELS = tlsContent.scenes.map((s) => s.title);

const SIDE_NAV_SCENES = tlsContent.scenes.map((scene) => ({
  index: scene.index,
  title: scene.title,
  subSteps: scene.steps.map((step) => ({ label: `${scene.index}.${step.order}`, title: step.title ?? step.caption, caption: step.caption })),
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
function minimapHighlightFor(sceneIndex: number): string | string[] | 'full' | null {
  if (sceneIndex < 3) return null;
  // Scene 3 happens inside the kidney, where the streams converge.
  if (sceneIndex === 3) return 'kidney';
  // Scene 4 shows the two consequences that matter most acutely: potassium (cardiac) and calcium (via phosphate).
  if (sceneIndex === 4) return ['K', 'PO4'];
  // Scene 5 shows the whole cascade itself, so a map of it would only repeat (and cover) the picture.
  if (sceneIndex === 5) return null;
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
  const modelQuality = useAppStore((s) => s.modelQuality);
  const toggleModelQuality = useAppStore((s) => s.toggleModelQuality);
  // Once the camera leaves the tubule for the next scene's panels, the mechanism toggle goes with it.
  const leavingScene = useAppStore((s) => s.globalProgress > SYSTEMIC_START + 0.02 && s.globalProgress < 4);
  const modeSelection = useAppStore((s) => s.modeSelection);
  const setMode = useAppStore((s) => s.setMode);
  const { active: assetsLoading, progress: assetProgress } = useProgress();
  const sideNavExpanded = useAppStore((s) => s.sideNavExpanded);
  const toggleSideNav = useAppStore((s) => s.toggleSideNav);
  const labValues = useAppStore((s) => s.labValues);
  const jumpToScene = useAppStore((s) => s.jumpToScene);
  const jumpToStep = useAppStore((s) => s.jumpToStep);
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

  // Warm the cache for the scene on screen and the next one, so a scroll into it never waits on the network. The
  // landing screen preloads Scene 0 while the visitor reads it. Changing the quality tier fetches the other files.
  const preloadFrom = route.kind === 'scene' ? route.index : route.kind === 'landing' ? 0 : null;
  useEffect(() => {
    if (preloadFrom === null || !webglSupported) return;
    preloadScene(tlsContent.models, preloadFrom, modelQuality);
    preloadScene(tlsContent.models, preloadFrom + 1, modelQuality);
  }, [preloadFrom, modelQuality, webglSupported]);

  // Rail defaults: expanded on desktop, icon rail on tablet (design spec §4.3). The user can still toggle it.
  useEffect(() => {
    if (breakpoint === 'desktop') setSideNavExpanded(true);
    else if (breakpoint === 'tablet') setSideNavExpanded(false);
  }, [breakpoint, setSideNavExpanded]);

  useEffect(() => {
    setReducedMotion(reducedMotion);
  }, [reducedMotion, setReducedMotion]);

  const activeScene = route.kind === 'scene' ? tlsContent.scenes[route.index] : undefined;
  // Subscribe to the step, not the raw progress: progress changes every frame while scrolling and would re-render the
  // whole shell 60×/s. The 3D scenes read progress straight from the store inside useFrame.
  const stepIndex = useAppStore((s) => (activeScene ? stepIndexFromProgress(s.sceneProgress, activeScene.steps.length) : 0));
  const activeStep = activeScene?.steps[stepIndex];

  // Lab values follow the story position: all targets up to the active step, so deep links and skipped steps stay correct.
  const activeSceneIndex = activeScene?.index;
  const inScene5 = activeSceneIndex === SCENE5_INDEX;
  useEffect(() => {
    // Scene 5's labs are computed from the interventions that are on (see useScene5Labs).
    if (activeSceneIndex === undefined || inScene5) return;
    setLabValues(labValuesAt(tlsContent.scenes, activeSceneIndex, stepIndex));
  }, [activeSceneIndex, inScene5, stepIndex, setLabValues]);
  const scene5Timestamp = useScene5Labs(inScene5, stepIndex);

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
            <QualityToggle quality={modelQuality} onToggle={toggleModelQuality} />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
          <div className={styles.endPlaceholder}>End card — Epic 9</div>
        </div>
      </div>
    );
  }

  const sceneIndex = route.index;
  const scene = tlsContent.scenes[sceneIndex];
  const timestamp = sceneIndex === SCENE5_INDEX ? scene5Timestamp : scene ? timestampAt(tlsContent.scenes, sceneIndex, stepIndex) : undefined;
  const stepOrder = activeStep?.order ?? 0;
  const chipPhase: ChipClusterPhase =
    scene?.summaryStep !== undefined && stepOrder >= scene.summaryStep
      ? 'merged'
      : scene?.chipsStep !== undefined && stepOrder >= scene.chipsStep
        ? 'shown'
        : 'hidden';
  const toggle = scene?.toggle;
  const toggleShown = !!toggle && !!activeStep && activeStep.order >= toggle.fromStep && !leavingScene;
  const badgeVisible = scene?.summaryStep !== undefined && stepOrder >= scene.summaryStep;
  const minimapHighlight = minimapHighlightFor(sceneIndex);

  return (
    <div className={styles.sceneLayout} data-testid="app-shell">
      <AssetLoadingBar active={assetsLoading} progress={assetProgress} />
      <SideNav
        scenes={SIDE_NAV_SCENES}
        currentSceneIndex={sceneIndex}
        currentStepIndex={stepIndex}
        onJumpToStep={(sceneI, stepI) => {
          setNavSheetOpen(false);
          jumpToStep(sceneI, stepI, tlsContent.scenes[sceneI]?.steps.length ?? 1);
        }}
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
      <div
        className={styles.mainArea}
        onWheel={(e) => {
          // A wheel turn over the interface should still scroll the story (see lib/wheelForward).
          const delta = forwardedWheelDelta(e);
          if (delta !== null) useAppStore.getState().scrollApi?.scrollBy(delta);
        }}
      >
        {isMobile && (
          <button type="button" className={styles.menuButton} aria-label="Open navigation" onClick={() => setNavSheetOpen(true)}>
            <Menu size={20} aria-hidden="true" />
          </button>
        )}
        <div className={styles.themeToggleFloating}>
          <QualityToggle quality={modelQuality} onToggle={toggleModelQuality} />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
        {minimapHighlight && (
          <div className={styles.minimapFloating}>
            <CascadeMinimap
              branches={tlsContent.cascade.branches}
              highlightedId={minimapHighlight}
              title="The cascade"
            />
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
          {toggleShown && toggle && scene && (
            <div className={styles.modeToggleFloating}>
              <ModeToggle toggle={toggle} value={modeSelection[scene.id] ?? toggle.defaultId} onChange={(id) => setMode(scene.id, id)} />
            </div>
          )}
          {sceneIndex === SCENE5_INDEX && <Scene5Controls stepIndex={stepIndex} isMobile={isMobile} />}
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
