"use client";

import { motion } from "motion/react";
import type { DecorTone } from "@/lib/decor/tone";
import { decorInk } from "@/lib/decor/tone";

type HeroShutterTextProps = {
  text: string;
  tone: DecorTone;
  accent?: string;
  className?: string;
};

export function HeroShutterText({
  text,
  tone,
  accent = "#F7B00F",
  className,
}: HeroShutterTextProps) {
  const ink = decorInk(tone);
  const characters = text.split("");

  return (
    <motion.span
      aria-hidden="true"
      className={`inline-flex flex-wrap justify-start items-center -translate-x-100 translate-y-7 ${
        className ?? ""
      }`}
    >
      {characters.map((char, i) => (
        <span
          key={`${char}-${i}`}
          className="relative overflow-hidden px-[0.02em]"
        >
          {/* MAIN LETTER — stronger blur reveal */}
          <motion.span
            initial={{
              opacity: 0,
              filter: "blur(16px)",
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              filter: "blur(0px)",
              scale: 1,
            }}
            transition={{
              delay: i * 0.04 + 0.2,
              duration: 1,
              ease: "easeOut",
            }}
            className="relative block"
            style={{
              color: ink,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>

          {/* TOP YELLOW SLICE */}
          <motion.span
            initial={{
              x: "-120%",
              opacity: 0,
              filter: "blur(6px)",
            }}
            animate={{
              x: ["-120%", "100%", "-120%"],
              opacity: [0, 1, 0, 0],
              filter: ["blur(6px)", "blur(0px)", "blur(4px)", "blur(6px)"],
            }}
            transition={{
              duration: 1.25,
              delay: i * 0.04,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 0.45,
            }}
            className="pointer-events-none absolute inset-0"
            style={{
              color: accent,
              clipPath:
                "polygon(0 0, 100% 0, 100% 48%, 0 48%)",
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>

          {/* SMALL MIDDLE SLICE */}
          <motion.span
            initial={{
              x: "120%",
              opacity: 0,
              filter: "blur(4px)",
            }}
            animate={{
              x: ["120%", "-100%", "120%"],
              opacity: [0, 0.85, 0, 0],
              filter: ["blur(4px)", "blur(0px)", "blur(3px)", "blur(4px)"],
            }}
            transition={{
              duration: 1.25,
              delay: i * 0.04 + 0.1,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 0.45,
            }}
            className="pointer-events-none absolute inset-0"
            style={{
              color: ink,
              clipPath:
                "polygon(0 48%, 100% 48%, 100% 52%, 0 52%)",
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>

          {/* BOTTOM YELLOW SLICE */}
          <motion.span
            initial={{
              x: "-120%",
              opacity: 0,
              filter: "blur(6px)",
            }}
            animate={{
              x: ["-120%", "100%", "-120%"],
              opacity: [0, 1, 0, 0],
              filter: ["blur(6px)", "blur(0px)", "blur(4px)", "blur(6px)"],
            }}
            transition={{
              duration: 1.25,
              delay: i * 0.04 + 0.2,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 0.45,
            }}
            className="pointer-events-none absolute inset-0"
            style={{
              color: accent,
              clipPath:
                "polygon(0 52%, 100% 52%, 100% 100%, 0 100%)",
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}