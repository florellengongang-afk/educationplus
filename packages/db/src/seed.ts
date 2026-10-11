/**
 * Données de démonstration (phase 0). Mot de passe de tous les comptes : demo1234.
 * Relancer le seed vide d'abord les tables.
 */
import { sql } from "drizzle-orm";
import { createDb, schema as s } from "./index";
import { hashPassword } from "./password";

const { db, pool } = createDb();
const pwd = await hashPassword("demo1234");

await db.execute(sql`TRUNCATE audit_logs, notifications, complaint_messages, complaints, teacher_payouts, parent_payments,
  billing_cycles, correction_requests, session_reports, attendances, sessions, bookings, applications, course_requests,
  availabilities, diplomas, teacher_profiles, children, partners, users RESTART IDENTITY CASCADE`);

const [admin, manager, t1, t2, t3, p1, p2] = await db
  .insert(s.users)
  .values([
    { phone: "+237690000001", passwordHash: pwd, role: "ADMIN", name: "Admin EducationPlus" },
    { phone: "+237690000002", passwordHash: pwd, role: "PARTNER", name: "Réseau Savoir Plus" },
    { phone: "+237690000011", passwordHash: pwd, role: "TEACHER", name: "Paul Etoga" },
    { phone: "+237690000012", passwordHash: pwd, role: "TEACHER", name: "Carine Mbarga" },
    { phone: "+237690000013", passwordHash: pwd, role: "TEACHER", name: "Samuel Nkodo" },
    { phone: "+237690000021", passwordHash: pwd, role: "PARENT", name: "Florence Ngo" },
    { phone: "+237690000022", passwordHash: pwd, role: "PARENT", name: "Joseph Bello" },
  ])
  .returning();

const [partner] = await db
  .insert(s.partners)
  .values({ name: "Réseau Savoir Plus", attachCode: "SAVOIR-2026", managerId: manager!.id })
  .returning();

const [paul, carine, samuel] = await db
  .insert(s.teacherProfiles)
  .values([
    { userId: t1!.id, subjects: ["MATHEMATIQUES", "PHYSIQUE_CHIMIE"], grades: ["4E", "3E", "2NDE", "1RE", "TLE"], experienceYears: 6, zones: ["Bastos", "Nlongkak"] },
    { userId: t2!.id, partnerId: partner!.id, subjects: ["TOUTES_MATIERES"], grades: ["CE1", "CE2", "CM1", "CM2"], experienceYears: 3, zones: ["Essos", "Mvog-Ada"] },
    { userId: t3!.id, partnerId: partner!.id, subjects: ["FRANCAIS", "ANGLAIS", "PHILOSOPHIE"], grades: ["3E", "2NDE", "1RE", "TLE"], experienceYears: 8, zones: ["Bastos", "Essos"] },
  ])
  .returning();

await db.insert(s.diplomas).values([
  { teacherId: paul!.id, title: "Licence de physique", institution: "Université de Yaoundé I", year: 2017 },
  { teacherId: carine!.id, title: "CAPIEMP", institution: "ENIEG", year: 2022, status: "VERIFIED" },
  { teacherId: samuel!.id, title: "DIPES II Lettres", institution: "ENS Yaoundé", year: 2016 },
]);

await db.insert(s.availabilities).values([
  { teacherId: paul!.id, weekday: 3, startTime: "16:00", endTime: "18:00" },
  { teacherId: paul!.id, weekday: 6, startTime: "09:00", endTime: "11:00" },
  { teacherId: carine!.id, weekday: 2, startTime: "15:00", endTime: "17:00" },
  { teacherId: carine!.id, weekday: 4, startTime: "15:00", endTime: "17:00" },
  { teacherId: samuel!.id, weekday: 5, startTime: "16:00", endTime: "18:00" },
]);

const [kevin, aicha, junior] = await db
  .insert(s.children)
  .values([
    { parentId: p1!.id, firstName: "Kevin", grade: "3E" },
    { parentId: p1!.id, firstName: "Aïcha", grade: "CM2" },
    { parentId: p2!.id, firstName: "Junior", grade: "TLE" },
  ])
  .returning();

const [reqAicha] = await db
  .insert(s.courseRequests)
  .values([
    {
      parentId: p1!.id,
      childId: aicha!.id,
      grade: "CM2",
      subjects: ["TOUTES_MATIERES"],
      neighbourhood: "Bastos",
      city: "Yaoundé",
      weekdays: [2, 4],
      startTime: "15:00",
      endTime: "17:00",
      durationMonths: 3,
      startDate: "2026-10-20",
    },
    {
      parentId: p2!.id,
      childId: junior!.id,
      grade: "TLE",
      subjects: ["PHILOSOPHIE", "FRANCAIS"],
      neighbourhood: "Essos",
      city: "Yaoundé",
      weekdays: [5],
      startTime: "16:00",
      endTime: "18:00",
      durationMonths: 6,
      startDate: "2026-10-23",
    },
  ])
  .returning();

await db.insert(s.applications).values({ requestId: reqAicha!.id, teacherId: carine!.id, rank: 1 });

await db.insert(s.auditLogs).values({ actorId: admin!.id, action: "SEED", entity: "database", reason: "Données de démonstration" });

await pool.end();
console.log(`Seed terminé : 7 comptes (mot de passe demo1234), 3 enfants dont ${kevin!.firstName}, 2 demandes à domicile.`);
