/**
 * Paramètres produit. Tout ce qui n'est pas confirmé par le cahier des charges est ici,
 * désactivé ou à `null` — voir docs/DECISIONS.md. Ne pas coder de comportement définitif
 * à partir d'une valeur marquée « à décider ».
 */
export const productConfig = {
  /** Confirmé : commission EducationPlus de 20 %. */
  commissionRate: 0.2,
  /** À décider (#4) : base de calcul de la commission. */
  commissionBasis: null as null | "BOOKED" | "COLLECTED" | "DELIVERED",
  /** À décider (#5) : part éventuelle du partenaire. */
  partnerShareRate: null as null | number,
  /** Confirmé : nombre maximal de candidatures par demande. */
  maxApplicationsPerRequest: 10,
  /** Confirmé : durée d'un cycle de facturation, en jours. */
  billingCycleDays: 30,
  /** À décider (#11) : bloquer les avances volontaires après le jour 20. Désactivé. */
  blockVoluntaryAdvanceAfterDay20: false,
  /** À décider (#13) : avis des parents sur les enseignants. Désactivé. */
  parentReviewsEnabled: false,
  /** Confirmé (11/10/2026) : uniquement des cours à domicile, plus de centres. */
  courseFormat: "HOME" as const,
} as const;

export type ProductConfig = typeof productConfig;
