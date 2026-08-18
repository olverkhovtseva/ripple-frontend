/** Нормализация и проверка телефона организатора (без SMS). */

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return `7${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `7${digits}`;
  }
  return digits;
}

export function formatPhoneDisplay(normalized: string): string {
  const d = normalizePhone(normalized);
  if (d.length !== 11 || !d.startsWith("7")) return normalized;
  return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
}

export function isValidRuPhone(input: string): boolean {
  const d = normalizePhone(input);
  return d.length === 11 && d.startsWith("7");
}
