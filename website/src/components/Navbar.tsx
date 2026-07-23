import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Settings, CloudOff, CloudDownload, CloudUpload } from "lucide-react";
import { useTaskStore } from "@/store/tasks";
import { timeAgo } from "@/lib/github";
import TokenSetup from "./TokenSetup";

const navLinks = [
  { to: "/", label: "首页" },
  { to: "/tasks", label: "任务看板" },
  { to: "/archive", label: "归档" },
  { to: "/new", label: "新建任务" },
];

function SyncIndicator() {
  const syncStatus = useTaskStore((s) => s.syncStatus);
  const lastSyncedAt = useTaskStore((s) => s.lastSyncedAt);
  const syncError = useTaskStore((s) => s.syncError);
  const ghToken = useTaskStore((s) => s.ghToken);
  const pull = useTaskStore((s) => s.pull);

  const config = (() => {
    if (!ghToken) {
      return { color: "bg-[#9a9590]", icon: CloudOff, label: "未配置", title: "未配置 PAT（只读），点击设置" };
    }
    if (syncStatus === "pulling") {
      return { color: "bg-amber-500 animate-pulse", icon: CloudDownload, label: "拉取", title: "拉取中…" };
    }
    if (syncStatus === "pushing") {
      return { color: "bg-amber-500 animate-pulse", icon: CloudUpload, label: "推送", title: "推送中…" };
    }
    if (syncStatus === "error") {
      return { color: "bg-red-500", icon: CloudOff, label: "失败", title: `同步失败：${syncError ?? ""}` };
    }
    return { color: "bg-green-500", icon: CloudDownload, label: timeAgo(lastSyncedAt), title: `已同步 · ${timeAgo(lastSyncedAt)}` };
  })();

  const Icon = config.icon;

  return (
    <button
      onClick={() => pull()}
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
      <nav className="sticky top-0 z-50 bg-[#faf9f5]/80 backdrop-blur-lg border-b border-[#e8e4db]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="text-lg font-serif font-bold text-[#1a1a1a] tracking-wide hover:text-[#c96442] transition-colors duration-200">
              Rising Sun
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
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
            <div className="hidden md:flex items-center gap-1">
              <SyncIndicator />
              <button
                onClick={() => setTokenOpen(true)}
                title="GitHub 同步设置"
                className="inline-flex items-center justify-center p-2 rounded-full text-[#6b6560] hover:text-[#1a1a1a] hover:bg-[#f0ece4] transition-colors"
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
              <div className="flex items-center gap-2 px-4 py-2 border-t border-[#f0ece4] mt-2 pt-3">
                <SyncIndicator />
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
