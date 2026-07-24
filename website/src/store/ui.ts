import { create } from "zustand";

export type ConfirmTone = "primary" | "danger";

export interface ConfirmSpec {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
}

interface ConfirmState {
  spec: (ConfirmSpec & { resolve: (v: boolean) => void }) | null;
  showConfirm: (spec: ConfirmSpec) => Promise<boolean>;
  resolveConfirm: (v: boolean) => void;
}

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
}));

/** 便捷函数：直接 await 拿布尔值 */
export function confirmDialog(spec: ConfirmSpec): Promise<boolean> {
  return useUIStore.getState().showConfirm(spec);
}