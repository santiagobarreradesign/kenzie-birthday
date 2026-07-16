"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Comment } from "@/lib/types";

type Props = {
  comment: Comment | null;
  onClose: () => void;
};

export default function ExpandedCommentModal({ comment, onClose }: Props) {
  return (
    <AnimatePresence>
      {comment && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.article
            role="dialog"
            aria-modal
            aria-label={`Note from ${comment.author_name}`}
            initial={{ scale: 0.85, rotate: -3, opacity: 0 }}
            animate={{ scale: 1, rotate: -1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="paper-card relative w-full max-w-md rounded-sm p-5"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 sticker-btn h-8 w-8 rounded-full text-sm font-bold"
              aria-label="Close"
            >
              ×
            </button>

            <p
              className="pr-8 text-3xl text-teal"
              style={{ fontFamily: "var(--font-script)" }}
            >
              {comment.author_name}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-ink">
              {comment.message}
            </p>

            {comment.image_url && (
              <div className="mt-4 overflow-hidden rounded-sm border-[2.5px] border-ink bg-paper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={comment.image_url}
                  alt={`From ${comment.author_name}`}
                  className="max-h-72 w-full object-cover"
                />
              </div>
            )}

            <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-ink/40">
              {new Date(comment.created_at).toLocaleString()}
            </p>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
