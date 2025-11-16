
import {SearchIcon} from "../components/Icons/SearchIcon.jsx";
import ProfilePosts from "../components/ProfilePageComponents/ProfilePost.jsx";
import ProfilePost from "../components/ProfilePageComponents/ProfilePost.jsx";
import Post from "../components/MainPageComponents/Post/Post.jsx";
import ProfileButton from "../components/ProfilePageComponents/ProfileButton.jsx";
import {useState} from "react";
import FormInput from "../components/FormComponents/FormInput.jsx";




export default function profilePage({avatar,subscribes,followers,cureLogin,curePassword,cureName,cureMail}){
    function handleFunc() {

    }
    const [userPassword,setUserPassword] = useState(curePassword);
    const[userPasswordConfirm,setPasswordConfirm] = useState(curePassword);
    const [userName,setUserName] = useState(cureName);
    const [userLogin,setUserLogin] = useState(cureLogin);
    const [userMail,setUserMail] = useState(cureMail);
    const [showEdit ,setShowEdit] = useState(false);

    const editProf = () =>{
        setShowEdit(true);
    }

    function handleSubmit() {
        console.log('форма отправилась');
    }

    return(
        <div className="flex flex-col">
            <div className="flex  justify-between items-center px-12 gap-8 w-full h-20 bg-black rounded-t-[40px]">
                <SearchIcon/>
                <button className="text-white underline hover:opacity-60" onClick={editProf}> Редактрировать</button>
            </div>
            <div className=" relative  flex flex-col items-center w-full  max-w-[62rem] min-h-screen bg-white border-r-2 border-l-2 border-black">
                <div className=" h-56 w-full max-w-[62rem] bg-[#D9D9D9]"></div>
                <img  className="absolute left-10 top-20 w-60 h-60 pb-1  rounded-full border-4 border-black"  src={`avatars/${avatar ? avatar: "defaultAvatar.png"}`} alt="Ваш аватар"/>
                <div className="absolute left-72 top-48">
                    <span className="text-2xl"> {userName} </span>
                    <span className="text-2xl"> {userLogin} </span>
                    <div className="flex flex-col gap-2 items-start mt-2">
                        <ProfileButton text="Подписки" count="27"/>
                        <ProfileButton text="Подписчики" count="70"/>
                    </div>
                </div>
                <div className="flex justify-center items-center mt-2">

                </div>
                <div className="flex flex-wrap justify-center items-center max-w-[50rem] mt-48 p-2 gap-3">
                    <Post likeCount="5" commentCount="10" postText="Собака - не Волк! Волк - не собака!"></Post>
                    <Post></Post>
                </div>
            </div>


            {showEdit &&
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-80">

                    <form onSubmit={handleSubmit} className="   bg-white  w-fit h-fit p-6 rounded-[40px]">
                        <FormInput  value={userName}  formType="text" labelText="Имя пользователя" formValue={userName} onChange={(e)=>setUserName(e.target.value)} />
                        <FormInput  value={userLogin}  formType="text" labelText="Логин" formValue={userLogin} onChange={(e)=>setUserLogin(e.target.value)} />
                        <FormInput  value={userMail}   formType="mail" labelText="Email" formValue={userMail} onChange={(e)=>setUserMail(e.target.value)} />
                        <FormInput  value={userPassword}   formType="password" labelText="Пароль" formValue={userPassword} onChange={(e)=>setUserPassword(e.target.value)} />
                        <FormInput  value={userPassword}   formType="password" labelText="Подтверждение пароль" formValue={userPasswordConfirm} onChange={(e)=>setPasswordConfirm(e.target.value)} />

                        <button type="submit"> сохранить </button>

                    </form>
                </div>}
        </div>


    )
}
