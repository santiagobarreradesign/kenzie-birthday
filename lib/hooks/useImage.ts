"use client";

import { useEffect, useState } from "react";

export function useImage(
  url: string | undefined
): [HTMLImageElement | undefined, "loading" | "loaded" | "failed"] {
  const [image, setImage] = useState<HTMLImageElement>();
  const [status, setStatus] = useState<"loading" | "loaded" | "failed">(
    "loading"
  );

  useEffect(() => {
    if (!url) {
      setImage(undefined);
      setStatus("failed");
      return;
    }

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    setStatus("loading");

    img.onload = () => {
      setImage(img);
      setStatus("loaded");
    };
    img.onerror = () => {
      setImage(undefined);
      setStatus("failed");
    };
    img.src = url;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url]);

  return [image, status];
}
