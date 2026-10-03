import type { Meta, StoryObj } from '@storybook/react-vite';
import { tlsContent } from '../../content/tls';
import { ReplaySceneModal } from './ReplaySceneModal';

const scenes = tlsContent.scenes.map((s) => ({ index: s.index, title: s.title, summary: s.steps[0].caption }));

const meta: Meta<typeof ReplaySceneModal> = {
  title: 'Organisms/ReplaySceneModal',
  component: ReplaySceneModal,
  args: { open: true, onOpenChange: () => {}, title: 'Replay a scene', scenes, onPick: () => {} },
};
export default meta;
type Story = StoryObj<typeof ReplaySceneModal>;

export const Default: Story = {};
export const AllVariants: Story = { args: { variant: 'sheet' } };
export const Playground: Story = {};
