/** Candidatures des enseignants et présentation des profils au parent. */
import { productConfig } from "./config";

export type RequestStatus = "OPEN" | "CLOSED" | "CANCELLED";
export type ApplicationStatus = "PENDING" | "PRESENTED" | "REFUSED" | "CHOSEN" | "CLOSED";

export interface ApplicationLike {
  id: string;
  teacherId: string;
  status: ApplicationStatus;
  /** Ordre d'arrivée (1 = premier candidat). */
  rank: number;
}

export type ApplyCheck =
  | { ok: true }
  | { ok: false; reason: "REQUEST_CLOSED" | "FULL" | "ALREADY_APPLIED" | "SCHEDULE_CONFLICT" };

export function canApply(input: {
  requestStatus: RequestStatus;
  applications: readonly ApplicationLike[];
  teacherId: string;
  hasScheduleConflict: boolean;
}): ApplyCheck {
  if (input.requestStatus !== "OPEN") return { ok: false, reason: "REQUEST_CLOSED" };
  if (input.applications.some((a) => a.teacherId === input.teacherId)) return { ok: false, reason: "ALREADY_APPLIED" };
  if (input.applications.length >= productConfig.maxApplicationsPerRequest) return { ok: false, reason: "FULL" };
  if (input.hasScheduleConflict) return { ok: false, reason: "SCHEDULE_CONFLICT" };
  return { ok: true };
}

/**
 * Profils à présenter ensuite : ceux déjà présentés et non tranchés restent affichés ;
 * sinon on prend les suivants dans l'ordre d'arrivée, par lots de 1 ou 2.
 */
export function nextProfilesToPresent(
  applications: readonly ApplicationLike[],
  batchSize: 1 | 2 = 2,
): ApplicationLike[] {
  if (applications.some((a) => a.status === "CHOSEN")) return [];
  const shown = applications.filter((a) => a.status === "PRESENTED");
  if (shown.length > 0) return [...shown].sort((a, b) => a.rank - b.rank);
  return applications
    .filter((a) => a.status === "PENDING")
    .sort((a, b) => a.rank - b.rank)
    .slice(0, batchSize);
}

/** Le parent choisit un candidat : la demande se ferme, les autres candidatures aussi. */
export function chooseApplication<T extends ApplicationLike>(
  applications: readonly T[],
  chosenId: string,
): { requestStatus: RequestStatus; applications: T[] } {
  const chosen = applications.find((a) => a.id === chosenId);
  if (!chosen) throw new Error("Candidature introuvable.");
  if (chosen.status !== "PRESENTED") throw new Error("Seul un profil présenté peut être choisi.");
  return {
    requestStatus: "CLOSED",
    applications: applications.map((a) => ({
      ...a,
      status: a.id === chosenId ? "CHOSEN" : a.status === "REFUSED" ? "REFUSED" : "CLOSED",
    })),
  };
}
