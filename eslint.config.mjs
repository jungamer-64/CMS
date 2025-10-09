import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Disable compatibility rules for modern ES2015+ features and React 17+ JSX
  {
    rules: {
      'no-restricted-syntax': 'off', // Allow ES2015+ syntax
      'no-restricted-globals': 'off', // Allow ES2020+ Intl APIs (Intl.RelativeTimeFormat, etc.)
      'react/react-in-jsx-scope': 'off', // React 17+ automatic JSX transform
      'no-async-promise-executor': 'off', // Allow async functions (required for Next.js 15 + Node 18+)
      '@typescript-eslint/strict-boolean-expressions': 'off', // Allow idiomatic JavaScript truthiness checks
    },
  },
  // Treat scripts/ as node scripts
  {
    files: ["scripts/**"],
    languageOptions: {
      env: {
        node: true,
      },
    },
  },
];

export default eslintConfig;
