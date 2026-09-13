const spring = {
  fast: {
    type: "spring",
    duration: 0.08,
    bounce: 0,
    exit: { duration: 0.06 },
  },
  moderate: {
    type: "spring",
    duration: 0.16,
    bounce: 0,
    exit: { duration: 0.12 },
  },
  slow: {
    type: "spring",
    duration: 0.24,
    bounce: 0.12,
    exit: { duration: 0.16 },
  },
} as const;

const fluidHoverFade = spring.fast;
const fluidHoverTravel = spring.fast;
const sidebarHoverTravel = spring.moderate;
const sidebarSelectionTravel = spring.moderate;

export { fluidHoverFade, fluidHoverTravel, sidebarHoverTravel, sidebarSelectionTravel, spring };
