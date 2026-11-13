import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: "/rising-sun/",
  build: {
    sourcemap: false, // 不生成 .map：避免 sourcemap 进入仓库和线上
    /*
     * 成果目录（CCF 644 条 + 高质量科技期刊 68 条 + 一类目录 13 本）编译后
     * 是纯数据，体积约 100 kB，单独切块：既避免主包超过 500 kB 警告，
     * 也让浏览器可以把它和业务代码分开缓存。
     */
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("data/ccfCatalog") || id.includes("data/degreeAwards") || id.includes("data/degreeRequirements")) {
            return "catalog";
          }
          return undefined;
        },
      },
    },
  },
  plugins: [
    react(),
    tsconfigPaths()
  ],
})
