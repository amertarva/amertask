// lib/motion-variants.ts
export const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.15 },
};

export const slideInRight = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 0 },
  transition: { type: "spring", damping: 25, stiffness: 200 },
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export const collapseVariants = {
  open: { height: "auto", opacity: 1 },
  closed: { height: 0, opacity: 0 },
  transition: { duration: 0.2 },
};

export const scaleOnDrag = {
  scale: 1.02,
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
  transition: { duration: 0.2 },
};
