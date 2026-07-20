import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeToggle } from './ThemeToggle';

const meta: Meta<typeof ThemeToggle> = {
  title: 'Molecules/ThemeToggle',
  component: ThemeToggle,
  args: { theme: 'dark' },
  argTypes: {
    theme: { control: 'radio', options: ['dark', 'light'] },
  },
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

/** Baseline args. */
export const Default: Story = {};

/** Both states shown together (tech arch §10.1). */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
      <ThemeToggle theme="dark" onToggle={() => {}} />
      <ThemeToggle theme="light" onToggle={() => {}} />
    </div>
  ),
};

/** Interactive — actually toggles state on click, not just a static preset. */
export const Playground: Story = {
  render: function Render(args) {
    const [theme, setTheme] = useState(args.theme);
    return <ThemeToggle theme={theme} onToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />;
  },
};
