/**
 * PostCSS Configuration for Tailwind CSS v4
 *
 * v4では @import "tailwindcss" を使用するため、
 * postcss-import プラグインが必要です
 */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}
  }
};

export default config;
