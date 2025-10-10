// @ts-check
import { defineConfig } from 'astro/config';
import { rehypeComponents } from './src/utils/remark-components.js';
import rehypeRaw from 'rehype-raw';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  markdown: {
    remarkPlugins: [
      remarkGfm // 支持 GitHub Flavored Markdown (表格, 等等)
    ],
    rehypePlugins: [
      rehypeRaw, // 支持原生 HTML 標籤和自定義組件標籤
      rehypeComponents
    ]
  },
  vite: {
    plugins: [tailwindcss()]
  },
  // Next.js 風格的優化配置
  prefetch: {
    defaultStrategy: 'hover'
  },
  // 優化圖片和資源載入
  image: {
    // 啟用圖片優化
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },
  // 壓縮和優化
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto'
  }
});