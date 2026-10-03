import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { tlsContent } from '../../content/tls';
import { ModeToggle } from './ModeToggle';

const toggle = tlsContent.scenes[3].toggle!;

const meta: Meta<typeof ModeToggle> = {
  title: 'Molecules/ModeToggle',
  component: ModeToggle,
  args: { toggle, value: 'obstruction' },
  argTypes: { value: { control: 'select', options: toggle.options.map((o) => o.id) } },
};
export default meta;
type Story = StoryObj<typeof ModeToggle>;

export const Default: Story = { args: { onChange: () => {} } };

/** Every option active in turn, so the badge and each hint are visible. */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      {toggle.options.map((o) => (
        <ModeToggle key={o.id} toggle={toggle} value={o.id} onChange={() => {}} />
      ))}
    </div>
  ),
};

export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <ModeToggle toggle={args.toggle} value={value} onChange={setValue} />;
  },
};
