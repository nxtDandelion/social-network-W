import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
    cleanup();
    vi.clearAllMocks();

    // Сбрасываем localStorage
    if (global.localStorage) {
        global.localStorage.clear();
    }
});

// Создаем полноценный мок для localStorage
const createLocalStorageMock = () => {
    let store = {};

    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        key: vi.fn((index) => Object.keys(store)[index] || null),
        get length() {
            return Object.keys(store).length;
        }
    };
};

// Устанавливаем мок localStorage
global.localStorage = createLocalStorageMock();

// Мок для IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Мок для window.location
Object.defineProperty(window, 'location', {
    value: {
        pathname: '/',
        search: '',
        hash: '',
        href: '',
        assign: vi.fn(),
        replace: vi.fn(),
        reload: vi.fn(),
    },
    writable: true,
});

// Мок для URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();