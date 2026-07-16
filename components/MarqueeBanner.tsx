"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/store";

export default function MarqueeBanner() {
  const marqueeText = useEditorStore((s) => s.marqueeText);
  const setMarqueeText = useEditorStore((s) => s.setMarqueeText);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(marqueeText);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const openEdit = () => {
    setDraft(marqueeText);
    setPin("");
    setError("");
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marquee_text: draft, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setMarqueeText(data.settings.marquee_text);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const text = marqueeText || "★ happy birthday kenzie ★";
  const loop = `${text}   ✦   ${text}   ✦   `;

  return (
    <header className="relative z-20 border-b-[3px] border-ink bg-teal text-cream">
      <div className="flex items-center gap-2">
        <div className="flex-1 overflow-hidden py-2.5">
          <div className="marquee-track">
            <span
              className="whitespace-nowrap px-4 text-2xl tracking-wide md:text-3xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {loop}
            </span>
            <span
              className="whitespace-nowrap px-4 text-2xl tracking-wide md:text-3xl"
              style={{ fontFamily: "var(--font-display)" }}
              aria-hidden
            >
              {loop}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={openEdit}
          className="mr-2 shrink-0 rounded-sm border-2 border-ink bg-yellow px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink shadow-[2px_2px_0_#1a1a1a] hover:rotate-[-2deg]"
          title="Edit banner"
        >
          Edit
        </button>
      </div>

      {editing && (
        <div className="absolute left-1/2 top-full z-30 w-[min(92vw,420px)] -translate-x-1/2 border-[3px] border-ink bg-cream p-4 shadow-[6px_6px_0_#1a1a1a]">
          <p
            className="mb-2 text-lg"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Edit marquee
          </p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={200}
            rows={3}
            className="mb-2 w-full rounded-sm border-2 border-ink bg-paper p-2 text-sm"
          />
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Admin PIN"
            className="mb-2 w-full rounded-sm border-2 border-ink bg-paper p-2 text-sm"
          />
          {error && <p className="mb-2 text-xs text-rose">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="sticker-btn flex-1 rounded-sm px-3 py-2 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="sticker-btn flex-1 rounded-sm bg-lime px-3 py-2 text-xs font-bold"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
