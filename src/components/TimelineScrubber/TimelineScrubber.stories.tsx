import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TimelineScrubber } from './TimelineScrubber';

const meta: Meta<typeof TimelineScrubber> = {
  title: 'Molecules/TimelineScrubber',
  component: TimelineScrubber,
  args: { value: 0.5, startLabel: 'T+0h', endLabel: 'T+48h', currentLabel: 'T+24h', ariaLabel: 'Time since lysis began', onChange: () => {} },
};
export default meta;
type Story = StoryObj<typeof TimelineScrubber>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      <TimelineScrubber {...args} value={0} currentLabel="T+0h" />
      <TimelineScrubber {...args} value={0.5} />
      <TimelineScrubber {...args} value={1} currentLabel="T+48h" />
    </div>
  ),
};

export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = useState(0.3);
    return <TimelineScrubber {...args} value={value} currentLabel={`T+${Math.round(value * 48)}h`} onChange={setValue} />;
  },
};
