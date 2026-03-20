"use client";

import { motion, useReducedMotion, type MotionProps, type Variants } from "framer-motion";
import { useEffect, useState } from "react";

const revealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  amount?: number;
};

type StaggerProps = {
  children: React.ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
  amount?: number;
};

type StaggerItemProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

const viewportDefaults: MotionProps["viewport"] = {
  once: true,
  amount: 0.18,
  margin: "0px 0px -8% 0px",
};

function useLightMotion() {
  const prefersReducedMotion = useReducedMotion();
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const update = () => setIsSmallScreen(mediaQuery.matches);
    update();

    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion || isSmallScreen;
}

export function Reveal({
  children,
  className,
  delay = 0,
  duration = 0.56,
  amount = 0.18,
}: RevealProps) {
  const lightMotion = useLightMotion();

  return (
    <motion.div
      className={className}
      variants={revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ ...viewportDefaults, amount }}
      transition={{
        duration: lightMotion ? 0 : duration,
        delay: lightMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
  delayChildren = 0.03,
  staggerChildren = 0.07,
  amount = 0.14,
}: StaggerProps) {
  const lightMotion = useLightMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: lightMotion ? 0 : delayChildren,
            staggerChildren: lightMotion ? 0 : staggerChildren,
          },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ ...viewportDefaults, amount }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  delay = 0,
}: StaggerItemProps) {
  const lightMotion = useLightMotion();

  return (
    <motion.div
      className={className}
      variants={revealVariants}
      transition={{
        duration: lightMotion ? 0 : 0.54,
        delay: lightMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
