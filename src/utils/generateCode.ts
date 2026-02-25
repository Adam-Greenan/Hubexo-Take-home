import crypto from "crypto";
import { toBase62 } from "./base62";

export function generateCode(length: number): string {
  const raw = crypto.randomBytes(8);
  const base62 = toBase62(raw);
  // ensure we always have enough chars by adding leading zeeros
  const paddedBase62 = (base62 + "0000000000").slice(0, Math.max(length, 1));
  return paddedBase62.slice(0, length);
}