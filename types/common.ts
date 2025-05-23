// Common types for the application

// UUID type using string literal type to ensure proper format
export type UUID = string;

// Date type that represents ISO 8601 date strings
export type ISODateString = string;

// Type guard to check if a string is a valid UUID
export function isUUID(value: string): value is UUID {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// Type guard to check if a string is a valid ISO date
export function isISODateString(value: string): value is ISODateString {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
  return isoDateRegex.test(value);
} 