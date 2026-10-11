/** Schémas Zod partagés par l'API et les applications. */
import { z } from "zod";
import { GRADES, SECONDARY_SUBJECTS, ALL_SUBJECTS, normalizeSubjects } from "./levels";

/** Numéro camerounais : +237 suivi de 9 chiffres commençant par 6 (mobile) ou 2. */
export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/[\s.-]/g, ""))
  .transform((v) => (v.startsWith("+237") ? v : `+237${v}`))
  .refine((v) => /^\+237[26]\d{8}$/.test(v), "Numéro de téléphone camerounais invalide.");

export const roleSchema = z.enum(["PARENT", "TEACHER", "PARTNER", "ADMIN"]);
export type Role = z.infer<typeof roleSchema>;

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom."),
  phone: phoneSchema,
  password: z.string().min(8, "8 caractères minimum.").regex(/\d/, "Au moins un chiffre."),
  role: z.enum(["PARENT", "TEACHER"]),
  acceptTerms: z.literal(true, { message: "Vous devez accepter les conditions." }),
});

export const gradeSchema = z.enum(GRADES);
export const subjectSchema = z.enum([ALL_SUBJECTS, ...SECONDARY_SUBJECTS]);

export const childSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis.").max(40),
  grade: gradeSchema,
});

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure au format HH:MM.");

/** Demande de cours — uniquement à domicile. */
export const courseRequestSchema = z
  .object({
    /** Une demande = un enfant (sa classe fixe les matières). Frères et sœurs : une demande chacun. */
    childId: z.string().uuid(),
    grade: gradeSchema,
    subjects: z.array(subjectSchema).default([]),
    neighbourhood: z.string().trim().min(2, "Indiquez le quartier."),
    city: z.string().trim().min(2).default("Yaoundé"),
    weekdays: z.array(z.number().int().min(1).max(7)).min(1, "Choisissez au moins un jour."),
    startTime: hhmm,
    endTime: hhmm,
    durationMonths: z.number().int().min(1).max(12),
    startDate: z.string().date(),
    budget: z.number().int().positive().nullable().default(null),
  })
  .transform((v, ctx) => {
    const norm = normalizeSubjects(v.grade, v.subjects);
    if (!norm.ok) {
      ctx.addIssue({ code: "custom", path: ["subjects"], message: norm.error });
      return z.NEVER;
    }
    if (v.endTime <= v.startTime) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "L'heure de fin doit suivre l'heure de début." });
      return z.NEVER;
    }
    return { ...v, subjects: norm.subjects, format: "HOME" as const };
  });

export type CourseRequestInput = z.input<typeof courseRequestSchema>;
export type CourseRequest = z.output<typeof courseRequestSchema>;
