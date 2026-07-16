"use client";

import { useState } from "react";
import CommentBubble from "@/components/CommentBubble";
import ExpandedCommentModal from "@/components/ExpandedCommentModal";
import { useEditorStore } from "@/lib/store";
import type { Comment } from "@/lib/types";

export default function FloatingComments() {
  const comments = useEditorStore((s) => s.comments);
  const [open, setOpen] = useState<Comment | null>(null);

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
        <div className="pointer-events-auto relative h-full w-full">
          {comments.map((c, i) => (
            <CommentBubble
              key={c.id}
              comment={c}
              index={i}
              onOpen={setOpen}
            />
          ))}
        </div>
      </div>
      <ExpandedCommentModal comment={open} onClose={() => setOpen(null)} />
    </>
  );
}
