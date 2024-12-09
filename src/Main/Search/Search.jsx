import s from "./Search.module.css";
import {NavLink, Route, Routes} from "react-router-dom";
import Home from "../Home/Home";
import Category from "../Category/Category";
import Menu from "../Menu/Menu";
import {AnimatePresence, inView, motion} from "framer-motion";
import {useEffect, useState} from "react";
import SearchResult from "./SearchResult/SearchResult.jsx";

export default function Search() {
    useEffect(() => {
        const searchLine = document.getElementById("search");
        setTimeout(() => {searchLine.focus()}, 120) //Задержка для плавности
    })
    const [symbol, setSymbol] = useState('');
    return (
        <div>
            <AnimatePresence>
                <motion.div className={s.SearchPage} initial={{scale:1.2, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:1.2, opacity:0}} transition={{duration:0.1}}>
                    <div className={s.Search}>
                        <div className={s.divSearchLine}>
                            <input className={s.SearchLine} id="search" onInput={(inputSymbol) => setSymbol(inputSymbol.target.value)} type="text" placeholder="Введите запрос"/>
                        </div>
                        <NavLink to="/" className={s.divClose}>
                            <div  className={s.Close}></div>
                        </NavLink>
                    </div>
                    <SearchResult symbol={symbol}/>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}