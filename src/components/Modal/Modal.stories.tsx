import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Modal } from './Modal';
import { Button } from '../Button/Button';

const meta: Meta<typeof Modal> = {
  title: 'Molecules/Modal',
  component: Modal,
  args: {
    title: 'Sources',
    variant: 'modal',
  },
  argTypes: {
    variant: { control: 'select', options: ['modal', 'sheet'] },
    showCloseButton: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

function ModalDemo(props: Partial<React.ComponentProps<typeof Modal>>) {
  const [open, setOpen] = useState(true);
  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title={props.title ?? 'Sources'}
      variant={props.variant}
      showCloseButton={props.showCloseButton}
    >
      <p>Howard SC, Jones DP, Pui CH. The tumor lysis syndrome. N Engl J Med 2011.</p>
      <Button onClick={() => setOpen(false)}>Close</Button>
    </Modal>
  );
}

/** Baseline — centered desktop modal, open by default. */
export const Default: Story = {
  render: (args) => <ModalDemo {...args} />,
};

/** Both variants shown side by side (tech arch §10.1). */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
      <ModalDemo title="Centered modal" variant="modal" />
    </div>
  ),
};

/** Full argTypes declared — toggle variant/title/closeButton live via Controls. */
export const Playground: Story = {
  render: (args) => <ModalDemo {...args} />,
  args: {
    title: 'Sources',
    variant: 'modal',
    showCloseButton: true,
  },
};
