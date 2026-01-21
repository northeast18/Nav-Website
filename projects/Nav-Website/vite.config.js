import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    host: '0.0.0.0', // 监听所有网络接口，允许局域网访问
    port: 5173       // 指定端口号
  }
})
