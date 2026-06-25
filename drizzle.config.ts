import { defineConfig } from "drizzle-kit";
import { getDatabaseUrl } from "./lib/env";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
});
