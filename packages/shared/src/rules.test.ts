import { describe, expect, it } from "vitest";
import {
  ALL_SUBJECTS,
  amountDue,
  canApply,
  canTransitionComplaint,
  canTransitionPayout,
  checkParentPayment,
  chooseApplication,
  computePayout,
  courseRequestSchema,
  cycleEndDate,
  cycleOf,
  dayOfCycle,
  endSession,
  findConflicts,
  installments,
  markPayoutPaid,
  nextProfilesToPresent,
  normalizeSubjects,
  phoneSchema,
  recordAttendance,
  routeComplaint,
  slotsOverlap,
  startSession,
  subjectsForGrade,
  validateCorrection,
  type ApplicationLike,
  type SessionState,
} from "./index";

const apps = (n: number): ApplicationLike[] =>
  Array.from({ length: n }, (_, i) => ({ id: `a${i + 1}`, teacherId: `t${i + 1}`, status: "PENDING" as const, rank: i + 1 }));

describe("classes et matières", () => {
  it("le primaire couvre toujours toutes les matières", () => {
    expect(cycleOf("CE2")).toBe("PRIMAIRE");
    expect(subjectsForGrade("CM2")).toEqual([ALL_SUBJECTS]);
    expect(normalizeSubjects("SIL", ["MATHEMATIQUES"])).toEqual({ ok: true, subjects: [ALL_SUBJECTS] });
  });
  it("le secondaire va de la 6e à la Terminale avec choix des matières", () => {
    expect(cycleOf("6E")).toBe("SECONDAIRE");
    expect(cycleOf("TLE")).toBe("SECONDAIRE");
    expect(normalizeSubjects("3E", [])).toMatchObject({ ok: false });
    expect(normalizeSubjects("3E", ["MATHEMATIQUES", "MATHEMATIQUES"])).toEqual({ ok: true, subjects: ["MATHEMATIQUES"] });
  });
  it("la philosophie n'est proposée qu'en Terminale", () => {
    expect(subjectsForGrade("1RE")).not.toContain("PHILOSOPHIE");
    expect(subjectsForGrade("TLE")).toContain("PHILOSOPHIE");
  });
});

describe("demande de cours", () => {
  const base = {
    childId: "7b4f5a6e-6c1d-4a5e-9f2b-1a2b3c4d5e6f",
    neighbourhood: "Bastos",
    weekdays: [2, 4],
    startTime: "15:00",
    endTime: "17:00",
    durationMonths: 3,
    startDate: "2026-10-20",
  };
  it("est toujours à domicile et force toutes les matières au primaire", () => {
    const r = courseRequestSchema.parse({ ...base, grade: "CM1", subjects: [] });
    expect(r.format).toBe("HOME");
    expect(r.subjects).toEqual([ALL_SUBJECTS]);
  });
  it("refuse une demande du secondaire sans matière", () => {
    expect(courseRequestSchema.safeParse({ ...base, grade: "4E", subjects: [] }).success).toBe(false);
  });
  it("refuse un horaire de fin avant le début", () => {
    expect(courseRequestSchema.safeParse({ ...base, grade: "CM1", endTime: "14:00" }).success).toBe(false);
  });
});

describe("téléphone", () => {
  it("accepte un mobile camerounais avec ou sans indicatif", () => {
    expect(phoneSchema.parse("6 99 12 34 56")).toBe("+237699123456");
    expect(phoneSchema.parse("+237699123456")).toBe("+237699123456");
    expect(phoneSchema.safeParse("12345").success).toBe(false);
  });
});

describe("candidatures", () => {
  it("limite à 10 candidatures", () => {
    expect(canApply({ requestStatus: "OPEN", applications: apps(9), teacherId: "x", hasScheduleConflict: false })).toEqual({ ok: true });
    expect(canApply({ requestStatus: "OPEN", applications: apps(10), teacherId: "x", hasScheduleConflict: false })).toEqual({ ok: false, reason: "FULL" });
  });
  it("refuse un doublon, une demande fermée et un conflit d'horaire", () => {
    expect(canApply({ requestStatus: "OPEN", applications: apps(2), teacherId: "t1", hasScheduleConflict: false })).toMatchObject({ reason: "ALREADY_APPLIED" });
    expect(canApply({ requestStatus: "CLOSED", applications: [], teacherId: "x", hasScheduleConflict: false })).toMatchObject({ reason: "REQUEST_CLOSED" });
    expect(canApply({ requestStatus: "OPEN", applications: [], teacherId: "x", hasScheduleConflict: true })).toMatchObject({ reason: "SCHEDULE_CONFLICT" });
  });
  it("présente les profils deux par deux dans l'ordre d'arrivée", () => {
    const list = apps(5);
    expect(nextProfilesToPresent(list).map((a) => a.id)).toEqual(["a1", "a2"]);
    list[0]!.status = "REFUSED";
    list[1]!.status = "REFUSED";
    expect(nextProfilesToPresent(list, 1).map((a) => a.id)).toEqual(["a3"]);
  });
  it("le choix ferme la demande et les autres candidatures", () => {
    const list = apps(3);
    list[0]!.status = "PRESENTED";
    list[1]!.status = "REFUSED";
    const res = chooseApplication(list, "a1");
    expect(res.requestStatus).toBe("CLOSED");
    expect(res.applications.map((a) => a.status)).toEqual(["CHOSEN", "REFUSED", "CLOSED"]);
    expect(nextProfilesToPresent(res.applications)).toEqual([]);
  });
});

describe("horaires", () => {
  it("détecte un chevauchement le même jour seulement", () => {
    expect(slotsOverlap({ weekday: 3, start: "16:00", end: "18:00" }, { weekday: 3, start: "17:30", end: "19:00" })).toBe(true);
    expect(slotsOverlap({ weekday: 3, start: "16:00", end: "18:00" }, { weekday: 3, start: "18:00", end: "19:00" })).toBe(false);
    expect(findConflicts([{ weekday: 1, start: "16:00", end: "18:00" }], [{ weekday: 2, start: "16:00", end: "18:00" }])).toEqual([]);
  });
});

describe("séance à domicile", () => {
  const at = (t: string) => ({ deviceAt: `2026-10-09T${t}:00+01:00` });
  const fresh: SessionState = { status: "PLANNED", childIds: ["k", "a"], attendance: {} };

  it("impose appel → démarrer → terminer", () => {
    let s = recordAttendance(fresh, "k", "PRESENT", at("15:58"));
    expect(() => startSession(s, at("16:00"))).toThrow(/appel/);
    s = recordAttendance(s, "a", "LATE", at("16:01"));
    s = startSession(s, at("16:02"));
    expect(s.status).toBe("STARTED");
    expect(() => recordAttendance(s, "k", "ABSENT", at("16:05"))).toThrow(/correction/);
    s = endSession(s, at("18:04"));
    expect(s.status).toBe("ENDED");
  });
  it("refuse une fin avant le démarrage", () => {
    let s = recordAttendance({ ...fresh, childIds: ["k"] }, "k", "PRESENT", at("15:58"));
    s = startSession(s, at("16:02"));
    expect(() => endSession(s, at("15:00"))).toThrow();
  });
  it("exige un motif pour toute correction", () => {
    const base = { field: "endedAt" as const, oldValue: null, newValue: "18:05", authorId: "t1", requestedAt: "2026-10-09T07:40:00Z" };
    expect(validateCorrection({ ...base, reason: "" })).toMatchObject({ ok: false });
    expect(validateCorrection({ ...base, reason: "Batterie vide en fin de cours" })).toEqual({ ok: true });
  });
});

describe("cycle de paiement", () => {
  it("compte les jours du cycle de 30 jours", () => {
    expect(dayOfCycle("2026-09-28", "2026-09-28")).toBe(1);
    expect(dayOfCycle("2026-09-28", "2026-10-09")).toBe(12);
    expect(cycleEndDate("2026-09-28")).toBe("2026-10-27");
  });
  it("répartit les échéances selon le mode", () => {
    expect(installments(50_000, "FULL")).toEqual([{ day: 30, amount: 50_000 }]);
    expect(installments(50_001, "SPLIT")).toEqual([{ day: 15, amount: 25_000 }, { day: 30, amount: 25_001 }]);
    expect(amountDue(50_000, "SPLIT", 14)).toBe(0);
    expect(amountDue(50_000, "SPLIT", 15)).toBe(25_000);
  });
  it("n'accepte pas plus que le solde", () => {
    expect(checkParentPayment({ total: 50_000, paid: 40_000, mode: "FLEXIBLE", day: 10, amount: 20_000 })).toMatchObject({ reason: "EXCEEDS_BALANCE" });
  });
  it("laisse passer les avances après J20 tant que la règle n'est pas validée", () => {
    expect(checkParentPayment({ total: 50_000, paid: 0, mode: "FULL", day: 25, amount: 10_000 })).toEqual({ ok: true });
  });
});

describe("versements enseignants", () => {
  it("applique la commission de 20 % (exemple du cahier des charges)", () => {
    expect(computePayout(50_000)).toEqual({ gross: 50_000, commission: 10_000, providerFee: null, net: 40_000, feeUndecided: true });
  });
  it("distingue autorisé et payé", () => {
    expect(canTransitionPayout("AUTHORIZED", "PAID")).toBe(false);
    expect(canTransitionPayout("AUTHORIZED", "PROCESSING")).toBe(true);
    expect(() => markPayoutPaid("PROCESSING", null)).toThrow(/Confirmation/);
    expect(markPayoutPaid("PROCESSING", "TX-123")).toBe("PAID");
  });
});

describe("réclamations", () => {
  it("envoie la sécurité de l'enfant à l'admin en priorité", () => {
    expect(routeComplaint({ category: "CHILD_SAFETY", requested: "PARTNER", teacherHasPartner: true })).toEqual({ recipients: "BOTH", priority: "HIGH" });
  });
  it("route vers l'admin quand l'enseignant est indépendant", () => {
    expect(routeComplaint({ category: "TEACHING_QUALITY", requested: "PARTNER", teacherHasPartner: false })).toEqual({ recipients: "ADMIN", priority: "NORMAL" });
  });
  it("exige un motif pour un rejet", () => {
    expect(canTransitionComplaint("IN_PROGRESS", "REJECTED")).toBe(false);
    expect(canTransitionComplaint("IN_PROGRESS", "REJECTED", "Séance bien réalisée")).toBe(true);
  });
});
