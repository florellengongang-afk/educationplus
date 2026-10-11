/**
 * Classes et matières (système francophone camerounais).
 *
 * Règle produit (confirmée le 11/10/2026) :
 * - Primaire : la demande couvre toutes les matières — le parent ne choisit pas.
 * - Secondaire, de la 6e à la Terminale : le parent choisit une ou plusieurs matières.
 */

export const PRIMARY_GRADES = ["SIL", "CP", "CE1", "CE2", "CM1", "CM2"] as const;
export const SECONDARY_GRADES = ["6E", "5E", "4E", "3E", "2NDE", "1RE", "TLE"] as const;
export const GRADES = [...PRIMARY_GRADES, ...SECONDARY_GRADES] as const;

export type PrimaryGrade = (typeof PRIMARY_GRADES)[number];
export type SecondaryGrade = (typeof SECONDARY_GRADES)[number];
export type Grade = (typeof GRADES)[number];
export type SchoolCycle = "PRIMAIRE" | "SECONDAIRE";

export const GRADE_LABELS: Record<Grade, string> = {
  SIL: "SIL",
  CP: "CP",
  CE1: "CE1",
  CE2: "CE2",
  CM1: "CM1",
  CM2: "CM2",
  "6E": "6e",
  "5E": "5e",
  "4E": "4e",
  "3E": "3e",
  "2NDE": "2nde",
  "1RE": "1re",
  TLE: "Terminale",
};

/** Valeur unique utilisée pour toute demande du primaire. */
export const ALL_SUBJECTS = "TOUTES_MATIERES" as const;

export const SECONDARY_SUBJECTS = [
  "MATHEMATIQUES",
  "PHYSIQUE_CHIMIE",
  "SVT",
  "FRANCAIS",
  "ANGLAIS",
  "HISTOIRE_GEOGRAPHIE",
  "PHILOSOPHIE",
  "INFORMATIQUE",
  "ALLEMAND",
  "ESPAGNOL",
] as const;

export type SecondarySubject = (typeof SECONDARY_SUBJECTS)[number];
export type Subject = SecondarySubject | typeof ALL_SUBJECTS;

export const SUBJECT_LABELS: Record<Subject, string> = {
  TOUTES_MATIERES: "Toutes les matières",
  MATHEMATIQUES: "Mathématiques",
  PHYSIQUE_CHIMIE: "Physique-Chimie",
  SVT: "SVT",
  FRANCAIS: "Français",
  ANGLAIS: "Anglais",
  HISTOIRE_GEOGRAPHIE: "Histoire-Géographie",
  PHILOSOPHIE: "Philosophie",
  INFORMATIQUE: "Informatique",
  ALLEMAND: "Allemand",
  ESPAGNOL: "Espagnol",
};

/** La philosophie n'est enseignée qu'en Terminale. */
const SUBJECT_MIN_GRADE: Partial<Record<SecondarySubject, SecondaryGrade>> = {
  PHILOSOPHIE: "TLE",
};

export function cycleOf(grade: Grade): SchoolCycle {
  return (PRIMARY_GRADES as readonly string[]).includes(grade) ? "PRIMAIRE" : "SECONDAIRE";
}

/** Matières proposables pour une classe donnée. */
export function subjectsForGrade(grade: Grade): Subject[] {
  if (cycleOf(grade) === "PRIMAIRE") return [ALL_SUBJECTS];
  const rank = SECONDARY_GRADES.indexOf(grade as SecondaryGrade);
  return SECONDARY_SUBJECTS.filter((s) => {
    const min = SUBJECT_MIN_GRADE[s];
    return min === undefined || rank >= SECONDARY_GRADES.indexOf(min);
  });
}

/**
 * Normalise les matières d'une demande selon la classe :
 * primaire → toujours [TOUTES_MATIERES] ; secondaire → au moins une matière autorisée.
 */
export function normalizeSubjects(
  grade: Grade,
  subjects: readonly Subject[],
): { ok: true; subjects: Subject[] } | { ok: false; error: string } {
  if (cycleOf(grade) === "PRIMAIRE") return { ok: true, subjects: [ALL_SUBJECTS] };
  const allowed = new Set(subjectsForGrade(grade));
  const unique = [...new Set(subjects)];
  if (unique.length === 0) return { ok: false, error: "Choisissez au moins une matière." };
  const invalid = unique.filter((s) => !allowed.has(s));
  if (invalid.length > 0) {
    return { ok: false, error: `Matière non proposée en ${GRADE_LABELS[grade]} : ${invalid.map((s) => SUBJECT_LABELS[s]).join(", ")}.` };
  }
  return { ok: true, subjects: unique };
}
