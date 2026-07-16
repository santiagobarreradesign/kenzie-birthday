import type { AccessoryDef, BackgroundId } from "@/lib/types";

export const COLORS = {
  lime: "#E1ED3C",
  teal: "#409880",
  yellow: "#FFF100",
  cream: "#F4EBD4",
  ink: "#1a1a1a",
  rose: "#fb7185",
  paper: "#faf6ee",
} as const;

export const BRUSH_COLORS = [
  COLORS.ink,
  COLORS.rose,
  COLORS.yellow,
  COLORS.teal,
  COLORS.lime,
  "#2563eb",
  "#F4EBD4",
  "#e11d48",
] as const;

export const ACCESSORIES: AccessoryDef[] = [
  {
    id: "glasses-yellow",
    label: "Yellow shades",
    src: "/assets/accessories/glasses-yellow.svg",
    category: "eyewear",
    defaultScale: 0.9,
  },
  {
    id: "glasses-tortoise",
    label: "Tortoise frames",
    src: "/assets/accessories/glasses-tortoise.svg",
    category: "eyewear",
    defaultScale: 0.85,
  },
  {
    id: "earring-daisy",
    label: "Daisy earring",
    src: "/assets/accessories/earring-daisy.svg",
    category: "jewelry",
    defaultScale: 0.7,
  },
  {
    id: "star-holo",
    label: "Holo star",
    src: "/assets/accessories/star-holo.svg",
    category: "misc",
    defaultScale: 0.55,
  },
  {
    id: "star-red",
    label: "Red star",
    src: "/assets/accessories/star-red.svg",
    category: "misc",
    defaultScale: 0.5,
  },
  {
    id: "star-blue",
    label: "Blue star",
    src: "/assets/accessories/star-blue.svg",
    category: "misc",
    defaultScale: 0.5,
  },
  {
    id: "cake",
    label: "Birthday cake",
    src: "/assets/accessories/cake.svg",
    category: "party",
    defaultScale: 0.75,
  },
  {
    id: "balloon-dog",
    label: "Balloon dog",
    src: "/assets/accessories/balloon-dog.svg",
    category: "party",
    defaultScale: 0.8,
  },
  {
    id: "disco-ball",
    label: "Disco ball",
    src: "/assets/accessories/disco-ball.svg",
    category: "party",
    defaultScale: 0.7,
  },
  {
    id: "confetti",
    label: "Confetti",
    src: "/assets/accessories/confetti.svg",
    category: "party",
    defaultScale: 0.65,
  },
  {
    id: "heart",
    label: "Heart",
    src: "/assets/accessories/heart.svg",
    category: "misc",
    defaultScale: 0.55,
  },
];

export const BACKGROUNDS: {
  id: BackgroundId;
  label: string;
  css: string;
}[] = [
  {
    id: "stripes",
    label: "Diagonal stripes",
    css: `repeating-linear-gradient(
      -45deg,
      #E1ED3C 0px,
      #E1ED3C 18px,
      #409880 18px,
      #409880 36px
    )`,
  },
  {
    id: "grid",
    label: "Craft grid",
    css: `
      linear-gradient(#ffffff22 1px, transparent 1px),
      linear-gradient(90deg, #ffffff22 1px, transparent 1px),
      #5a8f82
    `,
  },
  {
    id: "teal",
    label: "Teal solid",
    css: "#409880",
  },
  {
    id: "lime",
    label: "Lime solid",
    css: "#E1ED3C",
  },
  {
    id: "cream",
    label: "Cream paper",
    css: "#F4EBD4",
  },
];

export const DEFAULT_MARQUEE =
  "★ happy birthday kenzie ★ we love you ★ make a wish ★";

export const KENZIE_BASE = "/assets/kenzie-base.png";

export function getAccessory(id: string): AccessoryDef | undefined {
  return ACCESSORIES.find((a) => a.id === id);
}
