import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      // 日本語フォントのサポート強化
      fontFamily: {
        'japanese': [
          '"Hiragino Kaku Gothic ProN"',
          '"ヒラギノ角ゴ ProN W3"',
          '"Hiragino Sans"',
          '"メイリオ"',
          'Meiryo',
          '"MS PGothic"',
          'sans-serif'
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
