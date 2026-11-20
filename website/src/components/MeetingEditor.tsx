import { useEffect, useRef, useState } from "react";
import { X, Plus, Pencil, AlertCircle, Calendar, User, FileText, Paperclip, Upload, Loader2, Trash2 } from "lucide-react";
import { useMeetingStore, type Meeting } from "@/store/meetings";
import { useTaskStore } from "@/store/tasks";
import { confirmDialog } from "@/store/ui";
import Combobox from "./Combobox";
import { useConfirmClose } from "@/hooks/useConfirmClose";
import {
  uploadAttachment,
  checkFile,
  formatBytes,
  buildAttachmentName,
  sleep,
  MAX_ATTACHMENT_BYTES,
  type MeetingAttachment,
} from "@/lib/uploads";

interface MeetingEditorProps {
  open: boolean;
  initial?: Meeting | null;
  onClose: () => void;
}

export default function MeetingEditor({ open, initial, onClose }: MeetingEditorProps) {
  const addMeeting = useMeetingStore((s) => s.addMeeting);
  const updateMeeting = useMeetingStore((s) => s.updateMeeting);
  const removeMeeting = useMeetingStore((s) => s.removeMeeting);
  const removeMeetingFiles = useMeetingStore((s) => s.removeMeetingFiles);
  const deleteAttachmentFiles = useMeetingStore((s) => s.deleteAttachmentFiles);
  const ghToken = useMeetingStore((s) => s.ghToken);

  const isEdit = Boolean(initial);

  const members = useTaskStore((s) => s.members);
  const memberNames = Array.from(
    new Set(members.filter((m) => m.role !== "teacher").map((m) => m.name))
  ).sort((a, b) => a.localeCompare(b, "zh-CN"));

  const [date, setDate] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  // 附件：已保存的（来自 initial）+ 本次新选的（待上传）
  const [attachments, setAttachments] = useState<MeetingAttachment[]>([]);
  const [pending, setPending] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setDate(initial.date);
      setSpeaker(initial.speaker);
      setTopic(initial.topic);
      setNotes(initial.notes ?? "");
      setAttachments(initial.attachments ?? []);
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setDate(today);
      setSpeaker("");
      setTopic("");
      setNotes("");
      setAttachments([]);
    }
    setPending([]);
    setError("");
  }, [open, initial]);

  // 有没有填过东西：有内容时点遮罩/按 ESC 不会直接关掉（正在上传时也不允许关）
  const dirty =
    uploading ||
    Boolean(date.trim() || speaker.trim() || topic.trim() || notes.trim()) ||
    pending.length > 0 ||
    (initial ? attachments.length !== (initial.attachments?.length ?? 0) : attachments.length > 0);

  const { requestClose, onBackdropMouseDown } = useConfirmClose({
    open,
    dirty,
    onClose,
    message: uploading
      ? "附件还在上传中，关闭会中断上传，确定要关闭吗？"
      : "组会记录还没保存，关闭后需要重新填写。",
  });

  if (!open) return null;

  const handlePickFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const f of Array.from(files)) {
      const check = checkFile(f);
      if (check.ok) {
        accepted.push(f);
      } else {
        rejected.push(check.reason ?? `「${f.name}」无法上传`);
      }
    }
    if (accepted.length > 0) setPending((prev) => [...prev, ...accepted]);
    // 有文件被拒时保留提示文案，别被 setError("") 抹掉
    if (rejected.length > 0) setError(rejected.join("；"));
    else setError("");
    // 允许重复选同一个文件
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async () => {
    if (!date) {
      setError("请选择日期");
      return;
    }
    if (!speaker.trim()) {
      setError("请填写主讲人");
      return;
    }
    if (!topic.trim()) {
      setError("请填写议题/标题");
      return;
    }

    let finalAttachments = attachments;

    // 被移除的旧附件：记录里不再引用，但要顺手删掉仓库里的文件
    const removed = (initial?.attachments ?? []).filter(
      (a) => !attachments.some((b) => b.path === a.path)
    );

    if (pending.length > 0) {
      if (!ghToken) {
        setError("上传附件需要先配置 PAT（右上角 ⚙ 设置）");
        return;
      }
      setUploading(true);
      const uploaded: MeetingAttachment[] = [];
      try {
        for (const f of pending) {
          uploaded.push(
            await uploadAttachment(f, ghToken, date, speaker.trim(), topic.trim())
          );
          // 官方建议相邻两次 mutative 请求之间至少隔 1 秒，避免二级限速
          if (pending.length > 1) await sleep(1000);
        }
        finalAttachments = [...attachments, ...uploaded];
      } catch (err) {
        // 中途失败：已传成功的文件没进记录，会变成仓库里的孤儿文件 → 顺手删掉
        if (uploaded.length > 0) void deleteAttachmentFiles(uploaded);
        setError(err instanceof Error ? err.message : "附件上传失败");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const payload = {
      date,
      speaker: speaker.trim(),
      topic: topic.trim(),
      notes: notes.trim() || undefined,
      attachments: finalAttachments.length > 0 ? finalAttachments : undefined,
    };

    if (isEdit && initial) {
      updateMeeting(initial.id, payload);
    } else {
      addMeeting(payload);
    }

    // 记录更新完再删文件，避免文件先没了、记录还指向它
    if (removed.length > 0) void deleteAttachmentFiles(removed);

    onClose();
  };

  const handleDelete = async () => {
    if (!initial) return;
    const ok = await confirmDialog({
      title: `删除组会记录「${initial.topic}」？`,
      description: `${initial.date} · 主讲人 ${initial.speaker}`,
      confirmText: "删除",
      cancelText: "取消",
      tone: "danger",
    });
    if (!ok) return;
    // 先删仓库里的附件文件，再删记录
    void removeMeetingFiles(initial.id);
    removeMeeting(initial.id);
    onClose();
  };

  const field =
    "w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder-faint outline-none transition-all focus:border-accent/40 focus:ring-2 focus:ring-accent/10";
  const label = "block text-sm font-medium text-ink mb-1.5";
  const areaCls = `${field} min-h-[80px] resize-y leading-relaxed`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onMouseDown={onBackdropMouseDown}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-paper border border-line shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-wash">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-accent text-white">
              {isEdit ? <Pencil size={14} /> : <Plus size={14} />}
            </div>
            <h2 className="font-serif text-lg font-bold text-ink">
              {isEdit ? "编辑组会记录" : "新增组会记录"}
            </h2>
          </div>
          <button
            onClick={requestClose}
            className="text-faint hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} className="text-accent" />
                  组会日期
                </span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={field}
              />
            </div>
            <div>
              <label className={label}>
                <span className="inline-flex items-center gap-1.5">
                  <User size={14} className="text-accent" />
                  主讲人
                </span>
              </label>
              <Combobox
                value={speaker}
                onChange={setSpeaker}
                placeholder="选择主讲学生"
                groups={[{ label: "👥 主讲学生", icon: <User size={11} />, options: memberNames }]}
                allowCustom={false}
              />
            </div>
          </div>

          <div>
            <label className={label}>议题 / 标题</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例如：修改论文进展 / 构思课题方向"
              className={field}
            />
          </div>

          <div>
            <label className={`${label} flex items-center gap-2`}>
              <span className="inline-flex items-center gap-1.5">
                <FileText size={14} className="text-accent" />
                纪要（可选）
              </span>
              <span className="ml-auto text-xs font-normal text-faint">
                简要写：做了什么、关键结论
              </span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="讨论了哪些内容、有什么观点…（两三句话即可，细节留在 PDF 里）"
              className={areaCls}
            />
          </div>

          {/* 汇报材料（PDF） */}
          <div>
            <label className={label}>
              <span className="inline-flex items-center gap-1.5">
                <Paperclip size={14} className="text-accent" />
                汇报材料（PPT 导出的 PDF，可选）
              </span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              onChange={(e) => handlePickFiles(e.target.files)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full rounded-xl border border-dashed border-line bg-paper px-3.5 py-3 text-sm text-muted hover:border-accent/50 hover:text-accent transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <Upload size={15} />
              {uploading ? "上传中…" : "选择 PDF 文件"}
            </button>
            <p className="mt-1.5 text-xs text-faint">
              单个文件不超过 {formatBytes(MAX_ATTACHMENT_BYTES)}，保存时会连同记录一起推到 GitHub
            </p>
            <p className="mt-1 text-xs text-faint">
              命名规范：{buildAttachmentName(speaker.trim(), topic.trim())}
            </p>

            {attachments.length > 0 && (
              <ul className="mt-2.5 space-y-1.5">
                {attachments.map((a) => (
                  <li
                    key={a.path}
                    className="flex items-center gap-2 rounded-xl border border-wash bg-paper px-3 py-2"
                  >
                    <FileText size={14} className="text-accent shrink-0" />
                    <span className="text-sm text-ink truncate flex-1">{a.name}</span>
                    <span className="text-xs text-faint shrink-0">{formatBytes(a.size)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((prev) => prev.filter((x) => x.path !== a.path))
                      }
                      title="移除"
                      className="shrink-0 text-faint hover:text-danger-ink transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {pending.length > 0 && (
              <ul className="mt-2.5 space-y-1.5">
                {pending.map((f, i) => (
                  <li
                    key={`${f.name}_${f.size}_${i}`}
                    className="flex items-center gap-2 rounded-xl border border-accent/25 bg-paper px-3 py-2"
                  >
                    <FileText size={14} className="text-accent shrink-0" />
                    <span className="text-sm text-ink truncate flex-1">
                      {buildAttachmentName(speaker.trim(), topic.trim())}
                    </span>
                    <span className="text-xs text-faint shrink-0">{formatBytes(f.size)}</span>
                    <span className="shrink-0 text-xs text-accent">待上传</span>
                    <button
                      type="button"
                      onClick={() => setPending((prev) => prev.filter((_, j) => j !== i))}
                      title="移除"
                      className="shrink-0 text-faint hover:text-danger-ink transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-danger-line bg-danger-wash p-3 text-sm text-danger-ink">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-wash bg-paper flex items-center gap-2">
          {isEdit && (
            <button
              onClick={handleDelete}
              className="rounded-xl px-3 py-2 text-sm text-danger-ink hover:bg-danger-wash transition-colors"
            >
              删除
            </button>
          )}
          <button
            onClick={requestClose}
            disabled={uploading}
            className="rounded-xl px-4 py-2 text-sm text-muted hover:bg-wash transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={submit}
            disabled={uploading}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-deep disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                上传中…
              </>
            ) : (
              "保存"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
