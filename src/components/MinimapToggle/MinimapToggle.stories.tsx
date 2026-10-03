import type { Meta, StoryObj } from '@storybook/react-vite';
import { MinimapToggle } from './MinimapToggle';

const meta: Meta<typeof MinimapToggle> = { title: 'Atoms/MinimapToggle', component: MinimapToggle, args: { onClick: () => {} } };
export default meta;
type Story = StoryObj<typeof MinimapToggle>;

export const Default: Story = {};
export const AllVariants: Story = {};
export const Playground: Story = {};
