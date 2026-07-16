"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/store";

export default function CommentForm() {
  const authorName = useEditorStore((s) => s.authorName);
  const setAuthorName = useEditorStore((s) => s.setAuthorName);
  const addComment = useEditorStore((s) => s.addComment);

  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !message.trim()) {
      setStatus("Name and message are required.");
      return;
    }

    setSubmitting(true);
    setStatus("");
    try {
      const form = new FormData();
      form.append("author_name", authorName.trim());
      form.append("message", message.trim());
      if (file) form.append("image", file);

      const res = await fetch("/api/comments", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");

      addComment(data.comment);
      setMessage("");
      setFile(null);
      setStatus("Love note sent ★");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="paper-card mx-auto w-full max-w-2xl rounded-sm p-4 md:p-5"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            className="text-2xl text-ink md:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Leave love
          </h2>
          <p
            className="text-sm text-teal"
            style={{ fontFamily: "var(--font-script)" }}
          >
            a floating note for Kenzie
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
        <label className="block text-xs font-bold uppercase tracking-wider text-ink/50">
          Name
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={60}
            required
            className="mt-1 w-full rounded-sm border-2 border-ink bg-paper px-3 py-2 text-sm font-normal normal-case tracking-normal"
            placeholder="your name"
          />
        </label>

        <label className="block text-xs font-bold uppercase tracking-wider text-ink/50">
          Message
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            required
            rows={2}
            className="mt-1 w-full rounded-sm border-2 border-ink bg-paper px-3 py-2 text-sm font-normal normal-case tracking-normal"
            placeholder="happy birthday, you absolute legend..."
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="sticker-btn cursor-pointer rounded-sm px-3 py-2 text-xs font-bold">
          {file ? file.name.slice(0, 24) : "Attach photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="sticker-btn ml-auto rounded-sm bg-rose px-5 py-2.5 text-sm font-bold text-ink disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send bubble ♥"}
        </button>
      </div>

      {status && (
        <p
          className="mt-2 text-sm text-teal"
          style={{ fontFamily: "var(--font-script)" }}
        >
          {status}
        </p>
      )}
    </form>
  );
}
