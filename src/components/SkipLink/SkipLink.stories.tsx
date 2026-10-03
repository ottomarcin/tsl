import type { Meta, StoryObj } from '@storybook/react-vite';
import { SkipLink } from './SkipLink';

const meta: Meta<typeof SkipLink> = { title: 'Atoms/SkipLink', component: SkipLink, args: { targetId: 'main-content', children: 'Skip to content' } };
export default meta;
type Story = StoryObj<typeof SkipLink>;

/** Hidden until it takes focus: press Tab. */
export const Default: Story = {};
export const AllVariants: Story = {};
export const Playground: Story = {};
