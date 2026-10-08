import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Regenerate the icons in public/ after changing public/icon.svg: npm run icons
const rubric = '#8C1C13';

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: rubric } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: rubric } },
  },
  images: ['public/icon.svg'],
});
