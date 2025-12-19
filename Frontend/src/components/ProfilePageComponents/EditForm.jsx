import PopupHeader from "../PopupComponents/PopupHeader.jsx";
import FormInput from "../FormComponents/FormInput.jsx";
import FormButton from "../FormComponents/FormButton.jsx";
import PopupBg from "../PopupComponents/PopupBg.jsx";
import { useEffect, useState } from "react";
import { updateUserProfile } from "../../API/ProfileAPI/updateUserProfile.jsx";
import { errorLog } from "../../API/errorsHandler.js";
import { useNavigate } from "react-router-dom";
import CircleAvatarUpload from "./AvatarUpload.jsx";
import {fileToBase64Optimized} from "../../utils/fileToBase64.js";
import NotificationCard from "../Other/NotificationCard.jsx";

export default function EditForm({curUserLogin, curUserName, curUserMail, curUserTag,
                                     curUserAvatar, closeModalPage, refreshProfile,showNotice}){
    const [newUserLogin, setNewUserLogin] = useState(curUserLogin || "");
    const [newUserName, setNewUserName] = useState(curUserName || "");
    const [newUserMail, setNewUserMail] = useState(curUserMail || "");
    const [newUserTag, setNewUserTag] = useState(curUserTag || "");
    const [newUserPassword, setNewUserPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
    const [newUserAvatar, setNewUserAvatar] = useState(curUserAvatar || null);
    const [isActive, setIsActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const [notice,setNotice] = useState(null);

    const inputHeight = "h-16"; // Высота одного поля ввода
    const avatarSectionHeight = "h-64"; // Высота секции с аватаркой

    const handleClose = () => {
        closeModalPage();
    };

    // Проверка изменений
    useEffect(() => {
        const hasChanges =
            newUserName !== curUserName ||
            newUserLogin !== curUserLogin ||
            newUserMail !== curUserMail ||
            newUserTag !== curUserTag ||
            newUserAvatar !== curUserAvatar;

        setIsActive(hasChanges);
    }, [newUserLogin, newUserName, newUserMail, newUserTag, newUserAvatar, curUserName]);


    const handleAvatarChange = async (file) => {

        const base64String = await fileToBase64Optimized(file, {
            maxWidth: 400,
            quality: 0.8,
            maxSizeKB: 200
        });


        setNewUserAvatar(base64String);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isActive || isLoading) return;
        setIsLoading(true);
        try {
            console.log(newUserAvatar,"photo");
            const response = await updateUserProfile(
                newUserName,
                newUserLogin,
                newUserMail,
                newUserTag,
                newUserAvatar, // передаем файл аватарки
                newUserPassword,
                curUserName
            );

            if (response.success) {
                console.log("Профиль обновлен:", response.data);
                showNotice()
                navigate(`/profile/${response.data.username}`);
                refreshProfile();
                closeModalPage();

            } else {
                errorLog(response);
                console.log("Ошибка:", response.error);
            }
        } catch (error) {
            console.error("Ошибка при обновлении:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PopupBg>
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div className="px-8 pt-8 pb-4 border-b border-gray-100">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">Редактирование профиля</h2>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <p className="text-gray-500 mt-2">Обновите информацию о себе</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8">
                        <div className="flex flex-col items-center lg:flex-row gap-8">

                            <div className={`lg:w-1/3 flex flex-col items-center mb-20 ${avatarSectionHeight}`}>
                                <div className="sticky top-8">
                                    <CircleAvatarUpload onAvatarChange={handleAvatarChange} />
                                    <p className="text-sm text-gray-500 text-center mt-4 max-w-xs">
                                        Рекомендуемый размер: 400×400 пикселей. Максимальный вес: 5MB
                                    </p>
                                </div>
                            </div>

                            <div className="lg:w-2/3 md:w-2/3 w-60">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-fit">
                                    <div className={`${inputHeight}`}>
                                        <FormInput
                                            hintText="Допустимы: [a-z,1-9,0,_]"
                                            formType="text"
                                            labelText="Имя пользователя"
                                            formValue={newUserName}
                                            onChange={(e) => setNewUserName(e.target.value)}
                                        />
                                    </div>

                                    <div className={`${inputHeight}`}>
                                        <FormInput
                                            hintText="Допустимы: [a-z,1-9,0,_]"
                                            formType="text"
                                            labelText="Логин"
                                            formValue={newUserLogin}
                                            onChange={(e) => setNewUserLogin(e.target.value)}
                                        />
                                    </div>

                                    <div className={`${inputHeight}`}>
                                        <FormInput
                                            hintText="Допустимы: [a-z,1-9,0,_]"
                                            formType="text"
                                            labelText="Тэг"
                                            formValue={newUserTag}
                                            onChange={(e) => setNewUserTag(e.target.value)}
                                        />
                                    </div>

                                    <div className={`${inputHeight}`}>
                                        <FormInput
                                            hintText="Пример: name@example.com"
                                            formType="mail"
                                            labelText="Email"
                                            formValue={newUserMail}
                                            onChange={(e) => setNewUserMail(e.target.value)}
                                        />
                                    </div>

                                    <div className={`${inputHeight}`}>
                                        <FormInput
                                            hintText="Допустимы: [a-z,1-9,0,_,!,@,#,$,_,*,&,%]"
                                            formType="password"
                                            labelText="Пароль"
                                            formValue={newUserPassword}
                                            onChange={(e) => setNewUserPassword(e.target.value)}
                                        />
                                    </div>

                                    <div className={`${inputHeight}`}>
                                        <FormInput
                                            hintText="Повторите пароль"
                                            formType="password"
                                            labelText="Подтверждение пароля"
                                            formValue={newPasswordConfirm}
                                            onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="px-6 py-3 border border-gray-300 text-gray-700
                                                 rounded-[40px] hover:bg-gray-50 transition-colors
                                                 font-medium"
                                    >
                                        Отменить
                                    </button>

                                    <FormButton
                                        status={isActive && !isLoading}
                                        type="submit"
                                        text={isLoading ? "Сохранение..." : "Сохранить изменения"}
                                        className="px-8 py-3 font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

        </PopupBg>
    );
}