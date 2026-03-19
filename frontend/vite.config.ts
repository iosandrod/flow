import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import * as path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isLibBuild = mode === 'library'
  
  return {
    base: isLibBuild ? './' : (process.env.NODE_ENV === 'production' ? './' : '/'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/'),
        'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js',
        types: path.resolve(__dirname, 'types/')
      }
    },
    server: {
      port: 80,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    },
    plugins: [
      vue(),
      vueJsx({}),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/bpmn-icons')],
        symbolId: '[name]',
        customDomId: '__svg__icons__dom__'
      })
    ],
    build: isLibBuild ? {
      lib: {
        entry: path.resolve(__dirname, 'src/lib/index.ts'),
        name: 'ApprovalFlow',
        fileName: 'approval-flow',
        formats: ['es', 'umd']
      },
      rollupOptions: {
        external: ['vue', 'naive-ui', 'lucide-vue-next'],
        output: {
          globals: {
            vue: 'Vue',
            'naive-ui': 'naiveUi',
            'lucide-vue-next': 'lucideVueNext'
          },
          exports: 'named'
        }
      }
    } : undefined
  }
})
