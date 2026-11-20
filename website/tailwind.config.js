/** @type {import('tailwindcss').Config} */
// 设计令牌（Design Tokens）
// ---------------------------------------------------------------------------
// 整套站点只用一套暖色编辑风格（warm editorial）：奶油纸底 + 赤陶强调色 + 宋体标题。
// 所有页面/组件统一引用语义 token，不再散落 [#hex] 硬编码，改一处即全站生效。
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        // —— 品牌强调色（赤陶色，Rising Sun 的主色）——
        accent: {
          DEFAULT: "#c96442",
          deep: "#a94a2c",
          wash: "#fbede6",
          line: "#f0cfc0",
        },

        // —— 纸面层级（由浅到深，构成页面与卡片的底）——
        paper: "#fbfaf7", // 卡片 / 浮起表面
        canvas: "#f6f3ed", // 页面底色
        wash: "#f2eee7", // 浅色凹槽 / 分区底面 / 柔和分隔

        // —— 描边 ——
        line: "#e7e2d8", // 常规边框
        "line-strong": "#cfc8bd", // 强边框 / 占位图形

        // —— 文字墨色（暖调中性灰，对比度较旧版提升）——
        ink: "#1b1a18", // 标题
        "body-strong": "#413b36", // 正文重点
        muted: "#605a54", // 次要文字
        faint: "#8b847d", // 弱化文字 / 占位符

        // —— 状态色（低饱和，贴合暖色纸感）——
        danger: {
          wash: "#fdf2ee",
          line: "#ecc0b2",
          ink: "#9c3f25",
        },
        success: {
          wash: "#eef6ee",
          line: "#bfe0bf",
          ink: "#3d7a3d",
        },
        warning: {
          wash: "#fbf3e4",
          line: "#ecd9ae",
          ink: "#8a6320",
        },
        info: {
          wash: "#eef2f8",
          line: "#c2d0e4",
          ink: "#3d5878",
        },

        // —— 兼容旧别名（保留，避免任何遗漏引用失效）——
        primary: "#c96442",
        "primary-light": "#fbede6",
        "primary-dark": "#a94a2c",
        surface: "#fbfaf7",
        "surface-alt": "#f2eee7",
        border: "#e7e2d8",
        heading: "#1b1a18",
        body: "#413b36",
      },

      fontFamily: {
        serif: ['"Noto Serif SC"', "serif"],
        sans: ['"Noto Sans SC"', "sans-serif"],
      },

      // 统一的圆角系统：卡片 16 / 控件 12 / 徽标 8
      borderRadius: {
        card: "1rem",
        control: "0.75rem",
        tag: "0.5rem",
      },

      // 克制的阴影：只用暖色低透明度的柔光，不用冷灰重投影
      boxShadow: {
        soft: "0 1px 2px rgba(60, 46, 36, 0.04), 0 4px 16px rgba(60, 46, 36, 0.05)",
        lift: "0 2px 4px rgba(60, 46, 36, 0.05), 0 12px 32px rgba(60, 46, 36, 0.09)",
        brand: "0 6px 20px rgba(201, 100, 66, 0.22)",
      },

      letterSpacing: {
        heading: "-0.01em",
        wider2: "0.14em",
      },

      animation: {
        fadeInUp: "fadeInUp 0.6s ease-out forwards",
        "pulse-dot": "pulseDot 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        rise: "rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
