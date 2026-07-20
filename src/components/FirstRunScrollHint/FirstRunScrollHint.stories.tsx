import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FirstRunScrollHint } from './FirstRunScrollHint';

const meta: Meta<typeof FirstRunScrollHint> = {
  title: 'Molecules/FirstRunScrollHint',
  component: FirstRunScrollHint,
  args: { visible: true },
};

export default meta;
type Story = StoryObj<typeof FirstRunScrollHint>;

/** Baseline args — visible. */
export const Default: Story = {
  args: { onDismiss: () => {} },
};

/** Visible vs. dismissed (renders nothing) — tech arch §10.1. */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
      <FirstRunScrollHint visible onDismiss={() => {}} />
      <div style={{ width: 280, height: 120, border: '1px dashed var(--border-subtle)' }} />
    </div>
  ),
};

/** Interactive — clicking dismiss actually hides it. */
export const Playground: Story = {
  render: function Render(args) {
    const [visible, setVisible] = useState(args.visible);
    return <FirstRunScrollHint visible={visible} onDismiss={() => setVisible(false)} />;
  },
};
