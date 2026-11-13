/**
 * 表单弹窗的「未保存就关闭」保护。
 *
 * 用途：编辑类弹窗（新增/编辑成果、成员、任务、组会）里，用户不小心点到遮罩空白处
 * 就把弹窗关掉、已填的内容全丢。这里统一兜住所有关闭入口：
 *   - 遮罩点击（改用 onMouseDown 并判断落点，避免在输入框里按下鼠标后拖到外面松开被当成点击）
 *   - ESC
 *   - 右上角按钮 / 底部取消按钮（组件里改用返回的 requestClose）
 *
 * 有未保存改动时走 confirmDialog 二次确认；没有改动就直接关。
 */
import { useCallback, useEffect } from "react";
import { useUIStore } from "@/store/ui";

export function useConfirmClose({
  open,
  dirty,
  onClose,
  message = "当前填写的内容还没有保存，确定要关闭吗？",
}: {
  open: boolean;
  dirty: boolean;
  onClose: () => void;
  message?: string;
}) {
  const showConfirm = useUIStore((s) => s.showConfirm);

  const requestClose = useCallback(() => {
    if (!dirty) {
      onClose();
      return;
    }
    void showConfirm({
      title: "放弃未保存的内容？",
      description: message,
      confirmText: "放弃并关闭",
      cancelText: "继续编辑",
      tone: "danger",
    }).then((ok) => {
      if (ok) onClose();
    });
  }, [dirty, message, onClose, showConfirm]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, requestClose]);

  /** 遮罩的 onMouseDown：只有真正落在遮罩自己身上（而不是弹窗内部）才响应 */
  const onBackdropMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) requestClose();
    },
    [requestClose]
  );

  return { requestClose, onBackdropMouseDown };
}