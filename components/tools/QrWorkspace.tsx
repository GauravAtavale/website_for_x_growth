"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Alert02Icon,
  Calendar03Icon,
  CallIcon,
  ContactIcon,
  Copy01Icon,
  Delete02Icon,
  Download04Icon,
  Link01Icon,
  Location01Icon,
  Mail01Icon,
  Message01Icon,
  MoneyReceive01Icon,
  TextIcon,
  Upload04Icon,
  WhatsappIcon,
  Wifi01Icon,
} from "hugeicons-react";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  buildPayload,
  getQrType,
  QR_TYPES,
  type QrContentType,
  type QrFields,
  type QrFieldSpec,
} from "@/lib/qr/payload";
import {
  DEFAULT_STYLE,
  QrTooLongError,
  rasterize,
  renderQrSvg,
  scanWarnings,
  sizedSvg,
  type QrStyle,
  type RasterFormat,
  type RenderedQr,
} from "@/lib/qr/render";
import { ShareToXButton } from "@/components/share/ShareToXButton";
import { CARD_CLASS, INTER } from "./ui";

const TYPE_ICONS: Record<QrContentType, React.ComponentType<{ size?: number; className?: string }>> = {
  url: Link01Icon,
  text: TextIcon,
  wifi: Wifi01Icon,
  email: Mail01Icon,
  phone: CallIcon,
  sms: Message01Icon,
  whatsapp: WhatsappIcon,
  vcard: ContactIcon,
  location: Location01Icon,
  event: Calendar03Icon,
  upi: MoneyReceive01Icon,
};

const SIZES = [512, 1024, 2048, 4096];
const PLACEHOLDER_PAYLOAD = "https://example.com";
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

const FIELD_CLASS =
  "border-input dark:bg-input/30 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm";

function SectionHeading({ step, title, hint }: { step: number; title: string; hint?: string }) {
  return (
    <div>
      <h2
        className="flex items-center gap-2.5 text-lg font-semibold tracking-[-0.02em] text-foreground"
        style={{ fontFamily: INTER }}
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-foreground/[0.08] text-xs font-semibold text-foreground">
          {step}
        </span>
        {title}
      </h2>
      {hint ? <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

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

function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-3 text-sm text-foreground/90">
      {label}
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function ColorRow({ label, color, onChange }: { label: string; color: string; onChange: (c: string) => void }) {
  const id = React.useId();
  const [draft, setDraft] = React.useState(color);
  React.useEffect(() => setDraft(color), [color]);
  const commit = (value: string) => {
    const v = value.trim().startsWith("#") ? value.trim() : `#${value.trim()}`;
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) onChange(v.toLowerCase());
  };
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm text-foreground/90">
        {label}
      </label>
      <div className="flex h-9 w-36 items-center gap-2 rounded-md border border-input px-1.5 dark:bg-input/30">
        <input
          type="color"
          aria-label={`${label} colour picker`}
          value={/^#[0-9a-f]{6}$/i.test(color) ? color : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="size-6 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-moz-color-swatch]:rounded [&::-moz-color-swatch]:border-0"
        />
        <input
          id={id}
          value={draft}
          spellCheck={false}
          onChange={(e) => {
            setDraft(e.target.value);
            commit(e.target.value);
          }}
          onBlur={() => setDraft(color)}
          className="min-w-0 flex-1 bg-transparent font-mono text-sm uppercase text-foreground outline-none"
        />
      </div>
    </div>
  );
}

function Field({
  spec,
  value,
  onChange,
}: {
  spec: QrFieldSpec;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `qr-field-${spec.key}`;
  const label = (
    <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
      {spec.label}
      {spec.required ? <span aria-hidden="true"> *</span> : null}
    </label>
  );
  let control: React.ReactNode;
  if (spec.type === "textarea") {
    control = (
      <textarea
        id={id}
        rows={3}
        value={value}
        placeholder={spec.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(FIELD_CLASS, "min-h-20 resize-y")}
      />
    );
  } else if (spec.type === "select") {
    control = (
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cn(FIELD_CLASS, "h-9 py-0")}>
        {spec.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else {
    control = (
      <Input
        id={id}
        type={spec.type === "number" ? "text" : (spec.type ?? "text")}
        inputMode={spec.type === "number" ? "decimal" : undefined}
        autoComplete="off"
        value={value}
        placeholder={spec.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <div className={cn("flex flex-col gap-1.5", spec.half ? "sm:col-span-1" : "sm:col-span-2")}>
      {label}
      {control}
    </div>
  );
}

/** Downscale any uploaded logo to a small PNG data URL so the SVG stays light. */
async function readLogo(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const max = 512;
    const scale = Math.min(1, max / Math.max(img.naturalWidth || max, img.naturalHeight || max));
    const w = Math.max(1, Math.round((img.naturalWidth || max) * scale));
    const h = Math.max(1, Math.round((img.naturalHeight || max) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function QrWorkspace() {
  const [type, setType] = React.useState<QrContentType>("url");
  const [fieldsByType, setFieldsByType] = React.useState<Partial<Record<QrContentType, QrFields>>>({});
  const [style, setStyle] = React.useState<QrStyle>(DEFAULT_STYLE);
  const [size, setSize] = React.useState(1024);
  const [busy, setBusy] = React.useState<string | null>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);

  const spec = getQrType(type);
  const fields: QrFields = { ...(spec.defaults ?? {}), ...(fieldsByType[type] ?? {}) };
  const update = (patch: Partial<QrStyle>) => setStyle((s) => ({ ...s, ...patch }));
  const setField = (key: string, value: string) =>
    setFieldsByType((all) => ({ ...all, [type]: { ...(all[type] ?? {}), [key]: value } }));

  const result = buildPayload(type, fields);
  const payload = result.ok ? result.payload : PLACEHOLDER_PAYLOAD;

  const { rendered, error } = React.useMemo((): { rendered: RenderedQr | null; error: string | null } => {
    try {
      return { rendered: renderQrSvg(payload, style), error: null };
    } catch (e) {
      if (e instanceof QrTooLongError) return { rendered: null, error: e.message };
      return { rendered: null, error: "Couldn't create this code. Try different content." };
    }
  }, [payload, style]);

  const ready = result.ok && rendered !== null;
  const warnings = React.useMemo(() => scanWarnings(style), [style]);
  const fileBase = `qr-code-${type}`;

  async function exportRaster(format: RasterFormat) {
    if (!rendered || !ready) return;
    setBusy(format);
    try {
      const blob = await rasterize(rendered, size, format);
      download(blob, `${fileBase}.${format === "jpeg" ? "jpg" : format}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  function exportSvg() {
    if (!rendered || !ready) return;
    download(new Blob([sizedSvg(rendered, size)], { type: "image/svg+xml" }), `${fileBase}.svg`);
  }

  async function copyImage() {
    if (!rendered || !ready) return;
    setBusy("copy");
    try {
      if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
        throw new Error("Copying images isn't supported in this browser. Download it instead.");
      }
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": rasterize(rendered, Math.min(size, 1024), "png") }),
      ]);
      toast.success("QR code copied");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't copy the image");
    } finally {
      setBusy(null);
    }
  }

  async function onLogo(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file for the logo.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("That logo is over 5 MB. Choose a smaller image.");
      return;
    }
    try {
      const src = await readLogo(file);
      update({ logo: { src, size: style.logo?.size ?? 0.22, plate: style.logo?.plate ?? true } });
    } catch {
      toast.error("Couldn't read that image.");
    }
  }

  const buttonBase =
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none";

  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      {/* 1. Content */}
      <section className={cn(CARD_CLASS, "flex flex-col gap-5 p-5 sm:p-6 lg:col-start-1 lg:row-start-1")} aria-labelledby="qr-content">
        <div id="qr-content">
          <SectionHeading step={1} title="What should it open?" />
        </div>
        <div role="tablist" aria-label="QR code type" className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
          {QR_TYPES.map((t) => {
            const Icon = TYPE_ICONS[t.id];
            const active = t.id === type;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setType(t.id)}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-medium ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 motion-reduce:transition-none",
                  active
                    ? "bg-foreground/[0.1] text-foreground ring-foreground/30"
                    : "bg-foreground/[0.03] text-muted-foreground ring-border hover:bg-foreground/[0.06] hover:text-foreground",
                )}
              >
                <Icon size={19} aria-hidden="true" />
                {t.label}
              </button>
            );
          })}
        </div>
        <p className="-mt-1 text-sm text-muted-foreground">{spec.hint}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {spec.fields.map((f) => (
            <Field key={`${type}-${f.key}`} spec={f} value={fields[f.key] ?? ""} onChange={(val) => setField(f.key, val)} />
          ))}
        </div>
      </section>

      {/* Preview */}
      <aside
        className={cn(CARD_CLASS, "flex flex-col gap-4 p-5 sm:p-6 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1")}
        aria-label="Preview and download"
      >
        <div
          className={cn(
            "relative flex aspect-square items-center justify-center overflow-hidden rounded-xl p-6",
            style.transparent ? "bg-[length:16px_16px]" : "bg-foreground/[0.04]",
          )}
          style={
            style.transparent
              ? { backgroundImage: "repeating-conic-gradient(#d4d4d8 0% 25%, #ffffff 0% 50%)" }
              : undefined
          }
        >
          {rendered ? (
            <img
              src={svgDataUrl(rendered.svg)}
              alt={ready ? "QR code preview" : "Sample QR code"}
              className={cn("max-h-full w-full object-contain transition-opacity", ready ? "opacity-100" : "opacity-15")}
              data-testid="qr-preview"
              data-payload={ready ? payload : ""}
            />
          ) : null}
          {!ready ? (
            <p className="absolute inset-x-6 text-center text-sm font-medium text-foreground" role="status">
              {error ?? (!result.ok ? result.message : "")}
            </p>
          ) : null}
        </div>

        {warnings.length > 0 && ready ? (
          <ul className="flex flex-col gap-2">
            {warnings.map((w) => (
              <li key={w} className="flex gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                <Alert02Icon size={15} className="mt-px shrink-0" aria-hidden="true" />
                {w}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <label htmlFor="qr-size" className="text-sm text-foreground/90">
            Image size
          </label>
          <select
            id="qr-size"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className={cn(FIELD_CLASS, "h-9 w-36 py-0")}
          >
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s} px
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          disabled={!ready || busy !== null}
          onClick={() => exportRaster("png")}
          className={cn(buttonBase, "h-11 bg-primary text-primary-foreground hover:opacity-90")}
        >
          <Download04Icon size={17} aria-hidden="true" />
          {busy === "png" ? "Preparing…" : "Download PNG"}
        </button>
        <div className="grid grid-cols-3 gap-2">
          <button type="button" disabled={!ready || busy !== null} onClick={exportSvg} className={cn(buttonBase, "bg-muted text-foreground hover:bg-accent")}>
            SVG
          </button>
          <button type="button" disabled={!ready || busy !== null} onClick={() => exportRaster("jpeg")} className={cn(buttonBase, "bg-muted text-foreground hover:bg-accent")}>
            JPG
          </button>
          <button type="button" disabled={!ready || busy !== null} onClick={() => exportRaster("webp")} className={cn(buttonBase, "bg-muted text-foreground hover:bg-accent")}>
            WebP
          </button>
        </div>
        <button type="button" disabled={!ready || busy !== null} onClick={copyImage} className={cn(buttonBase, "bg-muted text-foreground hover:bg-accent")}>
          <Copy01Icon size={16} aria-hidden="true" />
          Copy image
        </button>
        <ShareToXButton
          disabled={!ready || busy !== null}
          filename={`${fileBase}.png`}
          text="Made this QR code with Growth Studio"
          getImage={() => {
            if (!rendered) return Promise.reject(new Error("Nothing to share yet"));
            return rasterize(rendered, Math.min(size, 2048), "png");
          }}
        />
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Static code: it never expires and works without this site. Test it with your phone camera before printing.
        </p>
      </aside>

      {/* 2. Style */}
      <section className={cn(CARD_CLASS, "flex flex-col gap-6 p-5 sm:p-6 lg:col-start-1 lg:row-start-2")} aria-labelledby="qr-style">
        <div id="qr-style">
          <SectionHeading step={2} title="Make it yours" hint="Optional. Every style here stays scannable." />
        </div>

        <Group label="Pattern">
          <SegmentedControl
            ariaLabel="Dot style"
            value={style.dotStyle}
            onChange={(v) => update({ dotStyle: v as QrStyle["dotStyle"] })}
            options={[
              { id: "square", label: "Square" },
              { id: "rounded", label: "Rounded" },
              { id: "dots", label: "Dots" },
              { id: "classy", label: "Classy" },
            ]}
          />
        </Group>

        <div className="grid gap-6 sm:grid-cols-2">
          <Group label="Corner frames">
            <SegmentedControl
              ariaLabel="Corner frame style"
              value={style.eyeFrame}
              onChange={(v) => update({ eyeFrame: v as QrStyle["eyeFrame"] })}
              options={[
                { id: "square", label: "Square" },
                { id: "rounded", label: "Rounded" },
                { id: "circle", label: "Circle" },
              ]}
            />
          </Group>
          <Group label="Corner centres">
            <SegmentedControl
              ariaLabel="Corner centre style"
              value={style.eyeBall}
              onChange={(v) => update({ eyeBall: v as QrStyle["eyeBall"] })}
              options={[
                { id: "square", label: "Square" },
                { id: "rounded", label: "Rounded" },
                { id: "circle", label: "Circle" },
              ]}
            />
          </Group>
        </div>

        <Group label="Colours" hint="Dark code on a light background scans best.">
          <div className="flex flex-col gap-3">
            <ColorRow label="Code" color={style.fg} onChange={(fg) => update({ fg })} />
            <ToggleRow
              id="qr-gradient"
              label="Gradient"
              checked={style.fg2 !== null}
              onChange={(on) => update({ fg2: on ? "#7c3aed" : null })}
            />
            {style.fg2 !== null ? (
              <ColorRow label="Gradient end" color={style.fg2} onChange={(fg2) => update({ fg2 })} />
            ) : null}
            <ToggleRow
              id="qr-eye-color"
              label="Different corner colour"
              checked={style.eyeColor !== null}
              onChange={(on) => update({ eyeColor: on ? "#db2777" : null })}
            />
            {style.eyeColor !== null ? (
              <ColorRow label="Corner colour" color={style.eyeColor} onChange={(eyeColor) => update({ eyeColor })} />
            ) : null}
            <ToggleRow
              id="qr-transparent"
              label="Transparent background"
              checked={style.transparent}
              onChange={(transparent) => update({ transparent })}
            />
            {!style.transparent ? (
              <ColorRow label="Background" color={style.bg} onChange={(bg) => update({ bg })} />
            ) : null}
          </div>
        </Group>

        <Group label="Logo" hint="Shown in the middle. Error correction switches to High so it still scans.">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="Upload logo"
            data-testid="qr-logo-input"
            onChange={(e) => {
              void onLogo(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {style.logo ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <img src={style.logo.src} alt="Uploaded logo" className="size-12 rounded-lg bg-white object-contain p-1 ring-1 ring-border" />
                <button type="button" onClick={() => fileInput.current?.click()} className={cn(buttonBase, "h-9 bg-muted text-foreground hover:bg-accent")}>
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => update({ logo: null })}
                  className={cn(buttonBase, "h-9 text-muted-foreground hover:bg-muted hover:text-foreground")}
                >
                  <Delete02Icon size={15} aria-hidden="true" />
                  Remove
                </button>
              </div>
              <Slider
                label="Logo size"
                min={12}
                max={30}
                step={1}
                value={[Math.round(style.logo.size * 100)]}
                valueDisplay={`${Math.round(style.logo.size * 100)}%`}
                onValueChange={([v]) => style.logo && update({ logo: { ...style.logo, size: v / 100 } })}
              />
              <ToggleRow
                id="qr-logo-plate"
                label="Background behind logo"
                checked={style.logo.plate}
                onChange={(plate) => style.logo && update({ logo: { ...style.logo, plate } })}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className={cn(buttonBase, "h-11 justify-start border border-dashed border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground")}
            >
              <Upload04Icon size={17} aria-hidden="true" />
              Upload a logo (PNG, JPG, SVG)
            </button>
          )}
        </Group>

        <Group label="Frame">
          <SegmentedControl
            ariaLabel="Frame"
            value={style.frame}
            onChange={(v) => update({ frame: v as QrStyle["frame"] })}
            options={[
              { id: "none", label: "None" },
              { id: "label", label: "With label" },
            ]}
          />
          {style.frame === "label" ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="qr-frame-text" className="text-xs font-medium text-muted-foreground">
                  Label
                </label>
                <Input
                  id="qr-frame-text"
                  maxLength={24}
                  value={style.frameText}
                  onChange={(e) => update({ frameText: e.target.value })}
                />
              </div>
              <ColorRow label="Frame colour" color={style.frameColor} onChange={(frameColor) => update({ frameColor })} />
            </div>
          ) : null}
        </Group>

        <details className="group rounded-xl bg-foreground/[0.03] px-4 py-3 ring-1 ring-inset ring-border">
          <summary className="cursor-pointer text-sm font-medium text-foreground marker:text-muted-foreground">Advanced</summary>
          <div className="mt-4 flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="qr-ec" className="text-sm text-foreground/90">
                Error correction
                <span className="mt-0.5 block text-xs text-muted-foreground">Higher survives damage and logos, but makes a denser code.</span>
              </label>
              <select
                id="qr-ec"
                value={style.errorLevel}
                onChange={(e) => update({ errorLevel: e.target.value as QrStyle["errorLevel"] })}
                className={cn(FIELD_CLASS, "h-9 w-36 shrink-0 py-0")}
              >
                <option value="auto">Auto ({style.logo ? "High" : "Medium"})</option>
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </div>
            <Slider
              label="Margin"
              min={0}
              max={8}
              step={1}
              value={[style.margin]}
              valueDisplay={`${style.margin} ${style.margin === 1 ? "module" : "modules"}`}
              onValueChange={([v]) => update({ margin: v })}
            />
            {rendered ? (
              <p className="text-xs text-muted-foreground">
                {rendered.moduleCount}×{rendered.moduleCount} modules, error correction {rendered.errorLevel}.
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setStyle(DEFAULT_STYLE)}
              className={cn(buttonBase, "h-9 self-start bg-muted text-foreground hover:bg-accent")}
            >
              Reset style
            </button>
          </div>
        </details>
      </section>
    </div>
  );
}
