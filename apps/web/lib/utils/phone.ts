/**
 * Auto-formats a phone number to (XXX) XXX-XXXX as the user types.
 * Strips all non-digit characters, caps at 10 digits.
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Zod-compatible phone regex: (XXX) XXX-XXXX */
export const PHONE_REGEX = /^\(\d{3}\) \d{3}-\d{4}$/;
export const PHONE_MESSAGE = 'Enter a valid phone number, e.g. (555) 123-4567';
