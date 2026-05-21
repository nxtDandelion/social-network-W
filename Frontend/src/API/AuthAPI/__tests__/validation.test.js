import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    loginValid,
    userNameValid,
    passwordValid,
    emailValid,
    lenghtCheck
} from '../validation';

describe('Validation Functions', () => {

    describe('loginValid (5 ветвлений)', () => {
        it('возвращает ошибку при пустом логине', () => {
            expect(loginValid('')).toEqual({
                isValid: false,
                message: 'Поле логина должны быть заполнены'
            });
            expect(loginValid(null)).toEqual({
                isValid: false,
                message: 'Поле логина должны быть заполнены'
            });
            expect(loginValid(undefined)).toEqual({
                isValid: false,
                message: 'Поле логина должны быть заполнены'
            });
        });

        it('возвращает ошибку при логине меньше 3 символов', () => {
            expect(loginValid('ab')).toEqual({
                isValid: false,
                message: 'Логин: минимум 3 символа'
            });
        });

        it('возвращает ошибку при логине больше 24 символов', () => {
            expect(loginValid('a'.repeat(25))).toEqual({
                isValid: false,
                message: 'Логин содержит слишком много символов'
            });
        });

        it('возвращает ошибку при недопустимых символах', () => {
            expect(loginValid('user@name')).toEqual({
                isValid: false,
                message: 'Логин содержит недопустимые символы'
            });
            expect(loginValid('user-name')).toEqual({
                isValid: false,
                message: 'Логин содержит недопустимые символы'
            });
            expect(loginValid('user name')).toEqual({
                isValid: false,
                message: 'Логин содержит недопустимые символы'
            });
        });

        it('возвращает успех при корректном логине', () => {
            expect(loginValid('valid_user_123')).toEqual({
                isValid: true,
                message: 'Логин корректный'
            });
        });
    });

    describe('userNameValid (5 ветвлений)', () => {
        it('возвращает ошибку при пустом имени', () => {
            expect(userNameValid('')).toEqual({
                isValid: false,
                message: 'Поле имени должно быть заполнены'
            });
            expect(userNameValid(null)).toEqual({
                isValid: false,
                message: 'Поле имени должно быть заполнены'
            });
            expect(userNameValid(undefined)).toEqual({
                isValid: false,
                message: 'Поле имени должно быть заполнены'
            });
        });

        it('возвращает ошибку при имени меньше 3 символов', () => {
            expect(userNameValid('Jo')).toEqual({
                isValid: false,
                message: 'Имя пользователя: минимум 3 символа'
            });
        });

        it('возвращает ошибку при имени больше 24 символов', () => {
            expect(userNameValid('J'.repeat(25))).toEqual({
                isValid: false,
                message: 'Имя содержит слишком много символов'
            });
        });

        it('возвращает ошибку при недопустимых символах в имени', () => {
            expect(userNameValid('John@Doe')).toEqual({
                isValid: false,
                message: 'Имя содержит недопустимые символы'
            });
            expect(userNameValid('John-Doe')).toEqual({
                isValid: false,
                message: 'Имя содержит недопустимые символы'
            });
            expect(userNameValid('John Doe')).toEqual({
                isValid: false,
                message: 'Имя содержит недопустимые символы'
            });
        });

        it('возвращает успех при корректном имени', () => {
            expect(userNameValid('John_Doe_123')).toEqual({
                isValid: true,
                message: 'Имя пользователя корректное'
            });
        });
    });

    describe('passwordValid (5 ветвлений)', () => {
        it('возвращает ошибку при пустом пароле', () => {
            expect(passwordValid('')).toEqual({
                isValid: false,
                message: 'Поле пароля должны быть заполнены'
            });
            expect(passwordValid(null)).toEqual({
                isValid: false,
                message: 'Поле пароля должны быть заполнены'
            });
            expect(passwordValid(undefined)).toEqual({
                isValid: false,
                message: 'Поле пароля должны быть заполнены'
            });
        });

        it('возвращает ошибку при пароле меньше 8 символов', () => {
            expect(passwordValid('pass123')).toEqual({
                isValid: false,
                message: 'Пароль: минимум 8 символов'
            });
        });

        it('возвращает ошибку при недопустимых символах в пароле', () => {
            expect(passwordValid('password<>')).toEqual({
                isValid: false,
                message: 'Пароль содержит недопустимые символы'
            });
            expect(passwordValid('password[]')).toEqual({
                isValid: false,
                message: 'Пароль содержит недопустимые символы'
            });
            expect(passwordValid('password{}')).toEqual({
                isValid: false,
                message: 'Пароль содержит недопустимые символы'
            });
        });

        it('возвращает ошибку при пароле больше 24 символов', () => {
            expect(passwordValid('p'.repeat(25))).toEqual({
                isValid: false,
                message: 'Пароль содержит слишком много символов'
            });
        });

        it('возвращает успех при корректном пароле', () => {
            expect(passwordValid('ValidPass123!@#')).toEqual({
                isValid: true,
                message: 'Пароль корректный'
            });
            expect(passwordValid('Another$Valid*789')).toEqual({
                isValid: true,
                message: 'Пароль корректный'
            });
        });
    });

    describe('emailValid (4 ветвления)', () => {
        it('возвращает ошибку при пустом email', () => {
            expect(emailValid('')).toEqual({
                isValid: false,
                message: 'Поле email должно быть заполнено'
            });
            expect(emailValid(null)).toEqual({
                isValid: false,
                message: 'Поле email должно быть заполнено'
            });
            expect(emailValid(undefined)).toEqual({
                isValid: false,
                message: 'Поле email должно быть заполнено'
            });
        });

        it('возвращает ошибку при email больше 40 символов', () => {
            const longEmail = 'very.long.email.address.that.exceeds.forty.characters@example.com';
            expect(emailValid(longEmail)).toEqual({
                isValid: false,
                message: 'Email: не более 40 символов'
            });
        });

        it('возвращает ошибку при неверном формате email', () => {
            expect(emailValid('invalid-email')).toEqual({
                isValid: false,
                message: 'Некорректный формат email'
            });
            expect(emailValid('invalid@')).toEqual({
                isValid: false,
                message: 'Некорректный формат email'
            });
            expect(emailValid('invalid@domain')).toEqual({
                isValid: false,
                message: 'Некорректный формат email'
            });
            expect(emailValid('@domain.com')).toEqual({
                isValid: false,
                message: 'Некорректный формат email'
            });
            expect(emailValid('user@.com')).toEqual({
                isValid: false,
                message: 'Некорректный формат email'
            });
        });

        it('возвращает успех при корректном email', () => {
            expect(emailValid('user@example.com')).toEqual({
                isValid: true,
                message: 'Email корректен'
            });
            expect(emailValid('user.name+tag@example.co.uk')).toEqual({
                isValid: true,
                message: 'Email корректен'
            });
        });
    });

    describe('lenghtCheck (2 ветвления) - упрощенный', () => {
        let consoleSpy;

        beforeEach(() => {
            consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        });

        afterEach(() => {
            consoleSpy.mockRestore();
        });

        it('возвращает true для непустой строки', () => {
            expect(lenghtCheck('test')).toBe(true);
            expect(lenghtCheck('hello world')).toBe(true);
            expect(lenghtCheck(' ')).toBe(true);
            expect(lenghtCheck('0')).toBe(true);
            expect(lenghtCheck('false')).toBe(true);
        });

        it('возвращает true для чисел, кроме 0', () => {
            expect(lenghtCheck(123)).toBe(true);
            expect(lenghtCheck(-42)).toBe(true);
            expect(lenghtCheck(3.14)).toBe(true);
        });

        it('возвращает false для 0', () => {
            expect(lenghtCheck(0)).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(0, 'false');
        });

        it('возвращает true для объектов', () => {
            expect(lenghtCheck({})).toBe(true);
            expect(lenghtCheck({ key: 'value' })).toBe(true);
        });

        it('возвращает false для пустой строки', () => {
            expect(lenghtCheck('')).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('', 'false');
        });

        it('возвращает false для null и undefined', () => {
            expect(lenghtCheck(null)).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(null, 'false');

            expect(lenghtCheck(undefined)).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(undefined, 'false');
        });

        it('возвращает false для false', () => {
            expect(lenghtCheck(false)).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(false, 'false');
        });

        it('возвращает true для true', () => {
            expect(lenghtCheck(true)).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith(true, 'true');
        });
    });
});