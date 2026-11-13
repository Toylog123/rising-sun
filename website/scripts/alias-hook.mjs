/**
 * Node 的 `@/` 路径别名解析钩子
 *
 * Vite / tsconfig 里 `@/*` 指向 `./src/*`，但 Node 不认这个别名。
 * 自检脚本要直接 import 源码，所以用这个 resolve 钩子把 `@/xxx` 映射到 `src/xxx.ts`。
 * 同时补上源码里省略扩展名的相对导入（如 `./ccfCatalog` → `./ccfCatalog.ts`），
 * 因为 Vite 会自动补扩展名而 Node 不会。
 *
 * 由 scripts/alias-loader.mjs 注册。
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const srcDir = path.resolve(import.meta.dirname, "..", "src");

/** 依次尝试 .ts / .tsx / /index.ts */
function withExtension(base) {
  if (path.extname(base) && fs.existsSync(base)) return base;
  for (const suffix of [".ts", ".tsx", "/index.ts", "/index.tsx"]) {
    const candidate = base + suffix;
    if (fs.existsSync(candidate)) return candidate;
  }
  return path.extname(base) ? base : base + ".ts";
}

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = path.join(srcDir, specifier.slice(2));
    return nextResolve(pathToFileURL(withExtension(base)).href, context);
  }
  // 源码里的相对导入常常省略扩展名
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    const base = path.resolve(parentDir, specifier);
    if (!path.extname(base)) {
      return nextResolve(pathToFileURL(withExtension(base)).href, context);
    }
  }
  return nextResolve(specifier, context);
}