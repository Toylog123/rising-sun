/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: "#c96442",
        "primary-light": "#fdf0eb",
        "primary-dark": "#b5573a",
        surface: "#faf9f5",
        "surface-alt": "#f5f2eb",
        border: "#e8e4db",
        heading: "#1a1a1a",
        body: "#374151",
        muted: "#6b6560",
        "muted-light": "#9a9590",
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "serif"],
        sans: ['"Noto Sans SC"', "sans-serif"],
      },
      animation: {
        fadeInUp: "fadeInUp 0.6s ease-out forwards",
        "pulse-dot": "pulseDot 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
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
      },
    },
  },
  plugins: [],
};
