/**
 * 全站共享的 GitHub PAT
 *
 * 背景：早期实现里 tasks / meetings / achievements 三个 store 各存一份 ghToken，
 * 而设置界面只往 tasks store 写。结果 meetings / achievements 的 ghToken
 * 永远是空字符串，组会与成果的自动推送必然报「未配置 PAT」。
 *
 * 这里改成单一数据源：localStorage 的 `rising-sun-pat`。
 * 三个 store 都从这里读，TokenSetup 也只写这里。
 * 各 store 仍保留自己的 ghToken 字段（persist 结构不变，避免破坏老用户缓存），
 * 但以共享值为准。
 */

const STORAGE_KEY = "rising-sun-pat";

/** 已注册的 store：只有 setToken 方法是必需的 */
interface TokenAwareStore {
  getState: () => { setToken?: (t: string) => void };
}

interface StoreRegistry {
  __risingSunStores?: TokenAwareStore[];
}

let memoryToken = "";

/** 读取共享 PAT（localStorage 不可用时退回内存值） */
export function getSharedToken(): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (typeof v === "string") {
      memoryToken = v;
      return v;
    }
  } catch {
    // localStorage 被禁用（隐私模式等），退回内存值
  }
  return memoryToken;
}

/** 写入共享 PAT，并广播给所有 store */
export function setSharedToken(token: string): void {
  const v = token.trim();
  memoryToken = v;
  try {
    if (v) localStorage.setItem(STORAGE_KEY, v);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 忽略：仍然保留内存值，本次会话仍然可用
  }
  syncStores(v);
}

/** 清除共享 PAT */
export function clearSharedToken(): void {
  setSharedToken("");
}

/**
 * 把共享 PAT 同步进各个 store。
 * 直接调用各 store 的 setToken，避免 store 之间互相 import 造成循环依赖。
 */
function syncStores(token: string): void {
  try {
    // 动态 import 会在模块初始化阶段造成循环依赖，这里用全局注册表更安全
    const reg = (globalThis as StoreRegistry).__risingSunStores;
    if (reg) {
      for (const store of reg) {
        try {
          store.getState().setToken?.(token);
        } catch {
          // 单个 store 失败不影响其它
        }
      }
    }
  } catch {
    // ignore
  }
}

/** 注册一个 store，使其能收到共享 PAT 的变更 */
export function registerTokenStore(store: TokenAwareStore): void {
  const g = globalThis as StoreRegistry;
  if (!g.__risingSunStores) g.__risingSunStores = [];
  g.__risingSunStores.push(store);
  // 注册时立刻同步一次当前值（修复历史遗留的空 token）
  const t = getSharedToken();
  if (t) {
    try {
      store.getState().setToken?.(t);
    } catch {
      // ignore
    }
  }
}

/**
 * store 的 persist 初始化时调用：优先用共享 PAT，
 * 没有共享 PAT 时回退到 store 自己持久化的值（老用户迁移）。
 */
export function resolveInitialToken(stored: string | undefined): string {
  const shared = getSharedToken();
  if (shared) return shared;
  return stored ?? "";
}

/**
 * 老用户迁移：共享 PAT 还没建立，但某个 store 里有历史遗留的 token。
 * 把第一个找到的 token 提升为共享 token，这样其余 store 也能用上。
 */
export function seedSharedToken(stored: string | undefined): string {
  const shared = getSharedToken();
  if (shared) return shared;
  if (stored) {
    setSharedToken(stored);
    return stored;
  }
  return "";
}
