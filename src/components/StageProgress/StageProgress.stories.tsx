import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { StageProgress } from './StageProgress';

const SCENE_LABELS = [
  'Scene 0 — Risk',
  'Scene 1 — Cytolysis',
  'Scene 2 — Cascade',
  'Scene 3 — Renal',
  'Scene 4 — Systemic',
  'Scene 5 — Intervene',
];

const meta: Meta<typeof StageProgress> = {
  title: 'Molecules/StageProgress',
  component: StageProgress,
  args: { current: 2, total: 6, labels: SCENE_LABELS },
  argTypes: {
    current: { control: { type: 'number', min: 0, max: 5 } },
    total: { control: { type: 'number', min: 1, max: 8 } },
  },
};

export default meta;
type Story = StoryObj<typeof StageProgress>;

/** Baseline args. */
export const Default: Story = {
  args: { onJump: () => {} },
};

/** Every dot state (completed/current/future) visible at once (tech arch §10.1). */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <StageProgress current={0} total={6} labels={SCENE_LABELS} onJump={() => {}} />
      <StageProgress current={3} total={6} labels={SCENE_LABELS} onJump={() => {}} />
      <StageProgress current={5} total={6} labels={SCENE_LABELS} onJump={() => {}} />
    </div>
  ),
};

/** Interactive — clicking a dot actually moves "current" live. */
export const Playground: Story = {
  render: function Render(args) {
    const [current, setCurrent] = useState(args.current);
    return <StageProgress {...args} current={current} onJump={setCurrent} />;
  },
};
