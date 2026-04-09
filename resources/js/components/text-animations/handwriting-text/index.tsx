"use client"

import { motion } from "framer-motion";
import React from "react";

export interface HandwritingTextProps {
    text: string;
    className?: string;
    delay?: number;
    stagger?: number;
    duration?: number;
}

const HandwritingText: React.FC<HandwritingTextProps> = ({
    text,
    className = "",
    delay = 0.5,
    stagger = 0.08,
    duration = 0.3,
}) => {
    // Split text into characters including spaces
    const characters = text.split("");

    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { 
                staggerChildren: stagger, 
                delayChildren: delay,
            },
        },
    };

    const child = {
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: duration,
                ease: "easeOut",
            },
        },
        hidden: {
            opacity: 0,
            y: 10,
        },
    };

    return (
        <motion.span
            style={{ display: "inline-flex", flexWrap: "wrap" }}
            variants={container}
            initial="hidden"
            animate="visible"
            className={className}
        >
            {characters.map((char, index) => (
                <motion.span
                    key={index}
                    variants={child}
                    style={{ 
                        display: "inline-block", 
                        whiteSpace: char === " " ? "pre" : "normal",
                        position: "relative"
                    }}
                >
                    {char}
                </motion.span>
            ))}
        </motion.span>
    );
};

export default HandwritingText;
