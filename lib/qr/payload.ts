/**
 * QR payload builders: turn form fields into the exact text a phone's camera
 * app recognises for each content type. Pure functions, no DOM, so they can be
 * unit tested and reused by the editor later.
 */

export type QrContentType =
  | "url"
  | "text"
  | "wifi"
  | "email"
  | "phone"
  | "sms"
  | "whatsapp"
  | "vcard"
  | "location"
  | "event"
  | "upi";

export type QrFields = Record<string, string>;

export interface QrFieldSpec {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "url" | "email" | "tel" | "number" | "password" | "datetime-local" | "textarea" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
  /** Half-width field on wide screens. */
  half?: boolean;
}

export interface QrTypeSpec {
  id: QrContentType;
  label: string;
  /** One line shown under the form title. */
  hint: string;
  fields: QrFieldSpec[];
  defaults?: QrFields;
}

export const QR_TYPES: QrTypeSpec[] = [
  {
    id: "url",
    label: "Website",
    hint: "Opens a web page. Works for any link, including social profiles and app store pages.",
    fields: [{ key: "url", label: "Link", placeholder: "https://example.com", type: "url", required: true }],
  },
  {
    id: "text",
    label: "Text",
    hint: "Shows plain text on the phone. Nothing is opened.",
    fields: [{ key: "text", label: "Text", placeholder: "Type your message", type: "textarea", required: true }],
  },
  {
    id: "wifi",
    label: "Wi-Fi",
    hint: "Phones join the network after scanning, without typing the password.",
    fields: [
      { key: "ssid", label: "Network name (SSID)", placeholder: "Home Wi-Fi", required: true },
      { key: "password", label: "Password", placeholder: "Network password", type: "password" },
      {
        key: "security",
        label: "Security",
        type: "select",
        half: true,
        options: [
          { value: "WPA", label: "WPA / WPA2 / WPA3" },
          { value: "WEP", label: "WEP" },
          { value: "nopass", label: "None (open)" },
        ],
      },
      {
        key: "hidden",
        label: "Hidden network",
        type: "select",
        half: true,
        options: [
          { value: "false", label: "No" },
          { value: "true", label: "Yes" },
        ],
      },
    ],
    defaults: { security: "WPA", hidden: "false" },
  },
  {
    id: "email",
    label: "Email",
    hint: "Opens a new email with the address, subject, and message filled in.",
    fields: [
      { key: "to", label: "Email address", placeholder: "hello@example.com", type: "email", required: true },
      { key: "subject", label: "Subject", placeholder: "Optional" },
      { key: "body", label: "Message", placeholder: "Optional", type: "textarea" },
    ],
  },
  {
    id: "phone",
    label: "Phone",
    hint: "Starts a call to the number.",
    fields: [{ key: "phone", label: "Phone number", placeholder: "+1 555 123 4567", type: "tel", required: true }],
  },
  {
    id: "sms",
    label: "SMS",
    hint: "Opens a text message with the number and message filled in.",
    fields: [
      { key: "phone", label: "Phone number", placeholder: "+1 555 123 4567", type: "tel", required: true },
      { key: "message", label: "Message", placeholder: "Optional", type: "textarea" },
    ],
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    hint: "Opens a WhatsApp chat with the number, with an optional message ready to send.",
    fields: [
      { key: "phone", label: "Phone number with country code", placeholder: "+91 98765 43210", type: "tel", required: true },
      { key: "message", label: "Message", placeholder: "Optional", type: "textarea" },
    ],
  },
  {
    id: "vcard",
    label: "Contact",
    hint: "Saves a contact card (vCard) to the phone's address book.",
    fields: [
      { key: "firstName", label: "First name", required: true, half: true },
      { key: "lastName", label: "Last name", half: true },
      { key: "phone", label: "Phone", type: "tel", half: true },
      { key: "email", label: "Email", type: "email", half: true },
      { key: "org", label: "Company", half: true },
      { key: "title", label: "Job title", half: true },
      { key: "website", label: "Website", type: "url", placeholder: "https://" },
      { key: "address", label: "Address", placeholder: "Street, city, country" },
    ],
  },
  {
    id: "location",
    label: "Location",
    hint: "Opens a map at an address or exact coordinates.",
    fields: [
      { key: "query", label: "Address or place", placeholder: "Times Square, New York" },
      { key: "lat", label: "Latitude", placeholder: "40.758", type: "number", half: true },
      { key: "lng", label: "Longitude", placeholder: "-73.9855", type: "number", half: true },
    ],
  },
  {
    id: "event",
    label: "Event",
    hint: "Adds an event to the phone's calendar.",
    fields: [
      { key: "title", label: "Event name", required: true },
      { key: "start", label: "Starts", type: "datetime-local", required: true, half: true },
      { key: "end", label: "Ends", type: "datetime-local", half: true },
      { key: "location", label: "Location", placeholder: "Optional" },
      { key: "description", label: "Details", type: "textarea", placeholder: "Optional" },
    ],
  },
  {
    id: "upi",
    label: "UPI",
    hint: "Opens any UPI app (GPay, PhonePe, Paytm) ready to pay you.",
    fields: [
      { key: "vpa", label: "UPI ID", placeholder: "name@okbank", required: true },
      { key: "name", label: "Payee name", placeholder: "Your name", half: true },
      { key: "amount", label: "Amount (INR)", placeholder: "Optional", type: "number", half: true },
      { key: "note", label: "Note", placeholder: "Optional" },
    ],
  },
];

export function getQrType(id: QrContentType): QrTypeSpec {
  return QR_TYPES.find((type) => type.id === id) ?? QR_TYPES[0];
}

export type PayloadResult = { ok: true; payload: string } | { ok: false; message: string };

const v = (fields: QrFields, key: string) => (fields[key] ?? "").trim();

/** Escape for the Wi-Fi (MECARD-style) format: \ ; , : " are backslash-escaped. */
export function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

/** Escape a vCard 3.0 / iCalendar text value. */
export function escapeVText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/([,;])/g, "\\$1");
}

/** Add https:// to a bare domain such as "example.com/page". */
export function normalizeUrl(input: string): string {
  const value = input.trim();
  if (!value) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
  return `https://${value}`;
}

function digitsOnly(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/** Keep a leading + and digits, which every dialer accepts. */
function dialable(phone: string): string {
  const trimmed = phone.trim();
  return (trimmed.startsWith("+") ? "+" : "") + digitsOnly(trimmed);
}

/** "2026-11-05T18:30" from <input type=datetime-local> to floating iCal time "20261105T183000". */
export function toICalDate(local: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match;
  return `${y}${mo}${d}T${h}${mi}00`;
}

function missing(label: string): PayloadResult {
  return { ok: false, message: `Add ${label.toLowerCase()} to create the code.` };
}

export function buildPayload(type: QrContentType, fields: QrFields): PayloadResult {
  switch (type) {
    case "url": {
      const url = normalizeUrl(v(fields, "url"));
      if (!url) return missing("a link");
      return { ok: true, payload: url };
    }
    case "text": {
      const text = fields.text ?? "";
      if (!text.trim()) return missing("some text");
      return { ok: true, payload: text };
    }
    case "wifi": {
      const ssid = fields.ssid ?? "";
      if (!ssid.trim()) return missing("the network name");
      const security = v(fields, "security") || "WPA";
      const hidden = v(fields, "hidden") === "true";
      const password = fields.password ?? "";
      let payload = `WIFI:T:${security};S:${escapeWifi(ssid)};`;
      if (security !== "nopass") payload += `P:${escapeWifi(password)};`;
      if (hidden) payload += "H:true;";
      return { ok: true, payload: `${payload};` };
    }
    case "email": {
      const to = v(fields, "to");
      if (!to) return missing("an email address");
      const params = new URLSearchParams();
      if (v(fields, "subject")) params.set("subject", v(fields, "subject"));
      if (v(fields, "body")) params.set("body", fields.body ?? "");
      // mailto wants %20 for spaces, not "+".
      const query = params.toString().replace(/\+/g, "%20");
      return { ok: true, payload: `mailto:${to}${query ? `?${query}` : ""}` };
    }
    case "phone": {
      const phone = dialable(v(fields, "phone"));
      if (!digitsOnly(phone)) return missing("a phone number");
      return { ok: true, payload: `tel:${phone}` };
    }
    case "sms": {
      const phone = dialable(v(fields, "phone"));
      if (!digitsOnly(phone)) return missing("a phone number");
      const message = fields.message ?? "";
      return { ok: true, payload: `SMSTO:${phone}:${message}` };
    }
    case "whatsapp": {
      const phone = digitsOnly(v(fields, "phone"));
      if (!phone) return missing("a phone number");
      const message = fields.message ?? "";
      const query = message.trim() ? `?text=${encodeURIComponent(message)}` : "";
      return { ok: true, payload: `https://wa.me/${phone}${query}` };
    }
    case "vcard": {
      const first = v(fields, "firstName");
      const last = v(fields, "lastName");
      if (!first && !last) return missing("a name");
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${escapeVText(last)};${escapeVText(first)};;;`,
        `FN:${escapeVText([first, last].filter(Boolean).join(" "))}`,
      ];
      if (v(fields, "org")) lines.push(`ORG:${escapeVText(v(fields, "org"))}`);
      if (v(fields, "title")) lines.push(`TITLE:${escapeVText(v(fields, "title"))}`);
      if (v(fields, "phone")) lines.push(`TEL;TYPE=CELL:${dialable(v(fields, "phone"))}`);
      if (v(fields, "email")) lines.push(`EMAIL:${v(fields, "email")}`);
      if (v(fields, "website")) lines.push(`URL:${normalizeUrl(v(fields, "website"))}`);
      if (v(fields, "address")) lines.push(`ADR:;;${escapeVText(v(fields, "address"))};;;;`);
      lines.push("END:VCARD");
      return { ok: true, payload: lines.join("\n") };
    }
    case "location": {
      const lat = v(fields, "lat");
      const lng = v(fields, "lng");
      const query = v(fields, "query");
      if (lat && lng) {
        const la = Number(lat);
        const ln = Number(lng);
        if (!Number.isFinite(la) || !Number.isFinite(ln) || Math.abs(la) > 90 || Math.abs(ln) > 180) {
          return { ok: false, message: "Latitude must be between -90 and 90, longitude between -180 and 180." };
        }
        return { ok: true, payload: `https://maps.google.com/?q=${la},${ln}` };
      }
      if (!query) return missing("an address or coordinates");
      return { ok: true, payload: `https://maps.google.com/?q=${encodeURIComponent(query)}` };
    }
    case "event": {
      const title = v(fields, "title");
      if (!title) return missing("an event name");
      const start = toICalDate(v(fields, "start"));
      if (!start) return missing("a start time");
      const end = toICalDate(v(fields, "end"));
      if (end && end < start) return { ok: false, message: "The event ends before it starts." };
      const lines = ["BEGIN:VEVENT", `SUMMARY:${escapeVText(title)}`, `DTSTART:${start}`];
      if (end) lines.push(`DTEND:${end}`);
      if (v(fields, "location")) lines.push(`LOCATION:${escapeVText(v(fields, "location"))}`);
      if (v(fields, "description")) lines.push(`DESCRIPTION:${escapeVText(fields.description ?? "")}`);
      lines.push("END:VEVENT");
      return { ok: true, payload: lines.join("\n") };
    }
    case "upi": {
      const vpa = v(fields, "vpa");
      if (!vpa) return missing("a UPI ID");
      if (!/^[\w.-]+@[\w.-]+$/.test(vpa)) return { ok: false, message: "A UPI ID looks like name@bank." };
      const params = new URLSearchParams({ pa: vpa });
      if (v(fields, "name")) params.set("pn", v(fields, "name"));
      const amount = v(fields, "amount");
      if (amount) {
        const value = Number(amount);
        if (!Number.isFinite(value) || value <= 0) return { ok: false, message: "Enter a positive amount, or leave it empty." };
        params.set("am", value.toFixed(2));
      }
      params.set("cu", "INR");
      if (v(fields, "note")) params.set("tn", v(fields, "note"));
      return { ok: true, payload: `upi://pay?${params.toString().replace(/\+/g, "%20")}` };
    }
  }
}
