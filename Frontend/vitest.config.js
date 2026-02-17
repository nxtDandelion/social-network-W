import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true, // Это позволит использовать describe, it, expect без импорта
        environment: 'jsdom',
        setupFiles: './src/setupVitest.js',
        css: false,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/setupVitest.js',
                '**/*.test.jsx',
                '**/*.config.js',
                '**/main.jsx',
            ],
        },
    },
});