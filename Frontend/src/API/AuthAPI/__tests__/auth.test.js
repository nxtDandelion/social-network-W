import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { responseLog, responseReg, logout } from '../auth';
import { errorHandler } from '../../errorsHandler';
import { API_BASE_URL } from '../../../config'; // Импортируем реальный URL

// Мокаем зависимости
vi.mock('axios');
vi.mock('../../errorsHandler');

describe('Auth Module - BRANCH COVERAGE', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('responseLog', () => {
        it('возвращает success:true при успешном запросе', async () => {
            const mockResponse = { data: { token: '123', user: { id: 1 } } };
            axios.post.mockResolvedValue(mockResponse);

            const result = await responseLog('testuser', 'password123');

            expect(result).toEqual({ success: true, data: mockResponse.data });

            // Используем expect.any(String) или реальный URL из конфига
            expect(axios.post).toHaveBeenCalledWith(
                `${API_BASE_URL}/auth/login`, // Теперь используем реальный URL
                {
                    login: 'testuser',
                    password: 'password123',
                    ip: 'string'
                }
            );

            expect(errorHandler).not.toHaveBeenCalled();
        });

        it('вызывает errorHandler при ошибке запроса', async () => {
            const mockError = new Error('Network Error');
            axios.post.mockRejectedValue(mockError);

            // ПРАВИЛЬНЫЙ мок для функции
            errorHandler.mockImplementation(() => ({
                success: false,
                message: 'Ошибка авторизации'
            }));

            const result = await responseLog('testuser', 'wrongpass');

            expect(errorHandler).toHaveBeenCalledWith(mockError, 'Авторизация:');
            expect(result).toEqual({ success: false, message: 'Ошибка авторизации' });
        });

        it('передает в errorHandler правильный префикс', async () => {
            const mockError = { response: { status: 401 } };
            axios.post.mockRejectedValue(mockError);

            // ПРАВИЛЬНЫЙ мок
            errorHandler.mockImplementation(() => ({
                success: false,
                message: 'Неверный логин или пароль'
            }));

            await responseLog('testuser', 'wrongpass');

            expect(errorHandler).toHaveBeenCalledWith(mockError, 'Авторизация:');
        });
    });

    describe('responseReg', () => {
        it('возвращает success:true при успешной регистрации', async () => {
            const mockResponse = { data: { id: 1, login: 'newuser' } };
            axios.post.mockResolvedValue(mockResponse);

            const result = await responseReg(
                'newuser',
                'New User',
                'new@mail.com',
                'password123'
            );

            expect(result).toEqual({ success: true, data: mockResponse.data });

            // Используем реальный URL
            expect(axios.post).toHaveBeenCalledWith(
                `${API_BASE_URL}/auth/register`,
                {
                    username: 'New User',
                    email: 'new@mail.com',
                    login: 'newuser',
                    role: 'user',
                    password: 'password123'
                }
            );
        });

        it('вызывает errorHandler при ошибке регистрации', async () => {
            const mockError = { response: { status: 409, data: { message: 'User exists' } } };
            axios.post.mockRejectedValue(mockError);

            // ПРАВИЛЬНЫЙ мок
            errorHandler.mockImplementation(() => ({
                success: false,
                message: 'Пользователь уже существует'
            }));

            const result = await responseReg(
                'existinguser',
                'Existing',
                'existing@mail.com',
                'pass123'
            );

            expect(errorHandler).toHaveBeenCalledWith(mockError, 'Регистрация:');
            expect(result).toEqual({ success: false, message: 'Пользователь уже существует' });
        });
    });

    describe('logout', () => {
        it('очищает localStorage при выходе', () => {
            localStorage.setItem('token', '123');
            localStorage.setItem('user', 'test');

            logout();

            expect(localStorage.getItem('token')).toBeNull();
            expect(localStorage.getItem('user')).toBeNull();
        });

        it('не падает если localStorage пустой', () => {
            expect(() => logout()).not.toThrow();
        });
    });
});