import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { QualityToggle } from './QualityToggle';

const meta: Meta<typeof QualityToggle> = {
  title: 'Molecules/QualityToggle',
  component: QualityToggle,
  args: { quality: 'high' },
  argTypes: { quality: { control: 'radio', options: ['high', 'standard'] } },
};
export default meta;
type Story = StoryObj<typeof QualityToggle>;

export const Default: Story = { args: { onToggle: () => {} } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
      <QualityToggle quality="high" onToggle={() => {}} />
      <QualityToggle quality="standard" onToggle={() => {}} />
    </div>
  ),
};

export const Playground: Story = {
  render: function Render(args) {
    const [quality, setQuality] = useState(args.quality);
    return <QualityToggle quality={quality} onToggle={() => setQuality((q) => (q === 'high' ? 'standard' : 'high'))} />;
  },
};
