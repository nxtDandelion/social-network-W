
import ProfileInfo from "./PostComponents/ProfileInfo.jsx";
import OtherFuncMenu from "./PostComponents/OtherFuncMenu.jsx";
import {LikeIcon} from "../../Icons/LikeIcon.jsx";
import {CommentIcon} from "../../Icons/CommentsIcon.jsx";

export default function Post() {
    return (
        <div className="flex flex-col max-w-2xl min-h-96">
            <div className="flex justify-between w-2xl  max-h-20 pr-4 pl-4 pt-2 bg-black rounded-t-3xl">
                <ProfileInfo
                    userName="Vova Spridonov"
                    userTag="@DonSprinion"
                    userAvatar="/defaultAvatar.png"
                />
                <OtherFuncMenu>
                </OtherFuncMenu>
            </div>
            <div className="flex max-w-2xl min-h-80 bg-white border-r-2 border-l-2 border-black">
                <p className="text-lg p-4"> «Уплыть за закат: Жизнь и любови Морин Джонсон. Мемуары одной беспутной леди» (англ. To Sail Beyond the Sunset: The Life and Loves of Maureen Johnson (Being the Memoirs of a Somewhat Irregular Lady)) — фантастический роман Роберта Хайнлайна, выпущенный к его 80-летию (7 июля 1987 года), последнее произведение писателя, написанное и опубликованное при жизни. Относится к циклу «Мир как миф» и окончательно закольцовывает «Историю будущего», в романе последовательно сведены и увязаны воедино сюжетные линии всех ранее написанных произведений Хайнлайна. Название отсылает к стихотворению «Улисс» Теннисона, откуда взят эпиграф к роману. «Уплыть за закат» вызвал противоречивые отзывы критиков, которые отмечали крайне неровное качество текста, отразившего сильные и самые слабые стороны Хайнлайна-писателя.</p>
            </div>
            <div className="flex w-2xl h-14 bg-black">
                <div className="flex w-2/4">
                    <div className="flex w-1/2 items-center ml-3 hover:opacity-80">
                        <LikeIcon/>
                        <span className="inline-block text-white text-xl font-bold tracking-wider"> 2228</span>
                    </div >
                    <div className="flex w-1/2 items-center ml-3 hover:opacity-80">
                        <CommentIcon/>
                        <span className="inline-block text-white text-xl font-bold tracking-wider"> 2228</span>
                    </div>
                </div>
                <div className="flex w-2/4 justify-end items-center">
                    <span className="text-base text-[#979797] font-bold tracking-wider mr-4">
                        Создан 25 мая в 12:37
                    </span>
                </div>
            </div>
        </div>
    )
}