import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { LabStrip } from './LabStrip';
import { tlsMetrics } from '../../content/tls';

const SCENE_LABELS = ['Risk', 'Cytolysis', 'Cascade', 'Renal', 'Systemic', 'Intervene'];

const meta: Meta<typeof LabStrip> = {
  title: 'Organisms/LabStrip',
  component: LabStrip,
  args: {
    metrics: tlsMetrics,
    values: { K: 4.2, Ca: 9.4, PO4: 3.5, UA: 5.0, Cr: 0.9 },
    timestamp: 'T+0h',
    currentStage: 0,
    totalStages: 6,
    stageLabels: SCENE_LABELS,
  },
};

export default meta;
type Story = StoryObj<typeof LabStrip>;

/** Baseline args — all-normal baseline labs. */
export const Default: Story = {
  args: { onJumpToStage: () => {} },
};

/** Normal, amber, and red flag states shown together (tech arch §10.1). */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <LabStrip
        metrics={tlsMetrics}
        values={{ K: 4.2, Ca: 9.4, PO4: 3.5, UA: 5.0, Cr: 0.9 }}
        timestamp="T+0h"
        currentStage={0}
        totalStages={6}
        stageLabels={SCENE_LABELS}
        onJumpToStage={() => {}}
        reducedMotion
      />
      <LabStrip
        metrics={tlsMetrics}
        values={{ K: 5.5, Ca: 7.8, PO4: 6.2, UA: 9.5, Cr: 1.4 }}
        timestamp="T+24h"
        currentStage={2}
        totalStages={6}
        stageLabels={SCENE_LABELS}
        onJumpToStage={() => {}}
        reducedMotion
      />
      <LabStrip
        metrics={tlsMetrics}
        values={{ K: 6.3, Ca: 7.0, PO4: 7.8, UA: 11.4, Cr: 3.1 }}
        timestamp="T+48h"
        currentStage={4}
        totalStages={6}
        stageLabels={SCENE_LABELS}
        onJumpToStage={() => {}}
        reducedMotion
      />
    </div>
  ),
};

/** Interactive — a slider drives K⁺ live so the tween/flag transition is visible. */
export const Playground: Story = {
  render: function Render(args) {
    const [k, setK] = useState(4.2);
    const [stage, setStage] = useState(args.currentStage);
    return (
      <div>
        <label style={{ display: 'block', marginBottom: 'var(--space-4)', fontFamily: 'var(--font-mono)' }}>
          K⁺: {k.toFixed(1)}
          <input type="range" min={3} max={9} step={0.1} value={k} onChange={(e) => setK(Number(e.target.value))} />
        </label>
        <LabStrip {...args} values={{ ...args.values, K: k }} currentStage={stage} onJumpToStage={setStage} />
      </div>
    );
  },
};
