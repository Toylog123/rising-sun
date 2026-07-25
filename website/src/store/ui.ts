import { create } from "zustand";

export type ConfirmTone = "primary" | "danger";
export type ToastKind = "success" | "error" | "info";

export interface ConfirmSpec {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
}

export interface ToastSpec {
  kind: ToastKind;
  message: string;
  description?: string;
  /** 持续时间（毫秒），默认 3000。设为 0 表示不自动关闭 */
  duration?: number;
}

interface ConfirmState {
  spec: (ConfirmSpec & { resolve: (v: boolean) => void }) | null;
  showConfirm: (spec: ConfirmSpec) => Promise<boolean>;
  resolveConfirm: (v: boolean) => void;

  toast: (ToastSpec & { id: number }) | null;
  showToast: (spec: ToastSpec) => number;
  clearToast: () => void;
}

let toastId = 0;

export const useUIStore = create<ConfirmState>((set, get) => ({
  spec: null,
  showConfirm: (spec) =>
    new Promise<boolean>((resolve) => {
      set({ spec: { ...spec, resolve } });
    }),
  resolveConfirm: (v) => {
    const cur = get().spec;
    if (cur) cur.resolve(v);
    set({ spec: null });
  },

  toast: null,
  showToast: (spec) => {
    const id = ++toastId;
    set({ toast: { ...spec, id } });
    return id;
  },
  clearToast: () => set({ toast: null }),
}));

/** 便捷函数：直接 await 拿布尔值 */
export function confirmDialog(spec: ConfirmSpec): Promise<boolean> {
  return useUIStore.getState().showConfirm(spec);
}

/** 便捷函数：弹一条 toast，自动 3 秒消失 */
export function showToast(spec: ToastSpec): number {
  return useUIStore.getState().showToast(spec);
}