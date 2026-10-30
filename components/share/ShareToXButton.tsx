"use client";

import * as React from "react";
import { NewTwitterIcon } from "hugeicons-react";
import { toast } from "sonner";
import { shareImageToX } from "@/lib/share/share-to-x";
import { cn } from "@/lib/utils";

interface ShareToXButtonProps {
  /** Produces the image to share; called on click. */
  getImage: () => Promise<Blob>;
  filename?: string;
  text?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
}

/** Shares an image to X (share sheet on phones, copy + compose on desktop). */
export function ShareToXButton({
  getImage,
  filename,
  text,
  disabled,
  className,
  label = "Share to X",
}: ShareToXButtonProps) {
  const [busy, setBusy] = React.useState(false);

  async function onClick() {
    setBusy(true);
    try {
      await shareImageToX(getImage(), { filename, text });
    } catch (error) {
      toast.error("Couldn't share the image", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-3 text-sm font-medium text-white ring-1 ring-inset ring-white/15 transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none",
        className,
      )}
    >
      <NewTwitterIcon size={16} aria-hidden="true" />
      {busy ? "Preparing…" : label}
    </button>
  );
}
