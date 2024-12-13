import s from "./SearchResult.module.css";
import {useState} from "react";
import {motion, AnimatePresence, LayoutGroup} from "framer-motion";

export default function SearchResult(props) {
    // (g=>{let h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});let d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
    //     key: "YOUR_API_KEY",
    //     v: "weekly",
    //     // Use the 'v' parameter to indicate the version to use (weekly, beta, alpha, etc.).
    //     // Add other bootstrap parameters as needed, using camel case.
    // });
    // let map;
    //
    // async function initMap() {
    //     const { Map } = await google.maps.importLibrary("maps");
    //
    //     map = new Map(document.getElementById("map"), {
    //         center: { lat: -34.397, lng: 150.644 },
    //         zoom: 8,
    //     });
    // }

    // initMap();

    const wordList = [
        {id: 1, word: "Автосервис", link: "", map: "https://yandex.ru/map-widget/v1/?from=mapframe&ll=65.435813%2C62.142532&mode=whatshere&source=mapframe&utm_source=mapframe&whatshere%5Bpoint%5D=65.434996%2C62.143112&whatshere%5Bzoom%5D=17&z=15"},
        {id: 2, word: "авторизация", link: "", map: "https://yandex.ru/map-widget/v1/?from=mapframe&ll=65.437652%2C62.141560&mode=poi&poi%5Bpoint%5D=65.448396%2C62.137985&poi%5Buri%5D=ymapsbm1%3A%2F%2Forg%3Foid%3D77697302338&source=mapframe&utm_source=mapframe&z=15.83"},
        {id: 3, word: "Клининг", link: "", map: "https://yandex.ru/maps/11186/nyagan/house/ulitsa_lenina_10/YkwYcgNhQEYBQFhofX11c3hnZw==/?from=mapframe&ll=65.435813%2C62.142532&source=mapframe&utm_source=mapframe&z=16.89"},
        {id: 4, word: "Магазин", link: "", map: "https://yandex.ru/maps/?from=mapframe&ll=65.437652%2C62.141560&mode=poi&poi%5Bpoint%5D=65.440333%2C62.138721&poi%5Buri%5D=ymapsbm1%3A%2F%2Forg%3Foid%3D1195843061&source=mapframe&utm_source=mapframe&z=15.83"},
        // // {id: 5, word: "автодром", link: "", map: ""},
        // {id: 6, word: "автомобиль", link: "", map: ""},
        // {id: 7, word: "автомобиль", link: "", map: ""},
        // {id: 8, word: "автомобиль", link: "", map: ""},
        // {id: 9, word: "автомобиль", link: "", map: ""},
        // {id: 10, word: "автомобиль", link: "", map: ""},
        // {id: 12, word: "автомобиль", link: "", map: ""},
        // {id: 13, word: "автомобиль", link: "", map: ""},
        // {id: 14, word: "автомобиль", link: "", map: ""},
        // {id: 15, word: "автомобиль", link: "", map: ""},
        // {id: 16, word: "автомобиль", link: "", map: ""},
        // {id: 17, word: "автомобиль", link: "", map: ""},
        // {id: 18, word: "автомобиль", link: "", map: ""},
        // {id: 19, word: "автомобиль", link: "", map: ""},
    ];
    const cards = wordList.filter(word => {return word.word.toLowerCase().includes(props.symbol.toLowerCase())})
    const [index, setIndex] = useState(false);
    function closeKey() {document.getElementById('mainDivCard').focus()}
    function Cards({cards, setIndex}) {
        return (
            <div className={s.mainDivCard} id='mainDivCard'>
                {cards.map((card, i) => (
                    <div key={card.id} className={s.divWord}>
                        <motion.div transition={{duration: 0.3, ease: "easeInOut"}} style={{color: "white"}} onClick={() => {setIndex(i)}} layoutId={card.id} className={s.Word}>
                            <motion.div className={s.Name} onClick={closeKey}>{card.word}</motion.div>
                        </motion.div>
                    </div>
                ))}
            </div>
        );
    }
    function ModalCard({index, cards}) {

        const [deg, setDeg] = useState([])
        const [deg1, setDeg1] = useState([])
        const [scale, setScale] = useState([])
        const [duration, setDuration] = useState(0.20)
        const [Y, setY] = useState([])
        const [opacity, setOpacity] = useState([])
        const [cardContent, setCardContent] = useState()

        function rotateCard(){
            setDeg([0, -180])
            setScale([1,0.7, 1])
            setDuration(0.45)
            setY([0, 80, 0])
            setOpacity([1, 0])
            setDeg1([0,-180])
            setCardContent(<motion.div>asd</motion.div>)
        }
        return (
            <motion.div id={cards[index].id} style={{position: "fixed", top: "50%", transform: "translate(-50%, -50%)", left: "50%", width: "fit-content", height: "fit-content", justifyContent: "center", justifySelf: "center", alignContent: "center"}} className={s.S}>
                <motion.div transition={{ ease: "easeInOut", duration: duration}} layoutId={cards[index].id} className={s.LayoutID} animate={{scale: scale, rotateY: deg, translateY: Y}}>
                    {index !== false && (
                        <motion.div exit={{opacity: 0}} transition={{duration: 0.3, ease: "easeInOut"}} className={s.cardContent}>
                            <motion.div className={s.CloseCard} onClick={rotateCard} animate={{opacity:opacity}}>Закрыть</motion.div>
                            <motion.div className={s.Title}>{cards[index].word}</motion.div>
                            <motion.div initial={{opacity: 0}} animate={{rotateY:deg1, opacity: 1}} transition={{duration: 1}}>{cardContent}</motion.div>
                            <div className={s.Map}>

                                <iframe src={cards[index].map} className={s.iFrame}></iframe>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        );
    }
    return (
        <div className={s.Main}>
            <LayoutGroup>
                <AnimatePresence>
                    <Cards index={index} setIndex={setIndex} cards={cards}/>
                    {index !== false && (<motion.div className={s.Back} initial={{opacity: 0}} animate={{opacity: 0.8}} exit={{ opacity: 0 }} style={{backgroundColor: "rgba(0,0,0,0.99)", width: "100vw", height: "100vh", position: "fixed"}} transition={{duration: 0.3, ease: "easeInOut"}} onClick={() => {setIndex(false);}}/>)}
                    {index !== false && (<ModalCard index={index} cards={cards} setIndex={setIndex}/>)}
                </AnimatePresence>
            </LayoutGroup>
        </div>
    );
}



// <iframe src="https://yandex.ru/map-widget/v1/?from=mapframe&ll=65.435813%2C62.142532&mode=whatshere&source=mapframe&utm_source=mapframe&whatshere%5Bpoint%5D=65.434996%2C62.143112&whatshere%5Bzoom%5D=17&z=15" className={s.iFrame}></iframe>

