import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: "/rising-sun/",
  build: {
    sourcemap: false, // 不生成 .map：避免 sourcemap 进入仓库和线上
  },
  plugins: [
    react(),
    tsconfigPaths()
  ],
})
