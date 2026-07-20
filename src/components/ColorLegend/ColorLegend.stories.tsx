import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ColorLegend } from './ColorLegend';

const items = [
  { colorToken: '--mol-K', label: 'K⁺' },
  { colorToken: '--mol-PO4', label: 'PO₄' },
  { colorToken: '--mol-Ca', label: 'Ca²⁺' },
  { colorToken: '--mol-purines', label: 'Purines' },
  { colorToken: '--crystal', label: 'Crystals' },
  { colorToken: '--monitor-trace', label: 'Monitor', indicator: 'line' as const },
  { colorToken: '--flag-red', label: 'Flagged', indicator: 'line' as const },
];

const meta: Meta<typeof ColorLegend> = {
  title: 'Molecules/ColorLegend',
  component: ColorLegend,
  args: { items, expanded: false },
};

export default meta;
type Story = StoryObj<typeof ColorLegend>;

/** Baseline args — collapsed by default per the design spec. */
export const Default: Story = {
  args: { onToggleExpanded: () => {} },
};

/** Collapsed and expanded shown together (tech arch §10.1). */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
      <ColorLegend items={items} expanded={false} onToggleExpanded={() => {}} />
      <ColorLegend items={items} expanded onToggleExpanded={() => {}} />
    </div>
  ),
};

/** Interactive — tapping actually toggles expanded state. */
export const Playground: Story = {
  render: function Render(args) {
    const [expanded, setExpanded] = useState(args.expanded);
    return <ColorLegend items={args.items} expanded={expanded} onToggleExpanded={() => setExpanded((e) => !e)} />;
  },
};
