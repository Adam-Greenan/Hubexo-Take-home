const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function toBase62(bytes: Buffer): string {
 // convert bytes to base 62 string
  let value = BigInt("0x" + bytes.toString("hex"));
  if (value === 0n) return "0";

  let out = "";
  while (value > 0n) {
    const mod = value % 62n;
    out = ALPHABET[Number(mod)] + out;
    value = value / 62n;
  }
  return out;
}