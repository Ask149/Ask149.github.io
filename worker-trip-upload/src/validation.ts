import { LOCATION_BY_ID } from "./locations";
import type { UploadPayload, UploadPhoto } from "./types";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};
const MAX_PHOTOS = 10;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;

function readString(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function captionFromFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/^\d+[-_]?/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

function isValidDate(value: string): boolean {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return date.toISOString().slice(0, 10) === value;
}

async function fileToUploadPhoto(file: File, index: number): Promise<UploadPhoto> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error(`${file.name}: unsupported file type ${file.type || "(unknown)"}`);
  }
  if (file.size <= 0) throw new Error(`${file.name}: empty file`);
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name}: file exceeds 8MB limit`);

  const n = String(index + 1).padStart(2, "0");
  const ext = EXT_BY_MIME[file.type] ?? ".jpg";
  const stem = index === 0 ? "cover" : slugify(file.name.replace(/\.[^.]+$/, "")) || "photo";
  const bytes = new Uint8Array(await file.arrayBuffer());
  return {
    sourceName: file.name,
    destFile: `${n}-${stem}${ext}`,
    mime: file.type,
    bytes,
    caption: captionFromFilename(file.name),
  };
}

export async function parseUpload(form: FormData): Promise<UploadPayload> {
  const title = readString(form, "title");
  const visitDate = readString(form, "visitDate");
  const locationId = readString(form, "locationId");
  const reason = readString(form, "reason") || "leisure";
  const coverIndexRaw = Number(readString(form, "coverIndex") || "0");

  if (!title) throw new Error("Title is required");
  if (!isValidDate(visitDate)) throw new Error("Date must be a real YYYY-MM-DD date");
  const location = LOCATION_BY_ID.get(locationId);
  if (!location) throw new Error("Choose a valid location");
  if (!["leisure", "work", "transit", "family"].includes(reason)) throw new Error("Choose a valid reason");

  const files = (form.getAll("photos") as unknown[]).filter((value): value is File => {
    if (!value || typeof value !== "object") return false;
    const maybe = value as Partial<File>;
    return typeof maybe.name === "string"
      && typeof maybe.type === "string"
      && typeof maybe.size === "number"
      && typeof maybe.arrayBuffer === "function"
      && maybe.size > 0;
  });
  if (files.length < 1 || files.length > MAX_PHOTOS) {
    throw new Error(`Upload 1-${MAX_PHOTOS} photos`);
  }
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_TOTAL_BYTES) throw new Error("Total upload exceeds 50MB limit");

  const coverIndex = Number.isInteger(coverIndexRaw) && coverIndexRaw >= 0 && coverIndexRaw < files.length
    ? coverIndexRaw
    : 0;
  const ordered = [files[coverIndex], ...files.filter((_, index) => index !== coverIndex)];
  const photos = await Promise.all(ordered.map(fileToUploadPhoto));
  const yearMonth = visitDate.slice(0, 7);
  const titleSlug = slugify(title) || "entry";
  const slug = `${yearMonth}-${location.slug}-${titleSlug}`;

  return {
    slug,
    title,
    visitDate,
    yearMonth,
    reason,
    location,
    photos,
    uploadedAt: new Date().toISOString(),
  };
}
