/**
 * Node 的 `@/` 路径别名解析钩子
 *
 * Vite / tsconfig 里 `@/*` 指向 `./src/*`，但 Node 不认这个别名。
 * 自检脚本要直接 import 源码，所以用这个 resolve 钩子把 `@/xxx` 映射到 `src/xxx.ts`。
 *
 * 由 scripts/alias-loader.mjs 注册。
 */
import path from "node:path";
import { pathToFileURL } from "node:url";

const srcDir = path.resolve(import.meta.dirname, "..", "src");

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = path.join(srcDir, specifier.slice(2));
    const target = path.extname(base) ? base : base + ".ts";
    return nextResolve(pathToFileURL(target).href, context);
  }
  return nextResolve(specifier, context);
}
