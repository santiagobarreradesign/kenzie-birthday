"use client";

import { motion } from "framer-motion";
import type { Comment } from "@/lib/types";

type Props = {
  comment: Comment;
  onOpen: (comment: Comment) => void;
  index: number;
};

export default function CommentBubble({ comment, onOpen, index }: Props) {
  const rot = ((index * 17) % 14) - 7;
  const delay = (index % 5) * 0.35;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay * 0.2, type: "spring", stiffness: 260 }}
      onClick={() => onOpen(comment)}
      className="float-bubble absolute z-10 max-w-[140px] cursor-pointer rounded-2xl border-[2.5px] border-ink bg-cream px-3 py-2 text-left shadow-[3px_3px_0_#1a1a1a] hover:z-20 hover:bg-yellow md:max-w-[160px]"
      style={
        {
          left: `${comment.anchor_x * 100}%`,
          top: `${comment.anchor_y * 100}%`,
          "--rot": `${rot}deg`,
          animationDelay: `${delay}s`,
          transform: `translate(-50%, -50%) rotate(${rot}deg)`,
        } as React.CSSProperties
      }
    >
      <p
        className="truncate text-sm font-bold leading-tight text-teal"
        style={{ fontFamily: "var(--font-script)" }}
      >
        {comment.author_name}
      </p>
      <p className="line-clamp-2 text-[11px] leading-snug text-ink/80">
        {comment.message}
      </p>
      {comment.image_url && (
        <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider text-rose">
          ★ photo
        </span>
      )}
    </motion.button>
  );
}
