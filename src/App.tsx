import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { useMediaQuery, useBreakpoint, useFirstRunHint, useReducedMotion, useRouteSync, useWebGLSupport, useAnnouncements, useDocumentVisible, useGlobalErrors, useLoadTimeout, usePrinting } from './hooks';
import { Accessibility, Menu, Moon, Sparkles, Sun, Zap } from 'lucide-react';

import { tlsContent } from './content/tls';
import { LandingScreen } from './components/LandingScreen/LandingScreen';
import { AssetLoadingBar } from './components/AssetLoadingBar/AssetLoadingBar';
import { preloadScene } from './assets/preload';
import { LabStrip } from './components/LabStrip/LabStrip';
import { SideNav, type SideNavSetting } from './components/SideNav/SideNav';
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
import { loadScrollCanvas } from './engine/loadScrollCanvas';
import { Toast } from './components/Toast/Toast';
import { PrintDocument } from './scenes/TextOnly/PrintDocument';
import { CanvasBoundary } from './engine/CanvasBoundary';
import { onModelError, retryModelErrors } from './assets/loadErrors';
import { MinimapToggle } from './components/MinimapToggle/MinimapToggle';
import { LegendRows } from './components/ColorLegend/LegendRows';
import { Modal } from './components/Modal/Modal';
import { SkipLink } from './components/SkipLink/SkipLink';
import { Breadcrumb, type BreadcrumbItem } from './components/Breadcrumb/Breadcrumb';
import { StepNav } from './components/StepNav/StepNav';
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

const ScrollCanvas = lazy(loadScrollCanvas);

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
  const { active: assetsLoading, progress: assetProgress } = useAppStore((s) => s.assets);
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
  const [minimapOpen, setMinimapOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const restart = useAppStore((s) => s.restart);
  const textOnly = useAppStore((s) => s.accessibilityMode);
  const toggleTextOnly = useAppStore((s) => s.toggleAccessibilityMode);
  const toast = useAppStore((s) => s.toast);
  const showToast = useAppStore((s) => s.showToast);
  const dismissToast = useAppStore((s) => s.dismissToast);
  const printing = usePrinting();
  const pageVisible = useDocumentVisible();

  useRouteSync();

  // Warm the cache for the scene on screen and the next one, so a scroll into it never waits on the network. The
  // landing screen preloads Scene 0 while the visitor reads it. Changing the quality tier fetches the other files.
  const preloadFrom = route.kind === 'scene' ? route.index : route.kind === 'landing' ? 0 : tlsContent.scenes.length - 1;
  useEffect(() => {
    if (preloadFrom === null || !webglSupported) return;
    preloadScene(tlsContent.models, preloadFrom, modelQuality);
    preloadScene(tlsContent.models, preloadFrom + 1, modelQuality);
  }, [preloadFrom, modelQuality, webglSupported]);

  // The landing screen is read for a few seconds: use them to fetch the 3D engine, so Begin does not wait for it.
  useEffect(() => {
    if (route.kind === 'landing' && webglSupported) void loadScrollCanvas();
  }, [route.kind, webglSupported]);

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

  // Resilience (design spec §10). A download that stalls for 30 s, a model that fails to load and an unexpected error each
  // get one toast with a way forward; only one toast is up at a time.
  useLoadTimeout(assetsLoading, () => showToast({ message: 'Loading is taking longer than expected.', action: { label: 'Retry', onClick: () => window.location.reload() } }));
  useEffect(
    () =>
      onModelError(() =>
        showToast({
          message: 'Part of the 3D scene could not be loaded.',
          action: {
            label: 'Retry',
            onClick: () => {
              // The loader (three.js) is only fetched now, if it is not there already.
              void import('./assets/useModel').then((m) => m.clearFailedModels()).then(retryModelErrors);
              dismissToast();
            },
          },
        }),
      ),
    [showToast, dismissToast],
  );
  const onUnexpectedError = useCallback(
    () => showToast({ message: 'Something went wrong. Refresh the page if it stops responding.', action: { label: 'Refresh', onClick: () => window.location.reload() }, autoDismissMs: 8000 }),
    [showToast],
  );
  useGlobalErrors(onUnexpectedError);

  // The document title follows the scene (design spec §9).
  useEffect(() => {
    document.title = pageTitle(
      'Tumor Lysis Syndrome',
      route.kind === 'scene' ? { kind: 'scene', index: route.index, title: tlsContent.scenes[route.index].title } : { kind: route.kind },
    );
  }, [route]);

  // On paper: all six scenes as text, nothing else.
  if (printing) return <PrintDocument />;

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

  const toastElement = toast && (
    <Toast key={toast.id} message={toast.message} action={toast.action} autoDismissMs={toast.autoDismissMs} onDismiss={() => dismissToast(toast.id)} />
  );

  if (route.kind === 'landing') {
    return (
      <>
        <LandingScreen
        content={tlsContent.landing}
        theme={theme}
        onToggleTheme={toggleTheme}
        webglSupported
        onBegin={() => jumpToScene(0)}
      />
        {toastElement}
      </>
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

  // App-level switches, in the menu (design: out of the top-right corner, where nothing said what they were).
  const settings: SideNavSetting[] = [
    {
      id: 'text-only',
      label: 'Text-only mode',
      description: 'All the content as text, without the 3D scene.',
      value: textOnly ? 'On' : 'Off',
      pressed: textOnly,
      icon: <Accessibility size={18} />,
      onToggle: toggleTextOnly,
    },
    {
      id: 'theme',
      label: 'Colour theme',
      description: 'Switch between the dark and the light look.',
      value: theme === 'dark' ? 'Dark' : 'Light',
      pressed: theme === 'dark',
      icon: theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />,
      onToggle: toggleTheme,
    },
    ...(textOnly
      ? []
      : [
          {
            id: 'quality',
            label: '3D model quality',
            description: 'High uses the detailed models; standard is lighter and runs better on a slower machine.',
            value: modelQuality === 'high' ? 'High' : 'Standard',
            pressed: modelQuality === 'high',
            icon: modelQuality === 'high' ? <Sparkles size={18} /> : <Zap size={18} />,
            onToggle: toggleModelQuality,
          },
        ]),
  ];

  // Where the viewer is, and where the buttons at the bottom right go.
  const breadcrumb: BreadcrumbItem[] =
    scene && activeStep && !isEnd
      ? [
          { marker: String(scene.index), label: scene.title, onSelect: () => jumpToStep(scene.index, 0, scene.steps.length) },
          { marker: `${scene.index}.${activeStep.order}`, label: activeStep.title ?? activeStep.caption },
        ]
      : [];
  const stepTarget = (direction: -1 | 1) => {
    if (!scene) return null;
    const to = adjacentStep(tlsContent.scenes, sceneIndex, stepIndex, direction);
    if (to) {
      const step = tlsContent.scenes[to.scene].steps[to.step];
      return { to, label: step.title ?? step.caption, marker: `${to.scene}.${step.order}` };
    }
    // After the last step comes the end card.
    return direction === 1 ? { to: null, label: 'End card', marker: undefined } : null;
  };
  const previousStep = stepTarget(-1);
  const nextStep = stepTarget(1);
  const goTo = (target: ReturnType<typeof stepTarget>) => {
    if (!target) return;
    if (target.to) jumpToStep(target.to.scene, target.to.step, tlsContent.scenes[target.to.scene].steps.length);
    else goToEnd();
  };

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
        settings={settings}
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
        {minimapHighlight && !textOnly && breakpoint !== 'desktop' && (
          <div className={styles.themeToggleFloating}>
            <MinimapToggle onClick={() => setMinimapOpen(true)} />
          </div>
        )}
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
            <CanvasBoundary onTextOnly={toggleTextOnly}>
            <Suspense fallback={null}>
              <ScrollCanvas viewShift={shortViewport && !isMobile ? 0.22 : 0} viewShiftY={isMobile ? 0.1 : 0} paused={!pageVisible} />
            </Suspense>
          </CanvasBoundary>
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
            {!isMobile && toggleShown && toggle && scene && (
              <div className={styles.modeToggleFloating}>
                <ModeToggle toggle={toggle} value={modeSelection[scene.id] ?? toggle.defaultId} onChange={(id) => setMode(scene.id, id)} />
              </div>
            )}
            {sceneIndex === SCENE5_INDEX && !isEnd && <Scene5Controls stepIndex={stepIndex} asSheet={isMobile || shortViewport} />}
            <div className={styles.topStack}>
              <Breadcrumb items={breadcrumb} />
              {scene && activeStep && (
                <CaptionBlock key={activeStep.id} sceneTitle={scene.title} caption={activeStep.caption} learnMore={activeStep.learnMore} />
              )}
              {isMobile && toggleShown && toggle && scene && (
                <ModeToggle toggle={toggle} value={modeSelection[scene.id] ?? toggle.defaultId} onChange={(id) => setMode(scene.id, id)} />
              )}
            </div>
            <div className={styles.bottomStack}>
              {!isEnd && !isMobile && <ColorLegend items={LEGEND_ITEMS} expanded={legendExpanded} onToggleExpanded={() => setLegendExpanded((e) => !e)} />}
            </div>
            {!isEnd && (
              <div className={styles.stepNav}>
                <StepNav
                  previous={previousStep && { marker: previousStep.marker, label: previousStep.label }}
                  next={nextStep && { marker: nextStep.marker, label: nextStep.label }}
                  onPrevious={() => goTo(previousStep)}
                  onNext={() => goTo(nextStep)}
                />
              </div>
            )}
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
          onShowLegend={isMobile ? () => setLegendOpen(true) : undefined}
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
      <Modal open={minimapOpen && !!minimapHighlight} onOpenChange={setMinimapOpen} title="The cascade" variant={isMobile ? 'sheet' : 'modal'}>
        {minimapHighlight && (
          <div style={{ display: 'flex', justifyContent: 'center', zoom: 1.5 }}>
            <CascadeMinimap branches={tlsContent.cascade.branches} highlightedId={minimapHighlight} title="" decorative={false} />
          </div>
        )}
      </Modal>
      <Modal open={legendOpen} onOpenChange={setLegendOpen} title="Legend" variant="sheet">
        <LegendRows items={LEGEND_ITEMS} />
      </Modal>
      {toastElement}
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
