export const loginValid = (value) => {
    if (!value || value.length === 0) {
        return {isValid:false,message: "Поле логина должны быть заполнены"};
    }
    if (value.length < 3) {
        return {isValid:false,message: "Логин: минимум 3 символа"};
    }
    if (value.length > 24) {
        return {isValid:false,message: "Логин содержит слишком много символов"};
    }
    const loginRegex = /^[a-zA-Z0-9_]+$/;
    if (!loginRegex.test(value)) {
        return {isValid: false,message:"Логин содержит недопустимые символы"};
    }
    return{isValid:true,message:"Логин корректный"};
}

export const userNameValid = (value) => {
    if (!value || value.length === 0) {
        return {isValid:false,message: "Поле имени должно быть заполнены"};
    }
    if (value.length < 3) {
        return {isValid:false,message: "Имя пользователя: минимум 3 символа"};
    }
    if (value.length > 24) {
        return {isValid:false,message: "Имя содержит слишком много символов"};
    }
    const loginRegex = /^[a-zA-Z0-9_]+$/;
    if (!loginRegex.test(value)) {
        return {isValid: false,message:"Имя содержит недопустимые символы"};
    }
    return{isValid:true,message:"Имя пользователя корректное"};
}

export const passwordValid = (value) => {
    if (!value || value.length === 0) {
        return {isValid: false, message: "Поле пароля должны быть заполнены"};
    }
    if (value.length < 8) {
        return {isValid: false, message: "Пароль: минимум 8 символов"};
    }
    const passwordRegex = /^[a-zA-Z0-9!@#$*&%_]+$/;
    if (!passwordRegex.test(value)) {
        return {isValid: false, message: "Пароль содержит недопустимые символы"};
    }
    if (value.length > 24) {
        return {isValid: false, message: "Пароль содержит слишком много символов"};
    }

    return {isValid: true, message: "Пароль корректный"};
}

export const emailValid = (value) => {
        if (!value || value.length === 0) {
            return {isValid: false, message: "Поле email должно быть заполнено"};
        }
        if (value.length > 40) {
            return {isValid: false, message: "Email: не более 40 символов"};
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return {isValid: false, message: "Некорректный формат email"};
        }
        return {isValid: true, message: "Email корректен" };
}

export const lenghtCheck = (value) =>{
    if (!(!value || value.length === 0)) {
        console.log(value,"true");
        return true;
    } else {
        console.log(value,"false");
        return false
    }
}