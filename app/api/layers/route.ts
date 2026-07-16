import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { localAddLayers, localGetLayers } from "@/lib/local-store";
import { createAnonServerClient, createServerClient } from "@/lib/supabase/server";
import type { CanvasLayer } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createAnonServerClient();
  if (!supabase) {
    const layers = await localGetLayers();
    return NextResponse.json({ layers, mode: "local" });
  }

  const { data, error } = await supabase
    .from("canvas_layers")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ layers: data as CanvasLayer[], mode: "supabase" });
}

type IncomingLayer = {
  author_name?: string;
  layer_type: CanvasLayer["layer_type"];
  asset_id?: string | null;
  transform: CanvasLayer["transform"];
  stroke_data?: CanvasLayer["stroke_data"];
  settings?: CanvasLayer["settings"];
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incoming = (body.layers || []) as IncomingLayer[];

    if (!Array.isArray(incoming)) {
      return NextResponse.json(
        { error: "Invalid layers payload." },
        { status: 400 }
      );
    }

    if (incoming.length > 40) {
      return NextResponse.json(
        { error: "Too many layers in one request." },
        { status: 400 }
      );
    }

    if (incoming.length === 0 && !body.scene) {
      return NextResponse.json(
        { error: "Provide at least one layer or scene settings." },
        { status: 400 }
      );
    }

    const rows: CanvasLayer[] = incoming.map((l) => ({
      id: uuid(),
      author_name: (l.author_name || "friend").slice(0, 60),
      layer_type: l.layer_type,
      asset_id: l.asset_id ?? null,
      transform: l.transform,
      stroke_data: l.stroke_data ?? null,
      settings: l.settings ?? null,
      created_at: new Date().toISOString(),
    }));

    // Also persist scene settings as an effect layer if provided
    if (body.scene) {
      rows.push({
        id: uuid(),
        author_name: (body.author_name || "friend").slice(0, 60),
        layer_type: "effect",
        asset_id: "scene",
        transform: {
          x: 0,
          y: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          skewX: 0,
          skewY: 0,
        },
        stroke_data: null,
        settings: body.scene,
        created_at: new Date().toISOString(),
      });
    }

    const supabase = createServerClient();
    if (!supabase) {
      await localAddLayers(rows);
      return NextResponse.json({ layers: rows, mode: "local" });
    }

    const insertRows = rows.map((row) => ({
      author_name: row.author_name,
      layer_type: row.layer_type,
      asset_id: row.asset_id,
      transform: row.transform,
      stroke_data: row.stroke_data,
      settings: row.settings,
    }));

    const { data, error } = await supabase
      .from("canvas_layers")
      .insert(insertRows)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      layers: data as CanvasLayer[],
      mode: "supabase",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to save layers";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
