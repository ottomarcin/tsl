import type { Meta, StoryObj } from '@storybook/react-vite';
import { allTlsCitations, sourceLink } from '../../content/tls/citations';
import { SourcesModal } from './SourcesModal';

const sources = allTlsCitations.map((c) => ({ id: c.id, text: c.text, href: sourceLink(c) }));

const meta: Meta<typeof SourcesModal> = {
  title: 'Organisms/SourcesModal',
  component: SourcesModal,
  args: { open: true, onOpenChange: () => {}, title: 'Sources', sources },
};
export default meta;
type Story = StoryObj<typeof SourcesModal>;

export const Default: Story = {};
export const AllVariants: Story = { args: { variant: 'sheet' } };
export const Playground: Story = {};
