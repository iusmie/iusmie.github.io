import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages部署配置
  // 如果仓库名是 mdcompare，则base为 '/mdcompare/'
  // 如果使用自定义域名，改为 base: '/'
  base: process.env.VITE_BASE_PATH || '/mdcompare/',
  // 开发服务器配置
  server: {
    port: 5173,
    // 配置开发服务器，让根路径显示个人主页，/mdcompare-app.html 显示 React 应用
    fs: {
      strict: false,
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: resolve(__dirname, 'mdcompare-app.html'),
    },
  },
})
