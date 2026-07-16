"use client";

import { BACKGROUNDS, BRUSH_COLORS } from "@/lib/constants/palette";
import { useEditorStore } from "@/lib/store";
import type { ToolMode } from "@/lib/types";

export default function ToolBar() {
  const toolMode = useEditorStore((s) => s.toolMode);
  const setToolMode = useEditorStore((s) => s.setToolMode);
  const brushColor = useEditorStore((s) => s.brushColor);
  const setBrushColor = useEditorStore((s) => s.setBrushColor);
  const brushSize = useEditorStore((s) => s.brushSize);
  const setBrushSize = useEditorStore((s) => s.setBrushSize);
  const backgroundId = useEditorStore((s) => s.backgroundId);
  const setBackgroundId = useEditorStore((s) => s.setBackgroundId);
  const hairHue = useEditorStore((s) => s.hairHue);
  const setHairHue = useEditorStore((s) => s.setHairHue);
  const distortSkewX = useEditorStore((s) => s.distortSkewX);
  const distortSkewY = useEditorStore((s) => s.distortSkewY);
  const setDistort = useEditorStore((s) => s.setDistort);
  const removeSelected = useEditorStore((s) => s.removeSelected);
  const selectedId = useEditorStore((s) => s.selectedId);
  const isSaving = useEditorStore((s) => s.isSaving);
  const setIsSaving = useEditorStore((s) => s.setIsSaving);
  const getPendingLayers = useEditorStore((s) => s.getPendingLayers);
  const markLayersSaved = useEditorStore((s) => s.markLayersSaved);
  const authorName = useEditorStore((s) => s.authorName);
  const setAuthorName = useEditorStore((s) => s.setAuthorName);

  const modes: { id: ToolMode; label: string }[] = [
    { id: "select", label: "Move" },
    { id: "draw", label: "Draw" },
    { id: "erase", label: "Erase" },
  ];

  const saveCollage = async () => {
    const pending = getPendingLayers().filter((l) => l.layer_type !== "effect");
    const scene = {
      backgroundId,
      hairHue,
      distortSkewX,
      distortSkewY,
    };

    if (pending.length === 0 && !authorName) {
      // Still allow saving scene settings alone
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/layers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_name: authorName || "friend",
          layers: pending.map((l) => ({
            author_name: authorName || l.author_name || "friend",
            layer_type: l.layer_type,
            asset_id: l.asset_id,
            transform: l.transform,
            stroke_data: l.stroke_data,
            settings: l.settings,
          })),
          scene,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      const ids = pending.map((l) => l.id);
      markLayersSaved(ids);

      // Reload authoritative layers
      const refresh = await fetch("/api/layers");
      const refreshed = await refresh.json();
      if (refreshed.layers) {
        useEditorStore.getState().setLayers(refreshed.layers);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save collage");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <aside className="paper-card flex h-full max-h-[640px] w-full flex-col gap-3 overflow-y-auto rounded-sm p-3 scrollbar-thin md:w-56">
      <div>
        <h2
          className="text-xl leading-none text-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Tools
        </h2>
        <p
          className="text-xs text-teal"
          style={{ fontFamily: "var(--font-script)" }}
        >
          remix the vibe
        </p>
      </div>

      <label className="block text-xs font-bold uppercase tracking-wider text-ink/50">
        Your name
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="friend"
          maxLength={40}
          className="mt-1 w-full rounded-sm border-2 border-ink bg-paper px-2 py-1.5 text-sm font-normal normal-case tracking-normal"
        />
      </label>

      <div className="flex gap-1.5">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setToolMode(m.id)}
            className={`sticker-btn flex-1 rounded-sm px-2 py-1.5 text-xs font-bold ${
              toolMode === m.id ? "active" : ""
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {(toolMode === "draw" || toolMode === "erase") && (
        <div className="space-y-2 rounded-sm border-2 border-dashed border-ink/20 p-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
            Brush
          </p>
          <div className="flex flex-wrap gap-1.5">
            {BRUSH_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                onClick={() => setBrushColor(c)}
                className="h-6 w-6 rounded-full border-2 border-ink"
                style={{
                  background: c,
                  outline:
                    brushColor === c ? "2px solid #FFF100" : "none",
                  outlineOffset: 1,
                }}
              />
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs">
            Size
            <input
              type="range"
              min={2}
              max={28}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="flex-1 accent-teal"
            />
          </label>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
          Background
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.id}
              type="button"
              onClick={() => setBackgroundId(bg.id)}
              className={`sticker-btn h-10 rounded-sm text-[10px] font-bold ${
                backgroundId === bg.id ? "active" : ""
              }`}
              style={{
                background: bg.css,
                backgroundSize:
                  bg.id === "grid" ? "8px 8px, 8px 8px, auto" : undefined,
              }}
              title={bg.label}
            >
              <span className="rounded-sm bg-cream/90 px-1 text-ink">
                {bg.label.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <label className="block space-y-1 text-xs">
        <span className="font-bold uppercase tracking-wider text-ink/50">
          Hair tint
        </span>
        <input
          type="range"
          min={0}
          max={360}
          value={hairHue}
          onChange={(e) => setHairHue(Number(e.target.value))}
          className="w-full accent-rose"
        />
      </label>

      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
          Distort
        </p>
        <label className="flex items-center gap-2 text-xs">
          Skew X
          <input
            type="range"
            min={-0.4}
            max={0.4}
            step={0.01}
            value={distortSkewX}
            onChange={(e) =>
              setDistort(Number(e.target.value), distortSkewY)
            }
            className="flex-1 accent-yellow"
          />
        </label>
        <label className="flex items-center gap-2 text-xs">
          Skew Y
          <input
            type="range"
            min={-0.4}
            max={0.4}
            step={0.01}
            value={distortSkewY}
            onChange={(e) =>
              setDistort(distortSkewX, Number(e.target.value))
            }
            className="flex-1 accent-yellow"
          />
        </label>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <button
          type="button"
          disabled={!selectedId}
          onClick={removeSelected}
          className="sticker-btn rounded-sm bg-rose/80 px-3 py-2 text-xs font-bold disabled:opacity-40"
        >
          Delete selected
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={saveCollage}
          className="sticker-btn rounded-sm bg-lime px-3 py-2.5 text-sm font-bold disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Add to collage ★"}
        </button>
      </div>
    </aside>
  );
}
