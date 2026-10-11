/** Réclamations des parents. */

export const COMPLAINT_CATEGORIES = [
  "TEACHER_ABSENT_OR_LATE",
  "SESSION_NOT_STARTED",
  "WRONG_ATTENDANCE",
  "ENDED_WITHOUT_TAKING_PLACE",
  "TEACHING_QUALITY",
  "BEHAVIOUR",
  "CHILD_SAFETY",
  "PRICE_OR_PAYMENT",
  "CANCELLATION_OR_REFUND",
  "REPORT_ERROR",
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];
export type ComplaintRecipients = "PARTNER" | "ADMIN" | "BOTH";
export type ComplaintPriority = "NORMAL" | "HIGH";
export type ComplaintStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "INFO_REQUESTED"
  | "AWAITING_DECISION"
  | "RESOLVED"
  | "REJECTED"
  | "REOPENED";

/**
 * Routage : un enseignant indépendant n'a pas de partenaire → l'admin reçoit tout.
 * La sécurité de l'enfant va toujours à l'admin, en priorité haute.
 */
export function routeComplaint(input: {
  category: ComplaintCategory;
  requested: ComplaintRecipients;
  teacherHasPartner: boolean;
}): { recipients: ComplaintRecipients; priority: ComplaintPriority } {
  let recipients = input.requested;
  if (!input.teacherHasPartner) recipients = "ADMIN";
  if (input.category === "CHILD_SAFETY") {
    return { recipients: recipients === "PARTNER" ? "BOTH" : recipients, priority: "HIGH" };
  }
  return { recipients, priority: "NORMAL" };
}

const TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  NEW: ["IN_PROGRESS", "INFO_REQUESTED", "REJECTED"],
  IN_PROGRESS: ["INFO_REQUESTED", "AWAITING_DECISION", "RESOLVED", "REJECTED"],
  INFO_REQUESTED: ["IN_PROGRESS"],
  AWAITING_DECISION: ["RESOLVED", "REJECTED"],
  RESOLVED: ["REOPENED"],
  REJECTED: ["REOPENED"],
  REOPENED: ["IN_PROGRESS"],
};

export function canTransitionComplaint(from: ComplaintStatus, to: ComplaintStatus, reason?: string): boolean {
  if (!TRANSITIONS[from].includes(to)) return false;
  if (to === "REJECTED" && !reason?.trim()) return false; // rejet toujours motivé
  return true;
}

/*
 * Le blocage d'un versement pour litige (BLOCKED_DISPUTE) est décidé à la main par
 * l'admin ou le partenaire : aucune catégorie ne le déclenche automatiquement
 * tant que la règle n'est pas validée (voir docs/DECISIONS.md).
 */
