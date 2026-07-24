export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative bg-[#faf9f5] mt-auto">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c96442]/20 to-transparent" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-1">
        <p className="text-center text-xs text-[#9a9590]">
          © {year} Rising Sun 课题组 · 芯片设计自动化（EDA）
        </p>
        <p className="text-center text-xs text-[#9a9590]">
          网站负责人：佟亚龙 · 联系方式：<a href="tel:15897537919" className="hover:text-[#c96442] transition-colors">15897537919</a>
        </p>
      </div>
    </footer>
  );
}
