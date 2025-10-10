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
    plugins: [tailwindcss()],
    build: {
      // 使用esbuild进行快速压缩
      minify: 'esbuild',
      // 啟用代碼分割以提高性能
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['astro'],
          }
        }
      }
    },
    // 優化依賴預構建
    optimizeDeps: {
      include: ['astro:content']
    }
  },
  // 啟用智能預載入以提升導航速度
  prefetch: {
    defaultStrategy: 'viewport', // 當連結進入視窗時預載入
    prefetchAll: true // 預載入所有連結以獲得最佳性能
  },
  // 優化圖片和資源載入
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },
  // 壓縮和優化
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
    assets: '_astro' // 统一资源目录
  },
  // 優化輸出格式
  output: 'static'
});