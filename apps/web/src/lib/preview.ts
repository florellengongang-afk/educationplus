/**
 * L'authentification arrive en phase 1. D'ici là, les espaces Admin et Partenaire
 * ne s'affichent qu'en développement ou si ADMIN_PREVIEW=1 est défini explicitement.
 */
export function previewAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ADMIN_PREVIEW === "1";
}
