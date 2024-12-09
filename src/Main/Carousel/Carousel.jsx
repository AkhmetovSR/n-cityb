import s from "./Carousel.module.css";
import {motion} from "framer-motion";
import {useState} from "react";
import React from "react";
import boost from "../../resource/image.png";
import boost1 from "../../resource/imag1.png";
import boost2 from "../../resource/image2.png";



const ArrBackground = [
    {id: 1, img: boost},
    {id: 2, img: boost1},
    {id: 3, img: boost2},

];
const Carousel = ({children}) => {
    const [active, setActive] = useState(1);
    let [x, setX] = useState(4);

    let startX = 0;
    let endX = 0;
    let startY = 0;
    let endY = 0;

    function onTapStart(event, i) {
        startX = i.point.x
        startY = i.point.y
    }

    function onTap(event, i) {
        endX = i.point.x;
        endY = i.point.y;
        // startY - endY > 50 ? window.scrollTo({top: 800, behavior: 'smooth'}) : endY = 0;
        // endY - startY > 50 ? window.scrollTo({top: -800, behavior: 'smooth'}) : endY = 0;
        if (active !== 2) {
            startX - endX > 50 ? setActive(active + 1) : startX += 0;
        }
        if (active !== 0) {
            endX - startX > 50 ? setActive(active - 1) : endX += 0;
        }

        startX = null;
        endX = null;
        startY = null;
        endY = null;
    }

    return (
        <motion.div className={s.RightDiv}>
            {React.Children.map(children, (child, i = child.id) =>
                (<motion.div className={s.CardCont}
                             onTapStart={onTapStart}
                             onTap={onTap}
                             style={{
                                 // '--abs': Math.abs(active - i) / 3,
                                 // 'opacity': Math.abs(active - i) >= 3 ? '0' : '1',
                                 // 'display': Math.abs(active - i) > 2 ? 'none' : 'block',
                                 'touchAction': 'none'
                             }}
                             animate={{
                                 rotateY: (((active - i) / 10) * 10),
                                 scaleY: 1 + (((Math.abs(active - i)) / 2.5) * -0.9),
                                 translateZ: ((Math.abs(active - i)) / 2) * 5,
                                 translateX: (Math.sign(i - active) * Math.abs(i - active)) * 3 * x,
                                 zIndex: active > i ? i - active + 1 : active - i + 1
                             }}>
                        {child}
                    </motion.div>
                ))}
        </motion.div>
    )
}

const Card = ({image}) => (
    <div className={s.divImg}>
        <img src={image} className={s.img} alt="alt"/>
    </div>
)
export default function RightDiv() {
    return (
        <Carousel>
            {ArrBackground.map(i => (<Card image={i.img}/>))}
        </Carousel>
    )
}
//style={{backgroundImage: `url("${image}")`}}