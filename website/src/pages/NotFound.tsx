import { Link } from "react-router-dom";
import { Compass, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="font-sans">
      <section className="relative overflow-hidden bg-gradient-to-br from-paper via-wash to-wash">
        <div className="paper-grain pointer-events-none absolute inset-0 opacity-[0.035]" />
        <div className="relative mx-auto max-w-5xl px-5 sm:px-8 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-accent text-white shadow-sm">
            <Compass size={26} />
          </div>
          <h1 className="mt-6 font-serif text-5xl sm:text-6xl font-bold text-ink">404</h1>
          <p className="mt-4 text-lg font-semibold text-ink">页面走丢了</p>
          <p className="mt-2 text-sm text-muted max-w-md mx-auto leading-relaxed">
            你访问的地址不存在，可能是链接输错了，或者这个栏目已经被移除。
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-deep"
            >
              <ArrowLeft size={15} />
              返回首页
            </Link>
            <Link
              to="/tasks"
              className="inline-flex items-center gap-1.5 rounded-xl bg-paper border border-line px-5 py-2.5 text-sm font-medium text-ink transition-all hover:border-accent/40 hover:shadow-sm"
            >
              去看任务
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}