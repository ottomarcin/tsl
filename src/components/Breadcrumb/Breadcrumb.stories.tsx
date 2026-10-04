import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb } from './Breadcrumb';

const meta: Meta<typeof Breadcrumb> = {
  title: 'Molecules/Breadcrumb',
  component: Breadcrumb,
  args: {
    items: [
      { marker: '2', label: 'Metabolic cascade', onSelect: () => {} },
      { marker: '2.3', label: 'Phosphate binds calcium' },
    ],
  },
};
export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxWidth: 420 }}>
      <Breadcrumb items={[{ marker: '1', label: 'Tumour burden' }]} />
      <Breadcrumb items={[{ marker: '2', label: 'Metabolic cascade', onSelect: () => {} }, { marker: '2.3', label: 'Phosphate binds calcium' }]} />
      <Breadcrumb items={[{ marker: '5', label: 'Where interventions act', onSelect: () => {} }, { marker: '5.2', label: 'A very long step name that has to wrap onto a second line' }]} />
    </div>
  ),
};

export const Playground: Story = {};
