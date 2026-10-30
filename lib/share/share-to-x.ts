/**
 * "Share to X" for images made on the site.
 *
 * X's post links (x.com/intent/post) accept text but not images, so:
 * - Phones/tablets: the system share sheet with the image attached (pick X).
 * - Desktop: copy the image to the clipboard, then open an X post with the
 *   text filled in; the person pastes the image (Cmd/Ctrl+V).
 * - No image clipboard: download the image instead and open the post.
 */

import { toast } from "sonner";
import { SITE_URL } from "@/lib/seo/metadata";

export const DEFAULT_SHARE_TEXT = "Made with Growth Studio";

export function xPostUrl(text: string, url: string = SITE_URL): string {
  const params = new URLSearchParams({ text: `${text}\n${url}` });
  return `https://x.com/intent/post?${params.toString()}`;
}

function prefersShareSheet(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const touch = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  return touch && typeof navigator.share === "function";
}

function download(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/** Opens X in a new tab. ("noopener" would make window.open return null, hiding whether it worked.) */
function openTab(url: string): boolean {
  const win = window.open(url, "_blank");
  if (!win) return false;
  win.opener = null;
  return true;
}

function openPost(postUrl: string, message: string) {
  if (openTab(postUrl)) {
    toast.success(message);
    return;
  }
  // Popup blocked (e.g. the image took a while to render): offer a fresh click.
  toast.success(message, {
    duration: 15_000,
    action: { label: "Open X", onClick: () => void openTab(postUrl) },
  });
}

export type ShareOutcome = "shared" | "copied" | "downloaded" | "cancelled";

/**
 * Share a PNG/JPEG image to X. `image` may be a promise so callers can start
 * rendering inside the click handler.
 */
export async function shareImageToX(
  image: Blob | Promise<Blob>,
  { filename = "growth-studio.png", text = DEFAULT_SHARE_TEXT }: { filename?: string; text?: string } = {},
): Promise<ShareOutcome> {
  const postUrl = xPostUrl(text);

  if (prefersShareSheet()) {
    const blob = await image;
    const file = new File([blob], filename, { type: blob.type || "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: `${text}\n${SITE_URL}` });
        return "shared";
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
        // Fall through to the desktop flow.
      }
    }
  }

  const canCopyImage =
    typeof ClipboardItem !== "undefined" && typeof navigator.clipboard?.write === "function";
  if (canCopyImage) {
    try {
      // Passing the promise keeps Safari's user-activation window open while rendering.
      const png = Promise.resolve(image).then((blob) =>
        blob.type === "image/png" ? blob : toPng(blob),
      );
      await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
      openPost(postUrl, "Image copied. Paste it into your post with Cmd/Ctrl+V.");
      return "copied";
    } catch {
      // Fall back to a download below.
    }
  }

  download(await image, filename);
  openPost(postUrl, "Image downloaded. Attach it to your post on X.");
  return "downloaded";
}

/** Clipboard image writes must be PNG. */
async function toPng(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG conversion failed"))), "image/png"),
  );
}
