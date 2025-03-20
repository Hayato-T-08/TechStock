import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const nextConfig = compat.extends("next/core-web-vitals", "next/typescript");

const frontendSpecificConfig = [
  {
    files: ["**/*.{js,mjs,ts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
    },
  },
];

// 明示的にルールをオーバーライド
const overrideRules = {
  ignores: ["node_modules/**/*"],
  rules: {
    "react/react-in-jsx-scope": "off",
  },
};

export default [
  ...nextConfig,
  ...frontendSpecificConfig,
  overrideRules,
];
