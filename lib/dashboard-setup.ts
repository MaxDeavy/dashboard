import "server-only";

import { count } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export async function isDashboardEmpty(): Promise<boolean> {
  const [row] = await db.select({ value: count() }).from(schema.services);
  return row.value === 0;
}
