import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        // forks pool is required so that worker processes inherit env vars set in globalSetup.
        pool: 'forks',
        globalSetup: ['./tests/global-setup.ts'],
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.test.ts'],
        // Give testcontainer-backed tests enough time to spin up.
        testTimeout: 30_000,
        coverage: {
            provider: 'v8',
            include: ['lib/**/*.ts'],
            exclude: ['lib/db/**', 'lib/services/**'],
            reporter: ['text', 'html', 'json-summary'],
            reportsDirectory: './coverage',
            thresholds: {
                lines: 70,
                functions: 70,
                branches: 60,
                statements: 70,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
});
