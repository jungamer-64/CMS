/**
 * Tailwind CSS v4 Configuration
 * 
 * v4では、ほとんどの設定をCSSの@themeディレクティブで行います。
 * このファイルは主にcontentパスの指定のために使用します。
 * 
 * テーマ設定、カラー、フォントファミリーなどは app/globals.css を参照してください。
 */
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
