import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CascadeMinimap } from './CascadeMinimap';
import { tlsCascade } from '../../content/tls';

const meta: Meta<typeof CascadeMinimap> = {
  title: 'Organisms/CascadeMinimap',
  component: CascadeMinimap,
  args: { branches: tlsCascade.branches, highlightedId: 'K' },
  argTypes: {
    highlightedId: { control: 'select', options: ['K', 'PO4', 'purines', 'full', null] },
  },
};

export default meta;
type Story = StoryObj<typeof CascadeMinimap>;

/** Baseline args. */
export const Default: Story = {};

/** Every highlight state (tech arch §10.1) — one branch each, then "full". */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
      {(['K', 'PO4', 'purines', 'full'] as const).map((id) => (
        <CascadeMinimap key={id} branches={tlsCascade.branches} highlightedId={id} />
      ))}
    </div>
  ),
};

/** Interactive — select which branch is highlighted live via Controls. */
export const Playground: Story = {
  render: function Render(args) {
    const [highlightedId, setHighlightedId] = useState(args.highlightedId);
    return (
      <div>
        <select value={highlightedId ?? ''} onChange={(e) => setHighlightedId(e.target.value || null)}>
          {['K', 'PO4', 'purines', 'full', ''].map((v) => (
            <option key={v} value={v}>
              {v || 'null (hidden)'}
            </option>
          ))}
        </select>
        <div style={{ marginTop: 'var(--space-4)' }}>
          <CascadeMinimap branches={tlsCascade.branches} highlightedId={highlightedId} />
        </div>
      </div>
    );
  },
};
