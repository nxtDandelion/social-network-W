import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler, errorLog } from './errorsHandler';

describe('errorHandler - BRANCH COVERAGE (17+ ветвлений)', () => {
    const curResponse = 'Тест:';

    describe('ВЕТВЛЕНИЕ 1: error.response существует', () => {

        describe('ВЕТВЛЕНИЕ 2: status 404', () => {
            it('обрабатывает 404 ошибку', () => {
                const error = {
                    response: {
                        status: 404,
                        data: { message: 'Post not found' }
                    }
                };

                const result = errorHandler(error, curResponse);

                expect(result).toEqual({
                    success: false,
                    statusCode: 404,
                    error: 'Тест: Обьект запроса не найден.',
                    details: { message: 'Post not found' }
                });
            });
        });

        describe('ВЕТВЛЕНИЕ 3: status 422', () => {
            it('обрабатывает 422 ошибку (невалидные данные)', () => {
                const error = {
                    response: {
                        status: 422,
                        data: { field: 'email', error: 'Invalid format' }
                    }
                };

                const result = errorHandler(error, curResponse);

                expect(result).toEqual({
                    success: false,
                    statusCode: 422,
                    error: 'Тест:Не валидные данные.',
                    details: { field: 'email', error: 'Invalid format' }
                });
            });
        });

        describe('ВЕТВЛЕНИЕ 4: status 401', () => {
            it('обрабатывает 401 ошибку (токен истек)', () => {
                const error = {
                    response: {
                        status: 401,
                        data: { message: 'Token expired' }
                    }
                };

                const result = errorHandler(error, curResponse);

                expect(result).toEqual({
                    success: false,
                    statusCode: 401,
                    error: 'Тест: Срок вашего токена истек. Пожалуйста, войдите снова.',
                    details: { message: 'Token expired' }
                });
            });
        });

        describe('ВЕТВЛЕНИЕ 5: status 400', () => {

            describe('ВЕТВЛЕНИЕ 6: есть detail.code', () => {

                it('ВЕТВЛЕНИЕ 7: USERNAME_EXISTS', () => {
                    const error = {
                        response: {
                            status: 400,
                            data: {
                                detail: {
                                    code: 'USERNAME_EXISTS',
                                    message: 'Username taken'
                                }
                            }
                        }
                    };

                    const result = errorHandler(error, curResponse);

                    expect(result).toEqual({
                        custom: true,
                        statusCode: 400,
                        success: false,
                        message: 'Такое имя пользователя уже существует'
                    });
                });

                it('ВЕТВЛЕНИЕ 8: LOGIN_EXISTS', () => {
                    const error = {
                        response: {
                            status: 400,
                            data: {
                                detail: {
                                    code: 'LOGIN_EXISTS',
                                    message: 'Login taken'
                                }
                            }
                        }
                    };

                    const result = errorHandler(error, curResponse);

                    expect(result).toEqual({
                        custom: true,
                        statusCode: 400,
                        success: false,
                        message: 'Такой логин уже существует'
                    });
                });

                it('ВЕТВЛЕНИЕ 9: EMAIL_EXISTS', () => {
                    const error = {
                        response: {
                            status: 400,
                            data: {
                                detail: {
                                    code: 'EMAIL_EXISTS',
                                    message: 'Email taken'
                                }
                            }
                        }
                    };

                    const result = errorHandler(error, curResponse);

                    expect(result).toEqual({
                        custom: true,
                        statusCode: 400,
                        success: false,
                        message: 'Такой email уже существует'
                    });
                });

                it('ВЕТВЛЕНИЕ 10: default (неизвестный код)', () => {
                    const error = {
                        response: {
                            status: 400,
                            data: {
                                detail: {
                                    code: 'SOME_UNKNOWN_CODE',
                                    message: 'Something went wrong'
                                }
                            }
                        }
                    };

                    const result = errorHandler(error, curResponse);

                    expect(result).toEqual({
                        success: false,
                        statusCode: 400,
                        error: `${error.response.data}`,
                        details: error.response.data
                    });
                });
            });

            describe('ВЕТВЛЕНИЕ 11: нет detail.code (просто detail строка)', () => {

                it('ВЕТВЛЕНИЕ 12: Username already exists', () => {
                    const error = {
                        response: {
                            status: 400,
                            data: {
                                detail: 'Username already exists'
                            }
                        }
                    };

                    const result = errorHandler(error, curResponse);

                    expect(result).toEqual({
                        success: false,
                        statusCode: 400,
                        message: 'Такое имя пользователя уже существует'
                    });
                });

                it('ВЕТВЛЕНИЕ 13: Login already exists', () => {
                    const error = {
                        response: {
                            status: 400,
                            data: {
                                detail: 'Login already exists'
                            }
                        }
                    };

                    const result = errorHandler(error, curResponse);

                    expect(result).toEqual({
                        success: false,
                        statusCode: 400,
                        message: 'Такой логин уже существует'
                    });
                });

                it('ВЕТВЛЕНИЕ 14: Email already exists', () => {
                    const error = {
                        response: {
                            status: 400,
                            data: {
                                detail: 'Email already exists'
                            }
                        }
                    };

                    const result = errorHandler(error, curResponse);

                    expect(result).toEqual({
                        success: false,
                        statusCode: 400,
                        message: 'Такой email уже существует'
                    });
                });

                // ВНИМАНИЕ: Здесь потенциальный БАГ!
                // Нет default обработки для неизвестной строки detail
                // Тест покажет, что функция вернет undefined
                it(' нет обработки неизвестной строки detail', () => {
                    const error = {
                        response: {
                            status: 400,
                            data: {
                                detail: 'Some unknown error message'
                            }
                        }
                    };

                    const result = errorHandler(error, curResponse);

                    // Функция ничего не вернет (undefined) - это баг!
                    expect(result).toBeUndefined();
                });
            });
        });

        describe('ВЕТВЛЕНИЕ 16: все остальные статусы', () => {
            it('обрабатывает 500 ошибку как неизвестную', () => {
                const error = {
                    response: {
                        status: 500,
                        data: { error: 'Internal server error' }
                    }
                };

                const result = errorHandler(error, curResponse);

                expect(result).toEqual({
                    success: false,
                    statusCode: 500,
                    error: 'Тест: Неизвестная ошибка сервера',
                    details: { error: 'Internal server error' }
                });
            });

            it('обрабатывает 403 ошибку как неизвестную', () => {
                const error = {
                    response: {
                        status: 403,
                        data: { message: 'Forbidden' }
                    }
                };

                const result = errorHandler(error, curResponse);

                expect(result).toEqual({
                    success: false,
                    statusCode: 403,
                    error: 'Тест: Неизвестная ошибка сервера',
                    details: { message: 'Forbidden' }
                });
            });
        });
    });

    describe('ВЕТВЛЕНИЕ 17: ошибка сети (нет response)', () => {
        it('обрабатывает сетевую ошибку', () => {
            const error = {
                message: 'Network Error',
                config: { url: '/api/test' }
            };

            const result = errorHandler(error, curResponse);

            expect(result).toEqual({
                success: false,
                error: 'Сетевая ошибка при получении данных'
            });
        });

        it('обрабатывает ошибку без response (например, таймаут)', () => {
            const error = new Error('Request timeout');

            const result = errorHandler(error, curResponse);

            expect(result).toEqual({
                success: false,
                error: 'Сетевая ошибка при получении данных'
            });
        });
    });

    describe('errorLog (просто покрыть вызовы)', () => {
        it('логирует ошибку в консоль', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const response = {
                success: false,
                statusCode: 404,
                error: 'Not found'
            };

            errorLog(response);

            expect(consoleSpy).toHaveBeenCalledTimes(3);
            expect(consoleSpy).toHaveBeenCalledWith('Not found');
            expect(consoleSpy).toHaveBeenCalledWith(false);
            expect(consoleSpy).toHaveBeenCalledWith(404);

            consoleSpy.mockRestore();
        });
    });
});