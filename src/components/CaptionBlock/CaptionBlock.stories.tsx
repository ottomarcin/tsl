import type { Meta, StoryObj } from '@storybook/react-vite';
import { CaptionBlock } from './CaptionBlock';
import { tlsContent } from '../../content/tls';

const step = tlsContent.scenes[0].steps[0];

const meta: Meta<typeof CaptionBlock> = {
  title: 'Molecules/CaptionBlock',
  component: CaptionBlock,
  args: { sceneTitle: tlsContent.scenes[0].title, caption: step.caption, learnMore: step.learnMore },
};
export default meta;
type Story = StoryObj<typeof CaptionBlock>;

export const Default: Story = {};

/** With and without Learn more content, across the three Scene 0 steps. */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {tlsContent.scenes[0].steps.map((s) => (
        <CaptionBlock key={s.id} sceneTitle={tlsContent.scenes[0].title} caption={s.caption} learnMore={s.learnMore} />
      ))}
      <CaptionBlock sceneTitle="No learn more" caption="A caption without an expandable panel." />
    </div>
  ),
};

export const Playground: Story = {};
