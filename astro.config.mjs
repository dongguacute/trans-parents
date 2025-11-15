// @ts-check
import { defineConfig } from 'astro/config';
import { rehypeComponents } from './src/utils/remark-components.js';
import rehypeRaw from 'rehype-raw';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import { astroI18nPlugin } from '@gudupao/astro-i18n';
import tailwindcss from '@tailwindcss/vite';
import AstroPWA from '@vite-pwa/astro';

// https://astro.build/config
export default defineConfig({
  integrations: [
    astroI18nPlugin({
      localesDir: './locales',
      pathBasedRouting: true,
      fallbackLang: 'zh-hans',
    }),
    AstroPWA({
      mode: 'production',
      base: '/',
      scope: '/',
      includeAssets: ['favicon.svg', 'favicon-32.png', 'fonts/**/*'],
      registerType: 'autoUpdate',
      manifest: {
        name: 'Trans Parents',
        short_name: 'TransParents',
        description: '一个给家长们提供跨性别方面相关知识的网站',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/favicon-32.png',
            sizes: '32x32',
            type: 'image/png'
          },
          {
            src: '/favicon-32.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/favicon-32.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        navigateFallback: '/',
        globPatterns: ['**/*.{css,js,html,svg,png,ico,txt,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        navigateFallbackAllowlist: [/^\//]
      },
      experimental: {
        directoryAndTrailingSlashHandler: true
      }
    })
  ],
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