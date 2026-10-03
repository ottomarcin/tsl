import type { Meta, StoryObj } from '@storybook/react-vite';
import { AssetLoadingBar } from './AssetLoadingBar';

const meta: Meta<typeof AssetLoadingBar> = {
  title: 'Atoms/AssetLoadingBar',
  component: AssetLoadingBar,
  args: { active: true, progress: 60 },
  argTypes: { progress: { control: { type: 'range', min: 0, max: 100, step: 5 } } },
};
export default meta;
type Story = StoryObj<typeof AssetLoadingBar>;

export const Default: Story = {};

/** Idle (renders nothing), 0%, mid, and complete. The bar is fixed to the viewport top, so each is shown one at a time. */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-4)', position: 'relative', minHeight: 120 }}>
      {[0, 35, 70, 100].map((p) => (
        <div key={p} style={{ position: 'relative', height: 3, transform: 'translateZ(0)' }}>
          <AssetLoadingBar active progress={p} />
        </div>
      ))}
      <AssetLoadingBar active={false} progress={50} />
    </div>
  ),
};

export const Playground: Story = {};
