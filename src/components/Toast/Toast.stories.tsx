import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toast } from './Toast';

const meta: Meta<typeof Toast> = {
  title: 'Molecules/Toast',
  component: Toast,
  args: { message: 'Loading is taking longer than expected.', action: { label: 'Retry', onClick: () => {} }, onDismiss: () => {} },
};
export default meta;
type Story = StoryObj<typeof Toast>;

export const Default: Story = {};
export const AllVariants: Story = { args: { message: 'Something went wrong. Refresh if the page stops responding.', action: { label: 'Refresh', onClick: () => {} }, autoDismissMs: 8000 } };
export const Playground: Story = { args: { action: undefined } };
