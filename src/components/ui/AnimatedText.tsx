"use client";
import React from 'react';
import { motion } from "framer-motion";
import { Link } from 'react-router-dom';

interface WordListSwapProps {
  texts: string[];
  mainClassName?: string;
  staggerFrom?: "first" | "last";
  initial?: any;
  animate?: any;
  exit?: any;
  staggerDuration?: number;
  splitLevelClassName?: string;
  transition?: any;
  rotationInterval?: number;
}

export const WordListSwap = ({
  texts,
  mainClassName = "",
  staggerFrom = "first",
  initial = { y: "100%" },
  animate = { y: 0 },
  exit = { y: "-120%" },
  staggerDuration = 0.025,
  splitLevelClassName = "overflow-hidden",
  transition = { type: "spring", damping: 30, stiffness: 400 },
  rotationInterval = 3000,
}: WordListSwapProps) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (texts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [texts.length, rotationInterval]);

  const currentText = texts[currentIndex];
  const words = currentText.split(" ");

  return (
    <motion.span
      className={`inline-flex items-center ${mainClassName}`}
      key={currentText}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
    >
      {words.map((word, wordIndex) => (
        <motion.span
          key={`${word}-${wordIndex}`}
          className={`inline-block ${splitLevelClassName}`}
          initial={initial}
          animate={animate}
          exit={exit}
          transition={{
            ...transition,
            delay: staggerFrom === "first" 
              ? wordIndex * staggerDuration 
              : (words.length - 1 - wordIndex) * staggerDuration,
          }}
        >
          {word}{wordIndex < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </motion.span>
  );
};

interface AnimatedTextProps {
  staticText: string;
  animatedTexts: string[];
  linkTo: string;
  className?: string;
}

export const AnimatedText = ({
  staticText,
  animatedTexts,
  linkText,
  linkTo,
  className = "",
}: AnimatedTextProps) => {
  return (
    <motion.div className={`flex items-center justify-center whitespace-pre ${className}`} layout>
      <motion.span className="mr-1" layout>
        {staticText}
      </motion.span>
      <Link 
        to={linkTo} 
        className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
      >
        <WordListSwap
          texts={animatedTexts}
          mainClassName="inline-flex items-center"
          staggerFrom="last"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-120%" }}
          staggerDuration={0.025}
          splitLevelClassName="inline-block overflow-hidden"
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          rotationInterval={2000}
        />
      </Link>
    </motion.div>
  );
};

export default AnimatedText;
