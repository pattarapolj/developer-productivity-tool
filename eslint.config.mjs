import js from "@eslint/js";
import next from "eslint-config-next";

const config = [
    {
        ignores: [
            "**/node_modules/**",
            "**/.next/**",
            "**/out/**",
            "**/build/**",
            "pnpm-lock.yaml",
        ],
    },
    js.configs.recommended,
    ...next,
];

export default config;
