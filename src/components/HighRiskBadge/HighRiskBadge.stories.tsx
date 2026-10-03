import type { Meta, StoryObj } from '@storybook/react-vite';
import { HighRiskBadge } from './HighRiskBadge';

const meta: Meta<typeof HighRiskBadge> = {
  title: 'Atoms/HighRiskBadge',
  component: HighRiskBadge,
  args: { label: 'HIGH RISK', state: 'red', visible: true, reducedMotion: false },
  argTypes: { state: { control: 'inline-radio', options: ['normal', 'amber', 'red'] } },
};
export default meta;
type Story = StoryObj<typeof HighRiskBadge>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
      <HighRiskBadge label="HIGH RISK" state="red" visible />
      <HighRiskBadge label="INTERMEDIATE" state="amber" visible />
      <HighRiskBadge label="LOW RISK" state="normal" visible />
      <HighRiskBadge label="HIGH RISK (reduced motion)" state="red" visible reducedMotion />
    </div>
  ),
};

export const Playground: Story = {};
