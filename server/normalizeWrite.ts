import { getTableColumns } from "drizzle-orm";
import type { MySqlTable } from "drizzle-orm/mysql-core";
import { TRPCError } from "@trpc/server";
/** Convert validated JSON input to the driver's Date/decimal representations. */
export function normalizeWrite<T extends MySqlTable>(
  table: T,
  value: unknown
): T["$inferInsert"] {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TRPCError({ code: "BAD_REQUEST", message: "Dados inválidos" });
  const columns = getTableColumns(table);
  const result: Record<string, unknown> = {};
  for (const [key, input] of Object.entries(value)) {
    const column = columns[key];
    if (!column)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Campo inválido: ${key}`,
      });
    if (input === undefined) continue;
    if (column.dataType === "date" && typeof input === "string") {
      if (!input && !column.notNull) {
        result[key] = null;
        continue;
      }
      const date = new Date(input);
      if (
        !Number.isFinite(date.getTime()) ||
        (/^\d{4}-\d{2}-\d{2}$/.test(input) &&
          date.toISOString().slice(0, 10) !== input)
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Data inválida: ${key}`,
        });
      result[key] = date;
    } else if (
      column.columnType === "MySqlDecimal" &&
      typeof input === "number"
    ) {
      if (!Number.isFinite(input))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Número inválido: ${key}`,
        });
      result[key] = String(input);
    } else result[key] = input;
  }
  return result as T["$inferInsert"];
}
