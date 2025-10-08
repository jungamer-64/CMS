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
      'react/react-in-jsx-scope': 'off', // React 17+ automatic JSX transform
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
