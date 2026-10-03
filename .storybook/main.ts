import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  // Serves public/ (models, Draco decoder) so 3D stories can load real assets.
  staticDirs: ['../public'],
  addons: ['@storybook/addon-themes', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
