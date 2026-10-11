import "server-only";
import { createDb, type Db } from "@educationplus/db";

declare global {
  var __educationplusDb: Db | undefined;
}

/** Une seule connexion par processus (évite d'en ouvrir une à chaque rechargement en dev). */
export const db: Db = globalThis.__educationplusDb ?? createDb().db;
if (process.env.NODE_ENV !== "production") globalThis.__educationplusDb = db;
