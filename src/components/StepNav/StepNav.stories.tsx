import type { Meta, StoryObj } from '@storybook/react-vite';
import { StepNav } from './StepNav';

const meta: Meta<typeof StepNav> = {
  title: 'Molecules/StepNav',
  component: StepNav,
  args: {
    previous: { marker: '2.2', label: 'Potassium rises' },
    next: { marker: '2.4', label: 'Uric acid' },
    onPrevious: () => {},
    onNext: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof StepNav>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
      <StepNav {...args} previous={null} />
      <StepNav {...args} />
      <StepNav {...args} next={{ label: 'End card' }} />
    </div>
  ),
};

export const Playground: Story = {};
