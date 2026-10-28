import crypto from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(crypto.scrypt);
const pbkdf2 = promisify(crypto.pbkdf2);
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(
  password: string,
  encoded: string
): Promise<boolean> {
  const parts = encoded.split(":");
  let actual: Buffer;
  let expected: Buffer;
  if (
    parts.length === 3 &&
    parts[0] === "scrypt" &&
    /^[a-f0-9]{32}$/.test(parts[1]) &&
    /^[a-f0-9]{128}$/.test(parts[2])
  ) {
    actual = (await scrypt(password, parts[1], 64)) as Buffer;
    expected = Buffer.from(parts[2], "hex");
  } else if (
    parts.length === 2 &&
    /^[a-f0-9]{32}$/.test(parts[0]) &&
    /^[a-f0-9]{128}$/.test(parts[1])
  ) {
    actual = await pbkdf2(password, parts[0], 1000, 64, "sha512");
    expected = Buffer.from(parts[1], "hex");
  } else return false; // Plaintext credentials are never accepted.
  return (
    actual.length === expected.length &&
    crypto.timingSafeEqual(actual, expected)
  );
}
