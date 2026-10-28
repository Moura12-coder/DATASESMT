import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { hashPassword } from "../server/passwords";
import { getDb } from "../server/db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    throw new Error(
      "Usage: pnpm admin:create admin@example.com < password.txt"
    );
  const database = await getDb();
  if (!database) throw new Error("DATABASE_URL is required");
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  let password = "";
  for await (const line of rl) {
    password = line;
    break;
  }
  rl.close();
  if (password.length < 12 || password.length > 128)
    throw new Error("Admin password must have 12–128 characters");
  const [existing] = await database
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing)
    throw new Error(
      "Account exists; use an existing administrator to change access"
    );
  await database
    .insert(users)
    .values({
      openId: `email_${randomUUID()}`,
      email,
      name: "Administrador",
      loginMethod: "email",
      passwordHash: await hashPassword(password),
      role: "admin",
      registrationStatus: "approved",
    });
  console.log("Administrator created");
}
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error.message);
    process.exit(1);
  });
