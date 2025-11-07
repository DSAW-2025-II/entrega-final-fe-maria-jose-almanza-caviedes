export const pageTransition = {
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -24, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }
};

export const cardHover = {
  rest: { y: 0, boxShadow: "0px 12px 40px rgba(8,106,216,0.15)" },
  hover: {
    y: -6,
    boxShadow: "0px 20px 60px rgba(8,106,216,0.28)",
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

export const glowPulse = {
  rest: { opacity: 0.45 },
  animate: {
    opacity: [0.4, 0.8, 0.4],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
  }
};
