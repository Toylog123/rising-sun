/**
 * HeroLogo — 课题组原创品牌徽章
 * ---------------------------------------------------------------------------
 * 设计理念：一轮赤陶色的太阳从芯片中升起，光芒与电路走线融为一体。
 *   - 「Rising Sun」→ 升起的太阳（半日 + 放射光芒）
 *   - 「芯片设计自动化 / EDA」→ 芯片封装、引脚与电路节点
 * 配色全部取自站点设计 token（赤陶 / 深赤陶 / 墨色 / 暖纸），与暖色编辑风协调。
 */

export default function HeroLogo({ className = "" }: { className?: string }) {
  // 光芒：以圆心 (120, 90) 为中心，在上方扇形区放射
  const rays = [-78, -52, -26, 0, 26, 52, 78];

  return (
    <svg
      viewBox="0 0 240 268"
      className={className}
      role="img"
      aria-label="Rising Sun 芯片设计自动化课题组标志：太阳从芯片中升起"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="rs-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F4B183" />
          <stop offset="55%" stopColor="#E8834F" />
          <stop offset="100%" stopColor="#C96442" />
        </linearGradient>
        <linearGradient id="rs-chip" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FCF7F1" />
          <stop offset="100%" stopColor="#F6E7DC" />
        </linearGradient>
      </defs>

      {/* 双环外框：实线 + 点状虚线，构建徽章轮廓 */}
      <circle cx="120" cy="90" r="82" fill="none" stroke="#C96442" strokeWidth="1.4" opacity="0.5" />
      <circle cx="120" cy="90" r="73" fill="none" stroke="#C96442" strokeWidth="1" opacity="0.28" strokeDasharray="1 6" strokeLinecap="round" />

      {/* 放射光芒 */}
      <g stroke="#E8935A" strokeWidth="2.4" strokeLinecap="round">
        {rays.map((deg) => (
          <line key={deg} x1="120" y1="50" x2="120" y2="38" transform={`rotate(${deg} 120 90)`} />
        ))}
      </g>

      {/* 升起的太阳：半圆，赤陶渐变 */}
      <path d="M92 90 A28 28 0 0 1 148 90 Z" fill="url(#rs-sun)" />

      {/* 芯片封装：主体 + 两侧引脚 + 焊盘 */}
      <g stroke="#A94A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* 引脚 */}
        <path d="M74 100 H84 M74 111 H84 M74 122 H84" />
        <path d="M156 100 H166 M156 111 H166 M156 122 H166" />
        {/* 芯片主体 */}
        <rect x="84" y="88" width="72" height="38" rx="7" fill="url(#rs-chip)" />
        {/* 中心电路 */}
        <rect x="108" y="97" width="24" height="20" rx="4" fill="#FBede6" strokeWidth="1.6" />
        <path d="M96 107 H108 M132 107 H144" strokeWidth="1.6" />
        <circle cx="120" cy="107" r="4.2" fill="#C96442" stroke="none" />
        <circle cx="94" cy="107" r="2" fill="#C96442" stroke="none" />
        <circle cx="146" cy="107" r="2" fill="#C96442" stroke="none" />
      </g>

      {/* 芯片下方延伸的电路走线与节点 */}
      <g stroke="#C96442" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.75">
        <path d="M120 126 V140 M120 140 H104 M120 140 H136" />
        <circle cx="104" cy="140" r="2.6" fill="#C96442" stroke="none" />
        <circle cx="136" cy="140" r="2.6" fill="#C96442" stroke="none" />
      </g>

      {/* 文字标牌 */}
      <text
        x="120" y="198" textAnchor="middle"
        fontFamily='"Noto Serif SC", serif' fontSize="25" fontWeight="700"
        letterSpacing="5" fill="#1B1A18"
      >
        RISING SUN
      </text>

      {/* 分隔线 + 中心菱形 */}
      <g opacity="0.6">
        <line x1="60" y1="212" x2="112" y2="212" stroke="#C96442" strokeWidth="1" />
        <line x1="128" y1="212" x2="180" y2="212" stroke="#C96442" strokeWidth="1" />
        <path d="M120 207 L124 212 L120 217 L116 212 Z" fill="#C96442" />
      </g>

      <text
        x="120" y="236" textAnchor="middle"
        fontFamily='"Noto Serif SC", serif' fontSize="12.5"
        letterSpacing="2" fill="#605A54"
      >
        芯片设计自动化课题组
      </text>

      <text
        x="120" y="256" textAnchor="middle"
        fontFamily='"Noto Sans SC", sans-serif' fontSize="9"
        letterSpacing="3" fill="#C96442" opacity="0.85"
      >
        EST. 2025 · EDA RESEARCH GROUP
      </text>
    </svg>
  );
}
