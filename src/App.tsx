import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { useMediaQuery, useBreakpoint, useFirstRunHint, useReducedMotion, useRouteSync, useWebGLSupport, useAnnouncements } from './hooks';
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
import { EndCard } from './components/EndCard/EndCard';
import { LiveAnnouncer } from './components/LiveAnnouncer/LiveAnnouncer';
import { SkipLink } from './components/SkipLink/SkipLink';
import { AccessibilityToggle } from './components/AccessibilityToggle/AccessibilityToggle';
import { TextOnlyScene } from './scenes/TextOnly/TextOnlyScene';
import { textStepId } from './components/TextOnlyView/TextOnlyView';
import { pageTitle } from './lib/announce';
import { ReplaySceneModal } from './components/ReplaySceneModal/ReplaySceneModal';
import { SourcesModal } from './components/SourcesModal/SourcesModal';
import { allTlsCitations, sourceLink } from './content/tls/citations';
import { SYSTEMIC_START } from './lib/timeline';
import { adjacentStep, labValuesAt, stepIndexFromProgress, timestampAt } from './lib/steps';
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
  const [replayOpen, setReplayOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const restart = useAppStore((s) => s.restart);
  const textOnly = useAppStore((s) => s.accessibilityMode);
  const toggleTextOnly = useAppStore((s) => s.toggleAccessibilityMode);

  useRouteSync();

  // Warm the cache for the scene on screen and the next one, so a scroll into it never waits on the network. The
  // landing screen preloads Scene 0 while the visitor reads it. Changing the quality tier fetches the other files.
  const preloadFrom = route.kind === 'scene' ? route.index : route.kind === 'landing' ? 0 : tlsContent.scenes.length - 1;
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
  const announcement = useAnnouncements(activeScene, tlsContent.metrics, labValues);

  // The document title follows the scene (design spec §9).
  useEffect(() => {
    document.title = pageTitle(
      'Tumor Lysis Syndrome',
      route.kind === 'scene' ? { kind: 'scene', index: route.index, title: tlsContent.scenes[route.index].title } : { kind: route.kind },
    );
  }, [route]);

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

  // The end card sits over the last scene, which stays mounted behind it (so the canvas is never torn down on the way).
  const isEnd = route.kind === 'end';
  const sceneIndex = route.kind === 'scene' ? route.index : tlsContent.scenes.length - 1;
  const scene = isEnd ? undefined : tlsContent.scenes[sceneIndex];
  const timestamp = isEnd ? undefined : sceneIndex === SCENE5_INDEX ? scene5Timestamp : scene ? timestampAt(tlsContent.scenes, sceneIndex, stepIndex) : undefined;
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
      <SkipLink targetId="main-content">Skip to content</SkipLink>
      <LiveAnnouncer message={announcement} />
      <AssetLoadingBar active={assetsLoading} progress={assetProgress} />
      <SideNav
        scenes={SIDE_NAV_SCENES}
        currentSceneIndex={isEnd ? tlsContent.scenes.length : sceneIndex}
        currentStepIndex={stepIndex}
        onJumpToStep={(sceneI, stepI) => {
          setNavSheetOpen(false);
          if (textOnly) document.getElementById(textStepId(sceneI, stepI))?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
          else jumpToStep(sceneI, stepI, tlsContent.scenes[sceneI]?.steps.length ?? 1);
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
      <main
        id="main-content"
        tabIndex={-1}
        className={styles.mainArea}
        onWheel={(e) => {
          // A wheel turn over the interface should still scroll the story (see lib/wheelForward).
          const delta = forwardedWheelDelta(e);
          if (delta !== null && !isEnd) useAppStore.getState().scrollApi?.scrollBy(delta);
        }}
      >
        {isMobile && (
          <button type="button" className={styles.menuButton} aria-label="Open navigation" onClick={() => setNavSheetOpen(true)}>
            <Menu size={20} aria-hidden="true" />
          </button>
        )}
        <div className={styles.themeToggleFloating}>
          <AccessibilityToggle textOnly={textOnly} onToggle={toggleTextOnly} />
          {!textOnly && <QualityToggle quality={modelQuality} onToggle={toggleModelQuality} />}
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
        {minimapHighlight && !textOnly && (
          <div className={styles.minimapFloating}>
            <CascadeMinimap
              branches={tlsContent.cascade.branches}
              highlightedId={minimapHighlight}
              title="The cascade"
            />
          </div>
        )}
        {sceneIndex === 0 && !textOnly && (
          <div className={styles.firstRunHintFloating}>
            <FirstRunScrollHint visible={hintVisible} onDismiss={dismissHint} />
          </div>
        )}
        {textOnly && scene && (
          <div className={styles.textArea}>
            <TextOnlyScene sceneIndex={sceneIndex} />
          </div>
        )}
        {!textOnly && (
          <div
            className={styles.canvasArea}
            // With the keyboard on the 3D scene itself, the arrow keys step through the story (design spec §9).
            tabIndex={isEnd ? undefined : 0}
            role={isEnd ? undefined : 'group'}
            aria-label={isEnd ? undefined : '3D scene. Use the arrow keys to move between steps.'}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget || isEnd) return;
              const direction = e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp' ? -1 : 0;
              if (!direction) return;
              e.preventDefault();
              const to = adjacentStep(tlsContent.scenes, sceneIndex, stepIndex, direction);
              if (to) jumpToStep(to.scene, to.step, tlsContent.scenes[to.scene].steps.length);
            }}
          >
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
            {sceneIndex === SCENE5_INDEX && !isEnd && <Scene5Controls stepIndex={stepIndex} isMobile={isMobile} />}
            <div className={styles.bottomStack}>
              {scene && activeStep && (
                <CaptionBlock key={activeStep.id} sceneTitle={scene.title} caption={activeStep.caption} learnMore={activeStep.learnMore} />
              )}
              {!isEnd && <ColorLegend items={LEGEND_ITEMS} expanded={legendExpanded} onToggleExpanded={() => setLegendExpanded((e) => !e)} />}
            </div>
          </div>
        )}
        {!isEnd && !textOnly && (
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
        )}
        {isEnd && (
          <EndCard
            content={tlsContent.endCard}
            onReplay={() => setReplayOpen(true)}
            onSources={() => setSourcesOpen(true)}
            onRestart={restart}
          />
        )}
      </main>
      <ReplaySceneModal
        open={replayOpen}
        onOpenChange={setReplayOpen}
        title={tlsContent.endCard.replayTitle}
        variant={isMobile ? 'sheet' : 'modal'}
        scenes={tlsContent.scenes.map((sc) => ({ index: sc.index, title: sc.title, summary: sc.steps[0].caption }))}
        // A cut, not a flight back through every scene in between.
        onPick={(i) => jumpToScene(i, { source: 'url' })}
      />
      <SourcesModal
        open={sourcesOpen}
        onOpenChange={setSourcesOpen}
        title={tlsContent.endCard.sourcesTitle}
        variant={isMobile ? 'sheet' : 'modal'}
        sources={allTlsCitations.map((c) => ({ id: c.id, text: c.text, href: sourceLink(c) }))}
      />
    </div>
  );
}

export default App;
