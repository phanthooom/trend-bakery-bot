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
  name_uz?: string;
  name_en?: string;
  description_uz?: string;
  description_en?: string;
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

  const result: ProductFields = { name, description, price, image, category };
  if (body.name_uz)        result.name_uz        = sanitizeText(body.name_uz, 200);
  if (body.name_en)        result.name_en        = sanitizeText(body.name_en, 200);
  if (body.description_uz) result.description_uz = sanitizeText(body.description_uz, 2000);
  if (body.description_en) result.description_en = sanitizeText(body.description_en, 2000);
  return result;
}
