import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      /**
       * 日本語フォントのサポート強化
       * 'font-japanese' で利用可能
       */
      fontFamily: {
        japanese: [
          '"Hiragino Kaku Gothic ProN"',
          '"ヒラギノ角ゴ ProN W3"',
          '"Hiragino Sans"',
          '"メイリオ"',
          '"MS PGothic"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
