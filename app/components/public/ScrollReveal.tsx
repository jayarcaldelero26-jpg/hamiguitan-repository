"use client";

import { motion, type MotionProps, type Variants } from "framer-motion";
import { useLightMotion } from "@/app/hooks/useLightMotion";

export const revealEase = [0.22, 1, 0.36, 1] as const;

export const revealVariants: Variants = {
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
        ease: revealEase,
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
        ease: revealEase,
      }}
    >
      {children}
    </motion.div>
  );
}
