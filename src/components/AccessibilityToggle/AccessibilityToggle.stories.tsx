import type { Meta, StoryObj } from '@storybook/react-vite';
import { AccessibilityToggle } from './AccessibilityToggle';

const meta: Meta<typeof AccessibilityToggle> = { title: 'Atoms/AccessibilityToggle', component: AccessibilityToggle, args: { textOnly: false, onToggle: () => {} } };
export default meta;
type Story = StoryObj<typeof AccessibilityToggle>;

export const Default: Story = {};
export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
      <AccessibilityToggle {...args} textOnly={false} />
      <AccessibilityToggle {...args} textOnly />
    </div>
  ),
};
export const Playground: Story = {};
