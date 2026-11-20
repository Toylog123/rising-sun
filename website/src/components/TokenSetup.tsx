import { useEffect, useState } from "react";
import { X, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound, ExternalLink, Shield } from "lucide-react";
import { useTaskStore } from "@/store/tasks";
import { testToken } from "@/lib/github";
import { getSharedToken, setSharedToken, clearSharedToken } from "@/lib/auth";

interface TokenSetupProps {
  open: boolean;
  onClose: () => void;
}

export default function TokenSetup({ open, onClose }: TokenSetupProps) {
  const storedToken = useTaskStore((s) => s.ghToken);
  const pull = useTaskStore((s) => s.pull);

  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; user?: string } | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // 打开时初始化输入框
  useEffect(() => {
    if (open) {
      setValue(getSharedToken() || storedToken);
      setTestResult(null);
      setError("");
      setSaved(false);
    }
  }, [open, storedToken]);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = async () => {
    if (!value.trim()) {
      setError("请输入 PAT");
      return;
    }
    setError("");
    // 写入共享 PAT，tasks / meetings / achievements 三个 store 都会收到
    setSharedToken(value);
    setSaved(true);
    // 保存后自动拉取一次
    setTimeout(() => pull(), 100);
  };

  const handleTest = async () => {
    if (!value.trim()) {
      setError("请先输入 PAT");
      return;
    }
    setTesting(true);
    setError("");
    setTestResult(null);
    try {
      const res = await testToken(value.trim());
      setTestResult(res);
      if (!res.ok) setError("PAT 无效或格式错误");
    } catch (e) {
      setError(e instanceof Error ? e.message : "测试失败");
    } finally {
      setTesting(false);
    }
  };

  const handleClear = () => {
    if (!confirm("确定清除 PAT？清除后只能只读浏览，无法推送。")) return;
    clearSharedToken();
    setValue("");
    setTestResult(null);
    setSaved(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl bg-paper border border-line shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-wash">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-accent text-white">
              <KeyRound size={14} />
            </div>
            <h2 className="font-serif text-lg font-bold text-ink">GitHub 同步设置</h2>
          </div>
          <button onClick={onClose} className="text-faint hover:text-ink transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl bg-paper border border-line p-3.5 text-xs text-body-strong leading-relaxed">
            <div className="flex items-start gap-2">
              <Shield size={14} className="text-accent mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-ink mb-1">需要 GitHub 协作者权限</p>
                <p>输入 PAT 后才能修改任务。PAT 仅保存在<strong>本浏览器</strong>，不上传任何服务器。</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Personal Access Token</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx 或 github_pat_xxxx"
                className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 pr-10 text-sm text-ink placeholder-faint outline-none transition-all focus:border-accent/40 focus:ring-2 focus:ring-accent/10 font-mono"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-faint hover:text-ink transition-colors"
                title={show ? "隐藏" : "显示"}
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <a
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-accent hover:text-accent-deep transition-colors"
            >
              <ExternalLink size={11} />
              创建 Fine-grained PAT（仅勾选 Contents: Read & write）
            </a>
          </div>

          {/* 测试结果 */}
          {testResult && (
            <div className={`rounded-xl border p-3 text-sm ${testResult.ok ? "bg-success-wash border-success-line text-success-ink" : "bg-danger-wash border-danger-line text-danger-ink"}`}>
              <div className="flex items-center gap-2">
                {testResult.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>
                  {testResult.ok
                    ? `验证成功：GitHub 用户 ${testResult.user} 可访问`
                    : "PAT 验证失败"}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-danger-line bg-danger-wash p-3 text-sm text-danger-ink">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            </div>
          )}

          {saved && (
            <div className="rounded-xl border border-success-line bg-success-wash p-3 text-sm text-success-ink">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>已保存，正在拉取最新数据…</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-wash bg-paper flex flex-wrap items-center gap-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="rounded-xl border border-line bg-paper px-4 py-2 text-sm font-medium text-ink transition-all hover:border-accent/40 hover:text-accent disabled:opacity-50"
          >
            {testing ? "测试中…" : "测试连接"}
          </button>
          <button
            onClick={handleSave}
            className="ml-auto rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-deep"
          >
            保存
          </button>
          {storedToken && (
            <button
              onClick={handleClear}
              className="rounded-xl px-4 py-2 text-sm text-danger-ink hover:bg-danger-wash transition-colors"
            >
              清除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
