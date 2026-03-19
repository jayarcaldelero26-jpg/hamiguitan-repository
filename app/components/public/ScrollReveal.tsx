"use client";

import { motion, type MotionProps, type Variants } from "framer-motion";

const revealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 32,
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
  amount: 0.22,
};

export function Reveal({
  children,
  className,
  delay = 0,
  duration = 0.65,
  amount = 0.22,
}: RevealProps) {
  return (
    <motion.div
      className={className}
      variants={revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ ...viewportDefaults, amount }}
      transition={{
        duration,
        delay,
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
  delayChildren = 0.04,
  staggerChildren = 0.1,
  amount = 0.16,
}: StaggerProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren,
            staggerChildren,
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
  return (
    <motion.div
      className={className}
      variants={revealVariants}
      transition={{
        duration: 0.62,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
