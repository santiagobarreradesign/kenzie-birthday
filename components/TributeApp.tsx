"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import AccessoryPalette from "@/components/AccessoryPalette";
import CommentForm from "@/components/CommentForm";
import FloatingComments from "@/components/FloatingComments";
import MarqueeBanner from "@/components/MarqueeBanner";
import ToolBar from "@/components/ToolBar";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useEditorStore } from "@/lib/store";
import type { CanvasLayer, Comment, SiteSettings } from "@/lib/types";

const KenzieCanvas = dynamic(() => import("@/components/KenzieCanvas"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto flex h-[420px] w-full max-w-[480px] items-center justify-center border-[3px] border-ink bg-cream shadow-[6px_6px_0_#1a1a1a]">
      <p style={{ fontFamily: "var(--font-script)" }} className="text-xl text-teal">
        loading the scrapbook…
      </p>
    </div>
  ),
});

export default function TributeApp() {
  const setLayers = useEditorStore((s) => s.setLayers);
  const addRemoteLayer = useEditorStore((s) => s.addRemoteLayer);
  const setComments = useEditorStore((s) => s.setComments);
  const addComment = useEditorStore((s) => s.addComment);
  const setMarqueeText = useEditorStore((s) => s.setMarqueeText);
  const mobilePanel = useEditorStore((s) => s.mobilePanel);
  const setMobilePanel = useEditorStore((s) => s.setMobilePanel);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [layersRes, commentsRes, settingsRes] = await Promise.all([
        fetch("/api/layers"),
        fetch("/api/comments"),
        fetch("/api/settings"),
      ]);

      if (cancelled) return;

      const layersJson = await layersRes.json();
      const commentsJson = await commentsRes.json();
      const settingsJson = await settingsRes.json();

      if (layersJson.layers) setLayers(layersJson.layers as CanvasLayer[]);
      if (commentsJson.comments)
        setComments(commentsJson.comments as Comment[]);
      if (settingsJson.settings)
        setMarqueeText((settingsJson.settings as SiteSettings).marquee_text);
    }

    load().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [setLayers, setComments, setMarqueeText]);

  // Realtime when Supabase is configured
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel("tribute-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        (payload) => {
          addComment(payload.new as Comment);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "canvas_layers" },
        (payload) => {
          addRemoteLayer(payload.new as CanvasLayer);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "site_settings" },
        (payload) => {
          const row = payload.new as SiteSettings;
          if (row.marquee_text) setMarqueeText(row.marquee_text);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addComment, addRemoteLayer, setMarqueeText]);

  return (
    <div className="relative min-h-screen bg-paper">
      <MarqueeBanner />

      <main className="relative mx-auto max-w-7xl px-3 pb-28 pt-4 md:px-6 md:pb-12 md:pt-6">
        <FloatingComments />

        <div className="relative z-[1] mb-4 text-center md:mb-6">
          <h1
            className="text-4xl leading-none text-ink md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Kenzie&apos;s Day
          </h1>
          <p
            className="mt-1 text-lg text-teal md:text-xl"
            style={{ fontFamily: "var(--font-script)" }}
          >
            a shared scrapbook from everyone who loves you
          </p>
        </div>

        <div className="relative z-[1] grid items-start gap-4 md:grid-cols-[13rem_1fr_14rem]">
          <div className="hidden md:block">
            <AccessoryPalette />
          </div>

          <div className="min-w-0">
            <KenzieCanvas />
          </div>

          <div className="hidden md:block">
            <ToolBar />
          </div>
        </div>

        <div className="relative z-[1] mt-8">
          <CommentForm />
        </div>

        {!isSupabaseConfigured() && (
          <p className="relative z-[1] mt-4 text-center text-[11px] uppercase tracking-wider text-ink/35">
            Local demo mode — add Supabase env vars for shared persistence
          </p>
        )}
      </main>

      {/* Mobile bottom tabs */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t-[3px] border-ink bg-cream md:hidden">
        {(
          [
            ["purse", "Purse"],
            ["tools", "Tools"],
            ["love", "Love"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() =>
              setMobilePanel(mobilePanel === id ? null : id)
            }
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${
              mobilePanel === id ? "bg-lime" : ""
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {mobilePanel && (
        <div className="fixed inset-x-0 bottom-12 z-40 max-h-[55vh] overflow-y-auto border-t-[3px] border-ink bg-paper p-3 shadow-[0_-8px_24px_#1a1a1a33] md:hidden">
          {mobilePanel === "purse" && <AccessoryPalette />}
          {mobilePanel === "tools" && <ToolBar />}
          {mobilePanel === "love" && <CommentForm />}
        </div>
      )}
    </div>
  );
}
