// @ts-check
import { defineConfig } from 'astro/config';
import { rehypeComponents } from './src/utils/remark-components.js';
import rehypeRaw from 'rehype-raw';
import remarkDirective from 'remark-directive';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: 'github-dark'
    },
    remarkPlugins: [
      remarkDirective // 支持自定義指令語法
    ],
    rehypePlugins: [
      rehypeRaw, // 支持原生 HTML 標籤和自定義組件標籤
      rehypeComponents
    ]
  },
  vite: {
    plugins: [tailwindcss()]
  }
});