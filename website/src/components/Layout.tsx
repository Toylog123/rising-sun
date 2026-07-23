import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTaskStore } from "@/store/tasks";

export default function Layout() {
  const syncStatus = useTaskStore((s) => s.syncStatus);
  const pull = useTaskStore((s) => s.pull);

  // 任意页面挂载时都尝试拉取最新（首次访问 syncStatus === "idle"，避免重复）
  useEffect(() => {
    if (syncStatus === "idle") {
      pull();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f2eb]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

