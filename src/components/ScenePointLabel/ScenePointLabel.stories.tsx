import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas } from '@react-three/fiber';
import { ScenePointLabel } from './ScenePointLabel';

// A label lives in a 3D scene: the stories give it a small canvas to sit in.
const meta: Meta<typeof ScenePointLabel> = {
  title: 'Atoms/ScenePointLabel',
  component: ScenePointLabel,
  args: { position: [0, 0, 0], text: 'Kidney', color: 'var(--text-secondary)' },
  decorators: [
    (Story) => (
      <div style={{ width: 360, height: 160 }}>
        <Canvas camera={{ position: [0, 0, 5] }}>
          <Story />
        </Canvas>
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof ScenePointLabel>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => (
    <>
      <ScenePointLabel position={[0, 0.8, 0]} text="Naming a part" color="var(--mol-purines)" />
      <ScenePointLabel position={[0, 0.2, 0]} text="Secondary marker" subtle />
      <ScenePointLabel position={[0, -0.5, 0]} text="A message in a scene" large color="var(--flag-red)" />
    </>
  ),
};

export const Playground: Story = {};
