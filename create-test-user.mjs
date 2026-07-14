import { hashPassword } from './server/emailAuth.ts';
import crypto from 'crypto';

// Password hashing using Node.js built-in crypto
function hashPasswordTest(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

const passwordHash = hashPasswordTest("password123");
console.log("Password hash:", passwordHash);
