import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
    // Vendored WebGL sim — not ours to lint.
    "src/lib/fluid/fluid.js",
    // no leading slash here: eslint patterns are already relative to this
    // config, so these match the root folders only and leave src/lib/fluid alone
    "fluid/**",
    "Vid_Frame/**",
  ]),
]);

export default eslintConfig;
