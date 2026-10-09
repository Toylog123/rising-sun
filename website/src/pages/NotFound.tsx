import { Link } from "react-router-dom";
import { Compass, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="font-sans">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#faf9f5] via-[#f5f0e6] to-[#f0ece4]">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle, #c96442 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#c96442] text-white shadow-sm">
            <Compass size={26} />
          </div>
          <h1 className="mt-6 font-serif text-5xl sm:text-6xl font-bold text-[#1a1a1a]">404</h1>
          <p className="mt-4 text-lg font-semibold text-[#1a1a1a]">页面走丢了</p>
          <p className="mt-2 text-sm text-[#6b6560] max-w-md mx-auto leading-relaxed">
            你访问的地址不存在，可能是链接输错了，或者这个栏目已经被移除。
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#c96442] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#b5573a]"
            >
              <ArrowLeft size={15} />
              返回首页
            </Link>
            <Link
              to="/tasks"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-[#e8e4db] px-5 py-2.5 text-sm font-medium text-[#1a1a1a] transition-all hover:border-[#c96442]/40 hover:shadow-sm"
            >
              去看任务
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}