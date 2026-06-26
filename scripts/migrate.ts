import { runMigrations } from "../lib/db/seed";

async function main() {
  console.log("Running database migrations...");
  await runMigrations();
  console.log("Migrations complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
