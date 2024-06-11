import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["src/**/*.js", "src/**/*.ts"],
    languageOptions: {
      globals: globals.node,
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      js: pluginJs,
    },
    rules: {
      ...pluginJs.configs.all.rules,
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs.strict.rules,
      ...tseslint.configs.stylistic.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "sort-keys": "off",
      "require-await": "off",
      "sort-imports": "off",
      "no-magic-numbers": "off",
      "id-length": "off",
      "class-methods-use-this": "off",
      "no-ternary": "off",
      "one-var": "off",
      "@typescript-eslint/array-type": ["warn", { default: "generic" }],
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": ["error"],
    },
  },
  {
    // Override configuration for test files
    files: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    languageOptions: {
      globals: globals.node,
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      js: pluginJs,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
