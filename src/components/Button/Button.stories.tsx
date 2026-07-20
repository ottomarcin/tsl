import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  args: {
    children: 'Begin →',
    variant: 'primary',
    size: 'md',
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'tertiary'] },
    size: { control: 'select', options: ['lg', 'md', 'sm'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

/** Baseline args — proves the component renders correctly out of the box. */
export const Default: Story = {};

/** Every variant × size combination, plus disabled/loading, in one view (tech arch §10.1). */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {(['primary', 'secondary', 'tertiary'] as const).map((variant) => (
        <div key={variant} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          {(['lg', 'md', 'sm'] as const).map((size) => (
            <Button key={size} variant={variant} size={size}>
              {variant}/{size}
            </Button>
          ))}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
      </div>
    </div>
  ),
};

/** Full argTypes declared — drive every prop live via the Controls panel. */
export const Playground: Story = {
  args: {
    children: 'Begin →',
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
  },
};
