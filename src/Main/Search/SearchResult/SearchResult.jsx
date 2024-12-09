import s from "./SearchResult.module.css";
import {useState} from "react";
import {motion, AnimatePresence, LayoutGroup} from "framer-motion";

export default function SearchResult(props) {
    const wordList = [
        {id: 1, word: "Автосервис", link: ""},
        {id: 2, word: "авторизация", link: ""},
        {id: 3, word: "Клининг", link: ""},
        {id: 4, word: "Магазин", link: ""},
        {id: 5, word: "автодром", link: ""},
        {id: 6, word: "автомобиль", link: ""},
        {id: 7, word: "автомобиль", link: ""},
        {id: 8, word: "автомобиль", link: ""},
        {id: 9, word: "автомобиль", link: ""},
        {id: 10, word: "автомобиль", link: ""},
        {id: 12, word: "автомобиль", link: ""},
        {id: 13, word: "автомобиль", link: ""},
        {id: 14, word: "автомобиль", link: ""},
        {id: 15, word: "автомобиль", link: ""},
        {id: 16, word: "автомобиль", link: ""},
        {id: 17, word: "автомобиль", link: ""},
        {id: 18, word: "автомобиль", link: ""},
        {id: 19, word: "автомобиль", link: ""},
    ];

    const cards = wordList.filter(word => {
        return word.word.toLowerCase().includes(props.symbol.toLowerCase())
    })

    const [index, setIndex] = useState(false);

    function closeCard() {
        setIndex(false)
    }

    function closeKey() {
        document.getElementById('mainDivCard').focus()
    }


    //При клике на слово: если клавиатура открыта или похожее условие, то сделать задержку и сменить useState
    function Cards({cards, setIndex}) {
        return (
            <div className={s.mainDivCard} id='mainDivCard'>
                {cards.map((card, i) => (
                    <div key={card.id} className={s.divWord}>
                        <motion.div transition={{duration: 0.3, ease: "easeInOut"}} style={{color: "white"}}
                                    onClick={() => {
                                        setIndex(i)
                                    }} layoutId={card.id} className={s.Word}>
                            <motion.div className={s.Name} onClick={closeKey}>{card.word}</motion.div>
                        </motion.div>
                    </div>
                ))}
            </div>
        );
    }

    function ModalCard({index, cards}) {
        const [deg, setDeg] = useState([])
        const [scale, setScale] = useState([])
        const [duration, setDuration] = useState(0.20)
        const [Y, setY] = useState([])

        function rotate(){
            setDeg([0,-90, -180])
            setScale([1,0.7, 1])
            setDuration(0.45)
            setY([0, 80, 0])
        }
        return (
            /* Container */  // Раскрывающаяся карточка
            <motion.div id={cards[index].id}
                        style={{
                            position: "fixed",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            left: "50%",
                            width: "fit-content",
                            height: "fit-content",
                            justifyContent: "center",
                            justifySelf: "center",
                            alignContent: "center"
                        }}
                        className={s.S}
            >
                {/* Card */}
                <motion.div transition={{ ease: "easeInOut", duration: duration}}
                            layoutId={cards[index].id} className={s.LayoutID}
                            // initial={{scale: 1, rotateY:0}}
                            animate={{scale: scale, rotateY: deg, translateY: Y}}
                            // exit={{scale: 1, rotateY: 0}}
                >

                    {index !== false && (
                        <motion.div exit={{opacity: 0}} transition={{duration: 0.3, ease: "easeInOut"}}>
                            <div className={s.CloseCard} onClick={rotate}>Закрыть</div>
                            <div className={s.Title}>{cards[index].word}</div>
                        </motion.div>
                    )}
                </motion.div>
                {/*<motion.div className={s.child} animate={{opacity:scale, scale:scale, visibility: visible}} initial={{rotateY: deg, scale:scale, visibility: visible}}  transition={{type: "spring", stiffness: 1000, damping: 100, duration: 0.1, ease: "easeInOut", delay: 0.2}}>*/}

                {/*</motion.div>*/}
            </motion.div>
        );
    }
    return (
        <div className={s.Main}>
            <LayoutGroup>
                <AnimatePresence>
                    <Cards index={index} setIndex={setIndex} cards={cards}/>
                    {index !== false && (<motion.div className={s.Back} initial={{opacity: 0}} animate={{opacity: 0.8}} exit={{ opacity: 0 }}
                                                     style={{backgroundColor: "rgba(0,0,0,0.99)",
                                                         width: "100vw",
                                                         height: "100vh",
                                                         position: "fixed"}}
                                                      transition={{duration: 0.3, ease: "easeInOut"}}

                                                     onClick={() => {
                        setIndex(false);
                    }}/>)}
                    {index !== false && (<ModalCard index={index} cards={cards} setIndex={setIndex}/>)}
                    {/*{index !== false && (<ModalCard key="singleCard" index={index} cards={cards} setIndex={setIndex}/>)}*/}
                </AnimatePresence>
            </LayoutGroup>
        </div>
    );
}