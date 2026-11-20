export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-auto border-t border-line bg-paper">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-5 py-8 text-center sm:flex-row sm:justify-between sm:gap-4 sm:px-8 sm:text-left">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-tag bg-accent-wash font-serif text-sm font-bold text-accent">
            RS
          </span>
          <div>
            <p className="font-serif text-sm font-semibold text-ink">Rising Sun 课题组</p>
            <p className="text-xs text-faint">芯片设计自动化（EDA）· 成立于 2025</p>
          </div>
        </div>
        <div className="space-y-1 text-xs text-faint sm:text-right">
          <p>© {year} Rising Sun 课题组 · 保留所有权利</p>
          <p>
            网站负责人：佟亚龙 · 联系方式：
            <a href="tel:15897537919" className="font-medium text-muted transition-colors hover:text-accent">
              15897537919
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
