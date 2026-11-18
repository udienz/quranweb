// Runs once when the server starts. With QURAN_DB_PATH set it opens the database and applies
// the migrations before the first request; a failure stops the start, so a deploy that cannot
// use its database fails and rolls back instead of serving a broken site.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.QURAN_DB_PATH) return;
  const { getDatabase } = await import("./lib/db");
  getDatabase();
  console.log("database ready");
}
