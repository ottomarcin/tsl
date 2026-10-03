import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChipCluster } from './ChipCluster';
import { tlsContent } from '../../content/tls';

const chips = tlsContent.scenes[0].chips!;

const frame = { position: 'relative', width: 900, height: 520, background: 'var(--bg-canvas)' } as const;

const meta: Meta<typeof ChipCluster> = {
  title: 'Molecules/ChipCluster',
  component: ChipCluster,
  args: { chips, phase: 'shown', reducedMotion: false },
  argTypes: { phase: { control: 'inline-radio', options: ['hidden', 'shown', 'merged'] } },
  decorators: [(Story) => <div style={frame}><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof ChipCluster>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
      {(['hidden', 'shown', 'merged'] as const).map((phase) => (
        <div key={phase} style={{ ...frame, width: 420, height: 300 }}>
          <ChipCluster chips={chips} phase={phase} />
        </div>
      ))}
    </div>
  ),
};

export const Playground: Story = {};
