// Strip angle brackets to prevent HTML injection in plain-text fields.
// Also removes null bytes and non-printable control chars (keeps \t \n \r).
export function sanitizeText(raw: unknown, maxLen: number): string {
  return String(raw ?? '')
    .replace(/[<>]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLen);
}

// Accepts only https:// URLs. Returns '' for anything else (including javascript:, data:, http:).
export function sanitizeHttpsUrl(raw: unknown): string {
  if (!raw) return '';
  try {
    const url = new URL(String(raw));
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

export interface ProductFields {
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

export function sanitizeProductFields(body: Record<string, any>): ProductFields {
  const name = sanitizeText(body.name, 200);
  const description = sanitizeText(body.description, 2000);
  const image = sanitizeHttpsUrl(body.image);
  const category = sanitizeText(body.category, 100);

  const rawPrice = Number(body.price);
  const price = Number.isFinite(rawPrice) && rawPrice >= 0 && rawPrice <= 100_000_000
    ? rawPrice
    : NaN;

  return { name, description, price, image, category };
}
