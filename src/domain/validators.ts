import { InvalidUrlError } from "./errors";

export function validateUrl(input: unknown): string {
  if (typeof input !== "string" || input.trim().length === 0) {
    throw new InvalidUrlError("url is missing");
  }

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new InvalidUrlError("url is malformed");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new InvalidUrlError("missing http:// or https:// prefix");
  }

  return parsed.toString();
}