"use client";

import Image from "next/image";
import { ACCESSORIES } from "@/lib/constants/palette";
import { useEditorStore } from "@/lib/store";

const CATEGORIES = [
  { id: "eyewear", label: "Shades" },
  { id: "jewelry", label: "Jewelry" },
  { id: "party", label: "Party" },
  { id: "misc", label: "Stars" },
] as const;

export default function AccessoryPalette() {
  const addAccessory = useEditorStore((s) => s.addAccessory);

  return (
    <aside className="paper-card flex h-full max-h-[640px] w-full flex-col overflow-hidden rounded-sm p-3 md:w-52">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2
          className="text-xl leading-none text-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Purse
        </h2>
        <span
          className="text-xs text-teal"
          style={{ fontFamily: "var(--font-script)" }}
        >
          pick a sticker
        </span>
      </div>

      <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto pr-1">
        {CATEGORIES.map((cat) => {
          const items = ACCESSORIES.filter((a) => a.category === cat.id);
          if (items.length === 0) return null;
          return (
            <div key={cat.id}>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/50">
                {cat.label}
              </p>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    title={item.label}
                    onClick={() => addAccessory(item.id)}
                    className="sticker-btn group flex aspect-square items-center justify-center rounded-sm bg-paper p-1.5"
                  >
                    <Image
                      src={item.src}
                      alt={item.label}
                      width={56}
                      height={56}
                      className="h-10 w-10 object-contain transition-transform group-hover:scale-110 md:h-12 md:w-12"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
