import { connection } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/** Vérifie que l'API répond et que la base est joignable. */
export async function GET() {
  await connection();
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok", database: "ok" });
  } catch {
    return Response.json({ status: "degraded", database: "unreachable" }, { status: 503 });
  }
}
