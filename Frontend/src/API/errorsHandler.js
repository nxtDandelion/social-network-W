export const errorHandler = (error,curResponse) => {
    if (error.response) {
        console.log(error.response.data.detail.code);
        if (error.response.data.detail.code){
            switch (error.response.data.detail.code) {
                case "USERNAME_EXISTS":
                    return {
                        custom:true,
                        success: false,
                        message: "Такое имя пользователя уже существует"
                    }
                case "LOGIN_EXISTS":
                    return {
                        custom:true,
                        success: false,
                        message: "Такой логин уже существует"
                    }
                case "EMAIL_EXISTS":
                    return {
                        custom:true,
                        success: false,
                        message: "Такой email уже существует"
                    }
            }
        }
        console.log("Ошибка",error);
        const {status, data} = error.response;

        if (status === 404) {
            return {
                success: false,
                statusCode: status,
                error: `${curResponse} Обьект запроса не найден.`,
                details: data
            };
        } else if (status === 422) {
            return {
                success: false,
                statusCode: status,
                error: `${curResponse}Не валидные данные.`,
                details: data
            };

        } else if (status === 401) {
            return {
                success: false,
                statusCode: status,
                error: `${curResponse} Срок вашего токена истек. Пожалуйста, войдите снова.`,
                details: data
            };
        }
        else {
            return {
                success: false,
                statusCode: status,
                error: `${curResponse} Код ошибки не обработан`,
                details: data
            }
        }
    }
    else {
        return {
            success: false,
            error: "Сетевая ошибка при получении данных"
        };
    }
}

export const errorLog = (response) =>{
    console.error(response.error);
    console.error(response.success);
    console.error(response.statusCode);
}