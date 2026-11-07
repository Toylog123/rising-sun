/**
 * 让 Node 认识 `@/` 路径别名（Vite/tsconfig 里的 `@/*` → `./src/*`）
 *
 * 自检脚本直接 import 源码时需要它，否则 `@/lib/github` 解析不了。
 *
 * 用法：node --experimental-strip-types --import ./scripts/alias-loader.mjs script.mjs
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const hook = pathToFileURL(
  path.resolve(import.meta.dirname, "alias-hook.mjs")
).href;

register(hook);
