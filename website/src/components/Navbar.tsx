// 作者 Toylog | 版本 1.1.0
// 功能概述：站点顶部导航栏（品牌 logo + 栏目导航 + 同步工具区）
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
      className="icon-btn h-8 w-8"
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
  { to: "/degree-requirements", label: "学位要求" },
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
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:-translate-y-0.5 ${
        isError
          ? "bg-danger-ink text-white hover:brightness-110"
          : "bg-accent text-white hover:bg-accent-deep"
      } disabled:opacity-70 disabled:hover:translate-y-0`}
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
  const pullNotice = useTaskStore((s) => s.pullNotice);
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
      return { color: "bg-faint", icon: CloudOff, label: "未配置", title: "未配置 PAT（只读），点击设置" };
    }
    if (dirtyCount > 0) {
      return {
        color: "bg-warning-wash0",
        icon: Upload,
        label: `未提交 ${dirtyCount}`,
        title: pullNotice
          ? `${pullNotice}。点击可立即提交。`
          : `${dirtyCount} 项本地改动未同步到 GitHub`,
      };
    }
    if (syncStatus === "pulling") {
      return { color: "bg-warning-wash0 animate-pulse", icon: CloudDownload, label: "拉取", title: "拉取中…" };
    }
    if (syncStatus === "pushing") {
      return { color: "bg-warning-wash0 animate-pulse", icon: CloudUpload, label: "推送", title: "推送中…" };
    }
    if (syncStatus === "error") {
      const errorMsg = countdown ?? syncError ?? "同步失败";
      return { color: "bg-danger-wash0", icon: CloudOff, label: countdown ? "限速" : "失败", title: `同步失败：${errorMsg}` };
    }
    return { color: "bg-success-wash0", icon: CloudDownload, label: timeAgo(lastSyncedAt), title: `已同步 · ${timeAgo(lastSyncedAt)}` };
  })();

  const Icon = config.icon;

  return (
    <button
      onClick={() => pullNow()}
      title={config.title}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-muted hover:bg-wash hover:text-ink transition-colors"
    >
      <span className={`h-2 w-2 rounded-full ${config.color}`} />
      <Icon size={14} className="text-muted" />
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
      <nav className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-8">
          {/* 左：品牌。logo 自带 Rising Sun 字样，去掉多余阴影，靠干净的字标建立质感 */}
          <Link to="/" className="group flex shrink-0 items-center" aria-label="Rising Sun 首页">
            {/* BASE_URL 兼容 GitHub Pages 子路径部署（/rising-sun/） */}
            <img
              src={import.meta.env.BASE_URL + "logo.svg"}
              alt="Rising Sun"
              className="h-10 w-auto transition-transform duration-300 group-hover:scale-[1.03] sm:h-11"
            />
          </Link>

          {/* 中：栏目导航，绝对居中于整条导航栏 */}
          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={isActive ? "page" : undefined}
                  className={`chip ${isActive ? "chip-active" : "chip-idle"}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* 右：工具区，统一收进半透明的工具条里 */}
          <div className="flex items-center gap-0.5 rounded-full border border-line bg-canvas/70 p-1">
            <CommitButton />
            <div className="mx-0.5 hidden h-5 w-px bg-line lg:block" />
            <div className="hidden lg:block"><SyncIndicator /></div>
            <PushHistory />
            <ClearCacheButton />
            <button
              onClick={() => setTokenOpen(true)}
              title="GitHub 同步设置"
              className="icon-btn h-8 w-8"
            >
              <Settings size={16} />
            </button>
          </div>
          <button
            aria-label={mobileOpen ? "关闭菜单" : "打开菜单"}
            className="icon-btn h-9 w-9 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="animate-rise border-t border-line bg-paper/95 shadow-soft backdrop-blur-xl md:hidden">
            <div className="mx-auto max-w-[1400px] space-y-1 px-5 py-3 sm:px-8">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center rounded-control px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive ? "bg-accent text-white shadow-sm" : "text-muted hover:bg-wash hover:text-ink"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line px-1 pt-3">
                <CommitButton />
                <SyncIndicator />
                <PushHistory />
                <button
                  onClick={() => { setMobileOpen(false); setTokenOpen(true); }}
                  className="chip chip-idle !px-3 !py-1.5 !text-xs"
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