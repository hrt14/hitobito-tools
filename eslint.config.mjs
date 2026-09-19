import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // The minutes page hydrates persisted transcripts and browser speech support
  // after SSR, as the existing EarHub client does. Scope the exception narrowly.
  {
    files: ["app/ear-hub/MinutesPage.tsx"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
