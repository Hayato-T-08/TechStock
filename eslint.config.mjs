import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import globals from "globals";
import tseslint from "typescript-eslint";

// 基本設定（共通ルール）
const baseConfig = [
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    ignores: ["**/node_modules/**", "**/dist/**", "**/build/**"],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];

// フロントエンド固有の設定
const frontendConfig = [
  {
    files: ["frontend/**/*.{js,mjs,ts,mts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  pluginReact.configs.flat.recommended,
];

// バックエンド固有の設定
const backendConfig = [
  {
    files: ["backend/**/*.{js,mjs,ts,mts}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // バックエンド固有のルール
      "no-console": "off", // バックエンドでのコンソール出力を許可
    },
  },
];

// すべての設定をエクスポート
export default [
  ...baseConfig,
  ...frontendConfig,
  ...backendConfig,
];