import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
export default defineConfig([
  ...nextVitals, ...nextTs,
  // Existing integration code uses untyped provider results; report without redesigning it.
  { rules: { '@typescript-eslint/no-explicit-any': 'warn', '@typescript-eslint/no-unused-vars': 'warn' } },
  { files: ['scripts/**/*.cjs', 'tests/Marketplace.test.ts'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  globalIgnores(['.next/**', 'node_modules/**', 'artifacts/**', 'cache/**', 'typechain-types/**', 'next-env.d.ts']),
]);
