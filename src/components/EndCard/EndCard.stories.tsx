import type { Meta, StoryObj } from '@storybook/react-vite';
import { tlsEndCard } from '../../content/tls/endCard';
import { EndCard } from './EndCard';

const meta: Meta<typeof EndCard> = {
  title: 'Organisms/EndCard',
  component: EndCard,
  args: { content: tlsEndCard, onReplay: () => {}, onSources: () => {}, onRestart: () => {} },
  decorators: [(Story) => <div style={{ position: 'relative', height: '100vh' }}><Story /></div>],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof EndCard>;

export const Default: Story = {};

/** With a clinical review recorded (the line is left out until then). */
export const AllVariants: Story = { args: { content: { ...tlsEndCard, lastReview: 'June 2026' } } };

export const Playground: Story = {};
