import { defineConfig } from 'vite';
import terser from '@rollup/plugin-terser';


const outputPath = {
  'lodash-es': 'https://cdn.jsdelivr.net/npm/lodash-es/lodash.min.js',
  'lodash-es/throttle': 'https://cdn.jsdelivr.net/npm/lodash-es/throttle.min.js'
}

export default defineConfig({
  build: {
    minify: false,
    lib: {
      entry: {
        'index': 'src/index.ts',
        'h2-chain': 'src/h2-chain/index.ts',
        'util': 'src/util/index.ts',
        'dom-helper': 'src/dom-helper/index.ts',
      },
      name: 'web-modules',          // 库的全局变量名称（用于浏览器环境）
      // formats: ['es'],        // 输出格式（ESModule 和 UMD）
      fileName: (format) => `web-modules.${format}.js`,  // 输出文件名
    },
    rollupOptions: {
      // 配置外部依赖
      external: [
          'lodash-es',
        'lodash-es/throttle'
      ],
      output: [{
        dir: './dist',
        entryFileNames: '[name]/index.min.js',
        chunkFileNames: '[name]/chunk/[hash].min.js',
        format: 'es',
        paths: outputPath,
        plugins: [terser() as any],
      },{
        dir: './dist',
        entryFileNames: '[name]/index.js',
        chunkFileNames: '[name]/chunk/[hash].js',
        format: 'es',
        paths: outputPath,
      }],
      plugins: []
    },
  }
});