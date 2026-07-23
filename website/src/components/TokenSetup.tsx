import { useEffect, useState } from "react";
import { X, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound, ExternalLink, Shield } from "lucide-react";
import { useTaskStore } from "@/store/tasks";
import { testToken } from "@/lib/github";

interface TokenSetupProps {
  open: boolean;
  onClose: () => void;
}

export default function TokenSetup({ open, onClose }: TokenSetupProps) {
  const storedToken = useTaskStore((s) => s.ghToken);
  const setToken = useTaskStore((s) => s.setToken);
  const clearToken = useTaskStore((s) => s.clearToken);
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
      setValue(storedToken);
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
    setToken(value);
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
    clearToken();
    setValue("");
    setTestResult(null);
    setSaved(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl bg-white border border-[#e8e4db] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0ece4]">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-[#c96442] text-white">
              <KeyRound size={14} />
            </div>
            <h2 className="font-serif text-lg font-bold text-[#1a1a1a]">GitHub 同步设置</h2>
          </div>
          <button onClick={onClose} className="text-[#9a9590] hover:text-[#1a1a1a] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl bg-[#faf9f5] border border-[#e8e4db] p-3.5 text-xs text-[#4a4540] leading-relaxed">
            <div className="flex items-start gap-2">
              <Shield size={14} className="text-[#c96442] mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-[#1a1a1a] mb-1">需要 GitHub 协作者权限</p>
                <p>输入 PAT 后才能修改任务。PAT 仅保存在<strong>本浏览器</strong>，不上传任何服务器。</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">Personal Access Token</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx 或 github_pat_xxxx"
                className="w-full rounded-xl border border-[#e8e4db] bg-white px-3.5 py-2.5 pr-10 text-sm text-[#1a1a1a] placeholder-[#9a9590] outline-none transition-all focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/10 font-mono"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#9a9590] hover:text-[#1a1a1a] transition-colors"
                title={show ? "隐藏" : "显示"}
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <a
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-[#c96442] hover:text-[#b5573a] transition-colors"
            >
              <ExternalLink size={11} />
              创建 Fine-grained PAT（仅勾选 Contents: Read & write）
            </a>
          </div>

          {/* 测试结果 */}
          {testResult && (
            <div className={`rounded-xl border p-3 text-sm ${testResult.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
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
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            </div>
          )}

          {saved && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>已保存，正在拉取最新数据…</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#f0ece4] bg-[#faf9f5] flex flex-wrap items-center gap-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="rounded-xl border border-[#e8e4db] bg-white px-4 py-2 text-sm font-medium text-[#1a1a1a] transition-all hover:border-[#c96442]/40 hover:text-[#c96442] disabled:opacity-50"
          >
            {testing ? "测试中…" : "测试连接"}
          </button>
          <button
            onClick={handleSave}
            className="ml-auto rounded-xl bg-[#c96442] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#b5573a]"
          >
            保存
          </button>
          {storedToken && (
            <button
              onClick={handleClear}
              className="rounded-xl px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              清除
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
