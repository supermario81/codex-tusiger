import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        crypto: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        HTMLInputElement: "readonly",
        BeforeUnloadEvent: "readonly",
        GeolocationPosition: "readonly",
        GeolocationPositionError: "readonly"
      }
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "off"
    }
  }
);
