import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { tlsInterventions } from '../../content/tls/interventions';
import { tlsMetrics } from '../../content/tls/metrics';
import { InterventionPanel } from './InterventionPanel';

const baseline = { K: 6.3, Ca: 7.0, PO4: 7.8, UA: 11.4, Cr: 3.1 };

const STATES: Record<string, number | boolean>[] = [{ rasburicase: true }, { allopurinol: true }, { hydration: 0.625 }, { dialysis: true }, { rasburicase: true, hydration: 1, dialysis: true }];

const meta: Meta<typeof InterventionPanel> = {
  title: 'Organisms/InterventionPanel',
  component: InterventionPanel,
  args: {
    heading: 'Try interventions',
    hint: 'Adjust the slider and toggles to see how interventions change the cascade. Reset returns you to baseline.',
    interventions: tlsInterventions,
    metrics: tlsMetrics,
    baseline,
    state: {},
    resetLabel: 'Reset T+0',
    note: 'Illustrative: simple multipliers to show direction and size of effect, not a prediction for a patient.',
    onChange: () => {},
    onReset: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof InterventionPanel>;

export const Default: Story = {};

/** Each intervention on its own, then all together. */
export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)' }}>
      {STATES.map((state, i) => (
        <InterventionPanel key={i} {...args} state={state} />
      ))}
    </div>
  ),
};

export const Playground: Story = {
  render: (args) => {
    const [state, setState] = useState<Record<string, number | boolean>>({});
    return <InterventionPanel {...args} state={state} onChange={(id, v) => setState((s) => ({ ...s, [id]: v }))} onReset={() => setState({})} />;
  },
};
