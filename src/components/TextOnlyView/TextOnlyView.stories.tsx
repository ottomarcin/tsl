import type { Meta, StoryObj } from '@storybook/react-vite';
import { tlsContent } from '../../content/tls';
import { labValuesAt, timestampAt } from '../../lib/steps';
import { TextOnlyView } from './TextOnlyView';

const meta: Meta<typeof TextOnlyView> = {
  title: 'Organisms/TextOnlyView',
  component: TextOnlyView,
  args: {
    scene: tlsContent.scenes[2],
    metrics: tlsContent.metrics,
    labsFor: (i: number) => labValuesAt(tlsContent.scenes, 2, i),
    timestampFor: (i: number) => timestampAt(tlsContent.scenes, 2, i),
  },
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof TextOnlyView>;

export const Default: Story = {};
export const AllVariants: Story = { args: { scene: tlsContent.scenes[4], labsFor: (i: number) => labValuesAt(tlsContent.scenes, 4, i), timestampFor: (i: number) => timestampAt(tlsContent.scenes, 4, i) } };
export const Playground: Story = {};
