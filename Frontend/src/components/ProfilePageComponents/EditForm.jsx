import PopupHeader from "../PopupComponents/PopupHeader.jsx";
import FormInput from "../FormComponents/FormInput.jsx";
import FormButton from "../FormComponents/FormButton.jsx";
import PopupBg from "../PopupComponents/PopupBg.jsx";
import {useEffect, useState} from "react";
import {updateUserProfile} from "../../API/ProfileAPI/updateUserProfile.jsx";
import {errorLog} from "../../API/errorsHandler.js";
import {useNavigate} from "react-router-dom";

export default function EditForm({curUserId,curUserLogin,curUserName,curUserMail,curUserTag,curUserPhoto,closeModalPage}) {
    const [newUserId,setNewUserId] = useState(curUserId);
    const [newUserLogin,setNewUserLogin] = useState(curUserLogin);
    const [newUserName,setNewUserName] = useState(curUserName);
    const [newUserMail,setNewUserMail] = useState(curUserMail);
    const [newUserTag,setNewUserTag] = useState(curUserTag);
    const [newUserPassword,setNewUserPassword] = useState("");
    const [newPasswordConfirm,setNewPasswordConfirm] = useState("");
    const [userAvatar,setUserAvatar] = useState("");
    const [isActive, setIsActive] = useState(false);
    const newUserPhoto = "123";
    const navigate = useNavigate();


    const handleClose = () => {
        closeModalPage();
    }


    const checkChanges = (newUserLogin,newUserName,newUserMail,newUserNewTag,newUserData,updateProfilePage) =>{
        return (newUserName !== curUserName || newUserLogin !== curUserLogin || newUserMail !== curUserMail)

    }

    useEffect(()=>{
        const paramsChanged = checkChanges(newUserLogin,newUserName,newUserMail,newUserTag);
        setIsActive(paramsChanged);

    },[newUserLogin,newUserName,newUserMail,newUserTag])

    const handleSubmit = async (e) =>{
        e.preventDefault();
        console.log("форма отправлена");
        const response = await updateUserProfile(newUserName,newUserMail,newUserLogin,newUserPhoto,newUserPassword);
        console.log(response);
        if (response.success){
            console.log("good");
            console.log(response.data);
            // await updateUserProfile(response.data);
            navigate(`/profile/${response.data.username}`);
        }
        else {
            errorLog(response);
            console.log(response.error);
        }
    }



    return(
        <PopupBg>
            <div className="flex flex-col items-center justify-center w-fit h-fit bg-white rounded-[40px] ">
                <PopupHeader>
                </PopupHeader>
                <p className="font-medium text-xl m-10"> </p>
                <form onSubmit={handleSubmit} className="flex justify-between flex-wrap gap-4 w-[37rem] h-fit p-6 rounded-[40px]">
                    <FormInput
                        hintText={"Допустимы: [a-z,1-9,0,_]"}
                        formType="text"
                        labelText="Имя пользователя"
                        formValue={newUserName}
                        onChange={(e)=>setNewUserName(e.target.value)}  />

                    <FormInput
                        hintText={"Допустимы: [a-z,1-9,0,_]"}
                        formType="text"
                        labelText="Логин"
                        formValue={newUserLogin}
                        onChange={(e)=> setNewUserLogin(e.target.value)} />

                    <FormInput
                        hintText={"Допустимы: [a-z,1-9,0,_]"}
                        formType="text"
                        labelText="Тэг"
                        formValue={newUserTag}
                        onChange={(e)=> setNewUserTag(e.target.value)} />

                    <FormInput
                        hintText={"Пример: name@example.com"}
                        formType="mail"
                        labelText="Email"
                        formValue={newUserMail}
                        onChange={(e)=>setNewUserMail(e.target.value)} />

                    <FormInput
                        hintText={"Допустимы: [a-z,1-9,0,_,!,@,#,$,_,*,&,%]"}
                        formType="password"
                        labelText="Пароль"
                        formValue={newUserPassword}
                        onChange={(e)=>setNewUserPassword(e.target.value)} />

                    <FormInput
                        hintText={"Повторите пароль"}
                        formType="password"
                        labelText="Подтверждение пароля"
                        formValue={newPasswordConfirm}
                        onChange={(e)=>setNewPasswordConfirm(e.target.value)} />

                    <div className="flex justify-between w-full">
                        <button className="button-with-board" onClick={handleClose}>  Отменить</button>
                        <FormButton status={isActive}  className="mt-5" type="submit" text="Изменить"> </FormButton>
                    </div>
                </form>
            </div>
        </PopupBg>
    )
}