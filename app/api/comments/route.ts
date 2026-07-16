import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import {
  localAddComment,
  localGetComments,
} from "@/lib/local-store";
import { createAnonServerClient, createServerClient } from "@/lib/supabase/server";
import type { Comment } from "@/lib/types";

export const runtime = "nodejs";

function randomAnchor() {
  // Keep bubbles toward edges so they don't cover the canvas as much
  const edge = Math.random() < 0.5;
  if (edge) {
    return {
      anchor_x: Math.random() < 0.5 ? Math.random() * 0.22 : 0.78 + Math.random() * 0.18,
      anchor_y: 0.12 + Math.random() * 0.76,
    };
  }
  return {
    anchor_x: 0.1 + Math.random() * 0.8,
    anchor_y: Math.random() < 0.5 ? 0.05 + Math.random() * 0.15 : 0.78 + Math.random() * 0.15,
  };
}

export async function GET() {
  const supabase = createAnonServerClient();
  if (!supabase) {
    const comments = await localGetComments();
    return NextResponse.json({ comments, mode: "local" });
  }

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data as Comment[], mode: "supabase" });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const author_name = String(form.get("author_name") || "").trim();
    const message = String(form.get("message") || "").trim();
    const file = form.get("image");

    if (!author_name || author_name.length > 60) {
      return NextResponse.json(
        { error: "Name is required (max 60 chars)." },
        { status: 400 }
      );
    }
    if (!message || message.length > 500) {
      return NextResponse.json(
        { error: "Message is required (max 500 chars)." },
        { status: 400 }
      );
    }

    const anchors = randomAnchor();
    let image_url: string | null = null;

    const supabase = createServerClient();

    if (file && file instanceof File && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Image must be under 5MB." },
          { status: 400 }
        );
      }

      if (supabase) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `comments/${uuid()}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());
        const { error: uploadError } = await supabase.storage
          .from("tribute-uploads")
          .upload(path, buffer, {
            contentType: file.type || "image/jpeg",
            upsert: false,
          });

        if (uploadError) {
          return NextResponse.json(
            { error: uploadError.message },
            { status: 500 }
          );
        }

        const { data: pub } = supabase.storage
          .from("tribute-uploads")
          .getPublicUrl(path);
        image_url = pub.publicUrl;
      } else {
        // Local: store as data URL for demo (small images only)
        if (file.size <= 800_000) {
          const buffer = Buffer.from(await file.arrayBuffer());
          image_url = `data:${file.type};base64,${buffer.toString("base64")}`;
        }
      }
    }

    const comment: Comment = {
      id: uuid(),
      author_name,
      message,
      image_url,
      ...anchors,
      created_at: new Date().toISOString(),
    };

    if (!supabase) {
      await localAddComment(comment);
      return NextResponse.json({ comment, mode: "local" });
    }

    const { data, error } = await supabase
      .from("comments")
      .insert({
        author_name: comment.author_name,
        message: comment.message,
        image_url: comment.image_url,
        anchor_x: comment.anchor_x,
        anchor_y: comment.anchor_y,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comment: data as Comment, mode: "supabase" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to save comment";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
