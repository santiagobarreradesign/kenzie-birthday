import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_MARQUEE } from "@/lib/constants/palette";
import {
  localGetSettings,
  localUpdateSettings,
} from "@/lib/local-store";
import { createAnonServerClient, createServerClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createAnonServerClient();
  if (!supabase) {
    const settings = await localGetSettings();
    return NextResponse.json({ settings, mode: "local" });
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings: SiteSettings = data || {
    id: "default",
    marquee_text: DEFAULT_MARQUEE,
    updated_at: new Date().toISOString(),
  };

  return NextResponse.json({ settings, mode: "supabase" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const marquee_text = String(body.marquee_text || "").trim();
    const pin = String(body.pin || "");

    const adminPin = process.env.ADMIN_PIN || "kenzie";

    if (pin !== adminPin) {
      return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
    }

    if (!marquee_text || marquee_text.length > 200) {
      return NextResponse.json(
        { error: "Marquee text required (max 200 chars)." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    if (!supabase) {
      const settings = await localUpdateSettings(marquee_text);
      return NextResponse.json({ settings, mode: "local" });
    }

    const { data, error } = await supabase
      .from("site_settings")
      .upsert({
        id: "default",
        marquee_text,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      settings: data as SiteSettings,
      mode: "supabase",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update settings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
