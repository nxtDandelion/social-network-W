import FormInput from "../compoments/Form/FormInput.jsx";
import FormButton from "../compoments/Form/FormButton.jsx";
import FormFrame from "../compoments/Form/FormFrame.jsx";

export default function RegistrationPage() {
    return (
        <FormFrame message="Станьте частью большего!">
            <FormInput formType="text" labelText="Логин"/>
            <FormInput formType="mail" labelText="Почта"/>
            <FormInput formType="password" labelText="Пароль"/>
            <FormInput formType="password" labelText="Подтверждение пароль"/>

            <FormButton text="Зарегестрироваться"></FormButton>
        </FormFrame>
    );
}