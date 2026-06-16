import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import adminPlugin from "./eslint/plugins/admin-rules.js";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project-specific: Prisma generated client, GGA hook files
    "generated/**",
    "scripts/gga-*.mjs",
  ]),
  // Reduce severity: explicit `any` is a style preference, not a correctness issue
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Admin-specific rules
  {
    files: ["src/components/admin/**", "src/app/(admin)/**"],
    plugins: {
      "@admin": adminPlugin,
    },
    rules: {
      "@admin/no-hardcoded-colors": "warn",
      "@admin/no-hardcoded-colors-in-states": "warn",
      "@admin/no-raw-classname-in-admin": "warn",
      "@admin/no-var-color-outside-tokens": "warn",
      "@admin/no-window-alert": "warn",
    },
  },
]);

export default eslintConfig;
