"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** horizontal offset to animate in from (px) */
  x?: number;
  /** vertical offset to animate in from (px) */
  y?: number;
  delay?: number;
  duration?: number;
  /** amount of the element visible before triggering */
  amount?: number;
};

/**
 * Scroll-triggered reveal. The Figma timeline plays these entrances once;
 * on the web we fire them as the element scrolls into view.
 */
export function Reveal({
  children,
  className,
  x = 0,
  y = 0,
  delay = 0,
  duration = 0.7,
  amount = 0.3,
}: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: [0.5, 0, 0.5, 1] }}
    >
      {children}
    </motion.div>
  );
}
