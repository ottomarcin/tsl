import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from './Chip';

const meta: Meta<typeof Chip> = {
  title: 'Atoms/Chip',
  component: Chip,
  args: { label: 'LDH', valueText: '2.3× ULN', state: 'amber', active: true, reference: 'Amber above 2.0× ULN, red above 3.0× ULN.' },
  argTypes: {
    state: { control: 'inline-radio', options: ['normal', 'amber', 'red'] },
    fill: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    active: { control: 'boolean' },
    inert: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Chip>;

export const Default: Story = {};

/** Inactive + three active states, with and without the fill bar (design spec §6.7). */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
      {([false, true] as const).map((withBar) =>
        ([['Inactive', 'normal', false], ['Normal', 'normal', true], ['Amber', 'amber', true], ['Red', 'red', true]] as const).map(
          ([label, state, active]) => (
            <Chip key={`${label}${withBar}`} label={label} valueText="42" state={state} active={active} fill={withBar ? 0.6 : undefined} reference="Reference range" />
          ),
        ),
      )}
    </div>
  ),
};

export const Playground: Story = { args: { fill: 0.5 } };
