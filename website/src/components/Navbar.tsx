// 作者 Toylog | 版本 1.0.0
// 功能概述：站点顶部导航栏（品牌 + 栏目导航 + 同步工具区）
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Settings, CloudOff, CloudDownload, CloudUpload, Upload, Loader2, RefreshCw } from "lucide-react";
import { useTaskStore } from "@/store/tasks";
import { timeAgo } from "@/lib/github";
import TokenSetup from "./TokenSetup";
import PushHistory from "./PushHistory";

function ClearCacheButton() {
  const [spinning, setSpinning] = useState(false);
  const handleClick = () => {
    if (spinning) return;
    const ok = confirm("清空本地缓存 + 重新从 GitHub 拉取最新数据？");
    if (!ok) return;
    setSpinning(true);
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    setTimeout(() => location.reload(), 200);
  };
  return (
    <button
      onClick={handleClick}
      title="清空本地缓存 + 重新拉取"
      className="inline-flex items-center justify-center p-2 rounded-full text-[#6b6560] hover:text-[#1a1a1a] hover:bg-[#f0ece4] transition-colors"
    >
      <RefreshCw size={15} className={spinning ? "animate-spin" : ""} />
    </button>
  );
}

const navLinks = [
  { to: "/", label: "首页" },
  { to: "/tasks", label: "任务" },
  { to: "/students", label: "成员" },
  { to: "/achievements", label: "成果" },
  { to: "/meetings", label: "组会" },
];

function CommitButton() {
  const dirtyCount = useTaskStore((s) => s.dirtyTaskIds.length + s.dirtyMembers.length + (s.dirtyAdvisor ? 1 : 0));
  const isPushing = useTaskStore((s) => s.isPushing);
  const syncStatus = useTaskStore((s) => s.syncStatus);
  const pushAll = useTaskStore((s) => s.pushAll);

  if (dirtyCount === 0) return null;

  const isError = syncStatus === "error";

  return (
    <button
      onClick={() => pushAll()}
      disabled={isPushing}
      title={isError ? `上次失败，点重试提交 ${dirtyCount} 项` : `提交 ${dirtyCount} 项未同步的改动`}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm transition-all ${
        isError
          ? "bg-red-600 text-white hover:bg-red-700"
          : "bg-amber-500 text-white hover:bg-amber-600"
      } disabled:opacity-70`}
    >
      {isPushing ? (
        <>
          <Loader2 size={13} className="animate-spin" />
          提交中…
        </>
      ) : (
        <>
          <Upload size={13} />
          提交 {dirtyCount} 项
        </>
      )}
    </button>
  );
}

function SyncIndicator() {
  const syncStatus = useTaskStore((s) => s.syncStatus);
  const lastSyncedAt = useTaskStore((s) => s.lastSyncedAt);
  const syncError = useTaskStore((s) => s.syncError);
  const ghToken = useTaskStore((s) => s.ghToken);
  const rateLimitResetAt = useTaskStore((s) => s.rateLimitResetAt);
  const pullNow = useTaskStore((s) => s.pullNow);
  const dirtyCount = useTaskStore((s) => s.dirtyTaskIds.length + s.dirtyMembers.length + (s.dirtyAdvisor ? 1 : 0));
  const [, setTick] = useState(0);
  // 每秒刷新倒计时
  useEffect(() => {
    if (!rateLimitResetAt) return;
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [rateLimitResetAt]);

  const countdown = (() => {
    if (!rateLimitResetAt) return null;
    const left = Math.max(0, Math.ceil((rateLimitResetAt - Date.now()) / 1000));
    if (left === 0) return "现在可重试";
    if (left < 60) return `${left}秒后可重试`;
    return `${Math.ceil(left / 60)}分钟${left % 60}秒后可重试`;
  })();

  const config = (() => {
    if (!ghToken) {
      return { color: "bg-[#9a9590]", icon: CloudOff, label: "未配置", title: "未配置 PAT（只读），点击设置" };
    }
    if (dirtyCount > 0) {
      return { color: "bg-amber-500", icon: Upload, label: `未提交 ${dirtyCount}`, title: `${dirtyCount} 项本地改动未同步到 GitHub` };
    }
    if (syncStatus === "pulling") {
      return { color: "bg-amber-500 animate-pulse", icon: CloudDownload, label: "拉取", title: "拉取中…" };
    }
    if (syncStatus === "pushing") {
      return { color: "bg-amber-500 animate-pulse", icon: CloudUpload, label: "推送", title: "推送中…" };
    }
    if (syncStatus === "error") {
      const errorMsg = countdown ?? syncError ?? "同步失败";
      return { color: "bg-red-500", icon: CloudOff, label: countdown ? "限速" : "失败", title: `同步失败：${errorMsg}` };
    }
    return { color: "bg-green-500", icon: CloudDownload, label: timeAgo(lastSyncedAt), title: `已同步 · ${timeAgo(lastSyncedAt)}` };
  })();

  const Icon = config.icon;

  return (
    <button
      onClick={() => pullNow()}
      title={config.title}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-[#6b6560] hover:bg-[#f0ece4] transition-colors"
    >
      <span className={`h-2 w-2 rounded-full ${config.color}`} />
      <Icon size={14} className="text-[#6b6560]" />
      <span className="hidden lg:inline whitespace-nowrap">{config.label}</span>
    </button>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tokenOpen, setTokenOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#faf9f5]/80 backdrop-blur-lg border-b border-[#e8e4db] relative w-full">
        <div className="w-full px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16 gap-6">
            {/* 左：品牌（贴左） */}
            <Link
              to="/"
              className="flex items-center gap-2.5 shrink-0 group"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#c96442] to-[#e08a63] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <span className="text-white font-serif font-bold text-base">R</span>
              </div>
              <span className="hidden sm:inline text-base font-serif font-bold text-[#1a1a1a] tracking-wide group-hover:text-[#c96442] transition-colors">
                Rising Sun
              </span>
            </Link>

            {/* 中：栏目导航（grid 第 2 列 = 整个 nav 水平正中央） */}
            <div className="hidden md:flex items-center justify-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? "bg-[#c96442] text-white shadow-sm"
                        : "text-[#6b6560] hover:text-[#1a1a1a] hover:bg-[#f0ece4]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* 右：工具区（推至最右） */}
            <div className="flex items-center justify-end gap-1">
              <CommitButton />
              <div className="hidden md:block w-px h-6 bg-[#e8e4db] mx-1" />
              <SyncIndicator />
              <PushHistory />
              <ClearCacheButton />
              <button
                onClick={() => setTokenOpen(true)}
                title="GitHub 同步设置"
                className="inline-flex items-center justify-center h-8 w-8 rounded-full text-[#6b6560] hover:text-[#1a1a1a] hover:bg-[#f0ece4] transition-colors"
              >
                <Settings size={16} />
              </button>
            </div>
            <button className="md:hidden text-[#6b6560] hover:text-[#1a1a1a] transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-[#e8e4db] bg-[#faf9f5]/95 backdrop-blur-lg">
            <div className="px-4 py-2 space-y-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? "bg-[#c96442] text-white" : "text-[#6b6560] hover:text-[#1a1a1a] hover:bg-[#f0ece4]"}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="flex items-center gap-2 px-4 py-2 border-t border-[#f0ece4] mt-2 pt-3 flex-wrap">
                <CommitButton />
                <SyncIndicator />
                <PushHistory />
                <button
                  onClick={() => { setMobileOpen(false); setTokenOpen(true); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#6b6560] hover:bg-[#f0ece4] transition-colors"
                >
                  <Settings size={13} />
                  同步设置
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      <TokenSetup open={tokenOpen} onClose={() => setTokenOpen(false)} />
    </>
  );
}