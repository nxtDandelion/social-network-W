import FormInput from "../compoments/Form/FormInput.jsx";
import FormButton from "../compoments/Form/FormButton.jsx";
import FormFrame from "../compoments/Form/FormFrame.jsx";

export default function LoginPage() {
    return (
        <FormFrame message="Добро пожаловать!">
            <FormInput formType="text" labelText="Логин"/>
            <FormInput formType="password" labelText="Пароль"/>

            <FormButton text="Войти"></FormButton>

            <a className="text-black hover:text-black hover:underline" href="/registration">Нет аккаунта? Зарегистрируйтесь!</a>
        </FormFrame>
    )
}

