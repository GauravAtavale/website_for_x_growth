"use client";

import * as React from "react";
import { toast } from "sonner";
import { Delete02Icon, Download04Icon, Upload04Icon } from "hugeicons-react";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ShareToXButton } from "@/components/share/ShareToXButton";
import { cn } from "@/lib/utils";
import {
  BANNER_H,
  BANNER_W,
  DEFAULT_BANNER,
  FONTS,
  GRADIENTS,
  bannerBlob,
  drawBanner,
  ensureFont,
  resolvedTextColor,
  type BannerState,
} from "@/lib/x-banner/render";
import { CARD_CLASS, INTER } from "./ui";

const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

function Group({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Input id={id} value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ColorInput({ label, color, onChange }: { label: string; color: string; onChange: (c: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-foreground/90">
      {label}
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-14 cursor-pointer rounded-md border border-input bg-transparent p-1"
      />
    </label>
  );
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

export function XBannerWorkspace() {
  const [state, setState] = React.useState<BannerState>(DEFAULT_BANNER);
  const [photo, setPhoto] = React.useState<ImageBitmap | null>(null);
  const [guides, setGuides] = React.useState(true);
  const [fontTick, setFontTick] = React.useState(0);
  const [busy, setBusy] = React.useState<string | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);

  const update = (patch: Partial<BannerState>) => setState((s) => ({ ...s, ...patch }));

  // Redraw once the chosen web font has loaded.
  React.useEffect(() => {
    let alive = true;
    void ensureFont(state.font).then(() => alive && setFontTick((t) => t + 1));
    return () => {
      alive = false;
    };
  }, [state.font]);

  React.useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawBanner(ctx, state, { photo, guides });
  }, [state, photo, guides, fontTick]);

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("Choose an image file.");
    if (file.size > MAX_PHOTO_BYTES) return void toast.error("That image is over 15 MB. Choose a smaller one.");
    try {
      const bitmap = await createImageBitmap(file);
      photo?.close();
      setPhoto(bitmap);
      update({ background: { kind: "photo", dim: 0.35 } });
    } catch {
      toast.error("Couldn't read that image.");
    }
  }

  async function exportAs(type: "image/png" | "image/jpeg") {
    setBusy(type);
    try {
      download(await bannerBlob(state, photo, type), `x-banner.${type === "image/png" ? "png" : "jpg"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  const bg = state.background;
  const button =
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-45";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <section className={cn(CARD_CLASS, "flex flex-col gap-4 p-4 sm:p-5")} aria-label="Preview and download">
        <div className="overflow-hidden rounded-xl ring-1 ring-border">
          <canvas
            ref={canvasRef}
            width={BANNER_W}
            height={BANNER_H}
            className="block h-auto w-full"
            role="img"
            aria-label="X banner preview"
            data-testid="x-banner-canvas"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="xb-guides" className="mr-auto flex cursor-pointer items-center gap-2 text-sm text-foreground/90">
            <Switch id="xb-guides" checked={guides} onCheckedChange={setGuides} />
            Show profile-photo and crop guides
            <span className="text-xs text-muted-foreground">(not exported)</span>
          </label>
          <button type="button" onClick={() => exportAs("image/png")} disabled={busy !== null} className={cn(button, "bg-primary text-primary-foreground hover:opacity-90")}>
            <Download04Icon size={16} aria-hidden="true" />
            {busy === "image/png" ? "Preparing…" : "Download PNG"}
          </button>
          <button type="button" onClick={() => exportAs("image/jpeg")} disabled={busy !== null} className={cn(button, "bg-muted text-foreground hover:bg-accent")}>
            JPG
          </button>
          <ShareToXButton
            getImage={() => bannerBlob(state, photo)}
            filename="x-banner.png"
            text="New X banner, made with Growth Studio"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Exports at {BANNER_W}×{BANNER_H}, the size X recommends. To use it, open{" "}
          <a href="https://x.com/settings/profile" target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-4">
            Edit profile on X
          </a>{" "}
          and upload it as your header photo.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={cn(CARD_CLASS, "flex flex-col gap-5 p-5 sm:p-6")} aria-labelledby="xb-text">
          <h2 id="xb-text" className="text-lg font-semibold tracking-[-0.02em] text-foreground" style={{ fontFamily: INTER }}>
            Text
          </h2>
          <TextField id="xb-headline" label="Headline" value={state.headline} maxLength={60} onChange={(headline) => update({ headline })} />
          <TextField id="xb-subline" label="Tagline" value={state.subline} maxLength={90} onChange={(subline) => update({ subline })} />
          <TextField id="xb-handle" label="Handle or link" value={state.handle} maxLength={40} onChange={(handle) => update({ handle })} />
          <Group label="Font">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FONTS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={state.font === f.id}
                  onClick={() => update({ font: f.id })}
                  className={cn(
                    "h-10 rounded-lg px-2 text-sm ring-1 ring-inset transition-colors",
                    state.font === f.id ? "bg-foreground/[0.1] text-foreground ring-foreground/30" : "bg-foreground/[0.03] text-muted-foreground ring-border hover:text-foreground",
                  )}
                  style={{ fontFamily: `var(${f.cssVar}), ${f.fallback}` }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </Group>
          <Group label="Alignment" hint="Left-aligned text starts to the right of your profile photo.">
            <SegmentedControl
              ariaLabel="Text alignment"
              value={state.align}
              onChange={(v) => update({ align: v as BannerState["align"] })}
              options={[
                { id: "left", label: "Left" },
                { id: "center", label: "Center" },
                { id: "right", label: "Right" },
              ]}
            />
          </Group>
          <Slider
            label="Text size"
            min={70}
            max={140}
            step={5}
            value={[Math.round(state.textScale * 100)]}
            valueDisplay={`${Math.round(state.textScale * 100)}%`}
            onValueChange={([v]) => update({ textScale: v / 100 })}
          />
          <label htmlFor="xb-autocolor" className="flex cursor-pointer items-center justify-between gap-3 text-sm text-foreground/90">
            Automatic text colour
            <Switch
              id="xb-autocolor"
              checked={state.textColor === null}
              onCheckedChange={(auto) => update({ textColor: auto ? null : resolvedTextColor(state) })}
            />
          </label>
          {state.textColor !== null ? <ColorInput label="Text colour" color={state.textColor} onChange={(textColor) => update({ textColor })} /> : null}
        </section>

        <section className={cn(CARD_CLASS, "flex flex-col gap-5 p-5 sm:p-6")} aria-labelledby="xb-bg">
          <h2 id="xb-bg" className="text-lg font-semibold tracking-[-0.02em] text-foreground" style={{ fontFamily: INTER }}>
            Background
          </h2>
          <Group label="Gradient">
            <div className="grid grid-cols-4 gap-2">
              {GRADIENTS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  aria-label={g.label}
                  aria-pressed={bg.kind === "gradient" && bg.preset === g.id}
                  title={g.label}
                  onClick={() => update({ background: { kind: "gradient", preset: g.id } })}
                  className={cn(
                    "h-11 rounded-lg ring-2 ring-offset-2 ring-offset-card transition",
                    bg.kind === "gradient" && bg.preset === g.id ? "ring-foreground" : "ring-transparent hover:ring-foreground/30",
                  )}
                  style={{ background: `linear-gradient(${g.angle}deg, ${g.stops.join(", ")})` }}
                />
              ))}
            </div>
          </Group>
          <Group label="Solid colour">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => update({ background: { kind: "solid", color: bg.kind === "solid" ? bg.color : "#0f172a" } })}
                aria-pressed={bg.kind === "solid"}
                className={cn(button, bg.kind === "solid" ? "bg-foreground/[0.12] text-foreground" : "bg-muted text-foreground hover:bg-accent")}
              >
                Use solid colour
              </button>
              {bg.kind === "solid" ? (
                <input
                  type="color"
                  aria-label="Background colour"
                  value={bg.color}
                  onChange={(e) => update({ background: { kind: "solid", color: e.target.value } })}
                  className="h-10 w-16 cursor-pointer rounded-md border border-input bg-transparent p-1"
                />
              ) : null}
            </div>
          </Group>
          <Group label="Photo" hint="Your photo stays on your device.">
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Upload background photo"
              data-testid="xb-photo-input"
              onChange={(e) => {
                void onPhoto(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => fileInput.current?.click()} className={cn(button, "border border-dashed border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground")}>
                <Upload04Icon size={16} aria-hidden="true" />
                {photo ? "Replace photo" : "Upload a photo"}
              </button>
              {photo ? (
                <>
                  {bg.kind !== "photo" ? (
                    <button type="button" onClick={() => update({ background: { kind: "photo", dim: 0.35 } })} className={cn(button, "bg-muted text-foreground hover:bg-accent")}>
                      Use photo
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      photo.close();
                      setPhoto(null);
                      if (bg.kind === "photo") update({ background: DEFAULT_BANNER.background });
                    }}
                    className={cn(button, "text-muted-foreground hover:bg-muted hover:text-foreground")}
                  >
                    <Delete02Icon size={15} aria-hidden="true" />
                    Remove
                  </button>
                </>
              ) : null}
            </div>
            {bg.kind === "photo" ? (
              <Slider
                label="Darken photo"
                min={0}
                max={80}
                step={5}
                value={[Math.round(bg.dim * 100)]}
                valueDisplay={`${Math.round(bg.dim * 100)}%`}
                onValueChange={([v]) => update({ background: { kind: "photo", dim: v / 100 } })}
              />
            ) : null}
          </Group>
          <Group label="Pattern">
            <SegmentedControl
              ariaLabel="Pattern"
              value={state.pattern}
              onChange={(v) => update({ pattern: v as BannerState["pattern"] })}
              options={[
                { id: "none", label: "None" },
                { id: "dots", label: "Dots" },
                { id: "grid", label: "Grid" },
                { id: "glow", label: "Glow" },
              ]}
            />
          </Group>
        </section>
      </div>
    </div>
  );
}
