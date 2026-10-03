import type { Meta, StoryObj } from '@storybook/react-vite';
import { LiveAnnouncer } from './LiveAnnouncer';

const meta: Meta<typeof LiveAnnouncer> = { title: 'Atoms/LiveAnnouncer', component: LiveAnnouncer, args: { message: 'Potassium now 6.3 mmol/L, critical.' } };
export default meta;
type Story = StoryObj<typeof LiveAnnouncer>;

/** Invisible by design: it only speaks. The text is in the DOM for a screen reader (or the inspector). */
export const Default: Story = {};
export const AllVariants: Story = { args: { message: 'Scene 2: The cascade. Three branches diverge from a single lysis event.' } };
export const Playground: Story = {};
