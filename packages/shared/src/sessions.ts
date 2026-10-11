/**
 * Déroulé d'une séance à domicile : appel → démarrer → terminer.
 * Chaque action garde l'heure de l'appareil (saisie, éventuellement hors ligne)
 * et l'heure de réception par le serveur.
 */

export type SessionStatus = "PLANNED" | "STARTED" | "ENDED" | "CANCELLED";
export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT";

export interface TimedEvent {
  /** Heure de l'action sur le téléphone de l'enseignant (ISO). */
  deviceAt: string;
  /** Heure de réception par le serveur (ISO) — absente tant que l'action est en file. */
  serverAt?: string;
}

export interface SessionState {
  status: SessionStatus;
  /** Enfants de la famille concernés par la séance. */
  childIds: string[];
  attendance: Record<string, { status: AttendanceStatus } & TimedEvent>;
  started?: TimedEvent;
  ended?: TimedEvent;
}

export class SessionRuleError extends Error {}

export function isRollCallComplete(s: SessionState): boolean {
  return s.childIds.length > 0 && s.childIds.every((id) => s.attendance[id] !== undefined);
}

export function recordAttendance(
  s: SessionState,
  childId: string,
  status: AttendanceStatus,
  at: TimedEvent,
): SessionState {
  if (s.status !== "PLANNED") {
    throw new SessionRuleError("L'appel ne se modifie plus après le démarrage : demandez une correction.");
  }
  if (!s.childIds.includes(childId)) throw new SessionRuleError("Cet enfant ne fait pas partie de la séance.");
  return { ...s, attendance: { ...s.attendance, [childId]: { status, ...at } } };
}

export function startSession(s: SessionState, at: TimedEvent): SessionState {
  if (s.status !== "PLANNED") throw new SessionRuleError("La séance a déjà démarré ou est close.");
  if (!isRollCallComplete(s)) throw new SessionRuleError("Faites l'appel de chaque enfant avant de démarrer.");
  return { ...s, status: "STARTED", started: at };
}

export function endSession(s: SessionState, at: TimedEvent): SessionState {
  if (s.status !== "STARTED") throw new SessionRuleError("Seule une séance démarrée peut être terminée.");
  if (s.started && Date.parse(at.deviceAt) < Date.parse(s.started.deviceAt)) {
    throw new SessionRuleError("L'heure de fin précède l'heure de démarrage.");
  }
  return { ...s, status: "ENDED", ended: at };
}

/** Une correction ne modifie jamais une valeur en silence : elle produit une entrée d'audit. */
export interface CorrectionRequest {
  field: "startedAt" | "endedAt" | `attendance:${string}`;
  oldValue: string | null;
  newValue: string;
  reason: string;
  authorId: string;
  requestedAt: string;
}

export function validateCorrection(c: CorrectionRequest): { ok: true } | { ok: false; error: string } {
  if (c.reason.trim().length < 5) return { ok: false, error: "Le motif est obligatoire (5 caractères minimum)." };
  if (c.oldValue === c.newValue) return { ok: false, error: "La nouvelle valeur est identique à l'ancienne." };
  return { ok: true };
}

/** Message affiché aux parents : un statut déclaré n'est pas une preuve de présence physique. */
export const DECLARED_BY_TEACHER_NOTICE =
  "Informations déclarées par l'enseignant dans l'application. Elles ne constituent pas à elles seules une preuve de présence physique.";
