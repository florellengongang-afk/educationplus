/** Créneaux hebdomadaires et détection des conflits d'horaires. */

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = lundi

export interface WeeklySlot {
  weekday: Weekday;
  /** "HH:MM" en heure locale (Africa/Douala). */
  start: string;
  end: string;
}

export function toMinutes(hhmm: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!match) throw new Error(`Heure invalide : ${hhmm}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

export function isValidSlot(slot: WeeklySlot): boolean {
  return toMinutes(slot.end) > toMinutes(slot.start);
}

/** Deux créneaux se chevauchent s'ils sont le même jour et partagent au moins une minute. */
export function slotsOverlap(a: WeeklySlot, b: WeeklySlot): boolean {
  if (a.weekday !== b.weekday) return false;
  return toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end);
}

/** Renvoie les créneaux déjà confirmés qui entrent en conflit avec ceux proposés. */
export function findConflicts(proposed: readonly WeeklySlot[], confirmed: readonly WeeklySlot[]): WeeklySlot[] {
  return confirmed.filter((c) => proposed.some((p) => slotsOverlap(p, c)));
}
