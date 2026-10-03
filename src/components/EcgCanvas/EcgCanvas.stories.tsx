import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ECG_STATES, type EcgState } from '../../lib/ecg';
import { EcgCanvas } from './EcgCanvas';

const meta: Meta<typeof EcgCanvas> = {
  title: 'Molecules/EcgCanvas',
  component: EcgCanvas,
  args: { state: 'normal_sinus', width: 320, height: 80, animated: true, irregularity: 0 },
  argTypes: {
    state: { control: 'select', options: ECG_STATES },
    irregularity: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
};
export default meta;
type Story = StoryObj<typeof EcgCanvas>;

export const Default: Story = {};

/** All five states at once, still, so the differences between them can be compared side by side. */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
      {ECG_STATES.map((s) => (
        <div key={s}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-mono-sm)', color: 'var(--text-muted)', marginBottom: 4 }}>{s}</div>
          <EcgCanvas state={s} width={320} height={80} animated={false} />
        </div>
      ))}
    </div>
  ),
};

/** Click through the states to watch the one-second morph. */
export const Playground: Story = {
  render: function Render(args) {
    const [state, setState] = useState<EcgState>(args.state);
    return (
      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <EcgCanvas {...args} state={state} />
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {ECG_STATES.map((s) => (
            <button key={s} type="button" onClick={() => setState(s)} aria-pressed={s === state}>
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  },
};
