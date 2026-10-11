/**
 * Modèle de données EducationPlus (docs/BRIEF.md, section Modèle de données).
 * Uniquement des cours à domicile. Montants entiers en FCFA.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { COMPLAINT_CATEGORIES, GRADES, SECONDARY_SUBJECTS, ALL_SUBJECTS } from "@educationplus/shared";

const id = () => uuid("id").primaryKey().defaultRandom();
const stamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const roleEnum = pgEnum("role", ["PARENT", "TEACHER", "PARTNER", "ADMIN"]);
export const gradeEnum = pgEnum("grade", GRADES);
export const subjectEnum = pgEnum("subject", [ALL_SUBJECTS, ...SECONDARY_SUBJECTS]);
export const diplomaStatusEnum = pgEnum("diploma_status", ["DECLARED", "VERIFIED", "REJECTED"]);
export const requestStatusEnum = pgEnum("request_status", ["OPEN", "CLOSED", "CANCELLED"]);
export const applicationStatusEnum = pgEnum("application_status", ["PENDING", "PRESENTED", "REFUSED", "CHOSEN", "CLOSED"]);
export const bookingStatusEnum = pgEnum("booking_status", ["PENDING_TEACHER", "ACTIVE", "ENDED", "CANCELLED"]);
export const paymentModeEnum = pgEnum("payment_mode", ["FULL", "SPLIT", "FLEXIBLE"]);
export const sessionStatusEnum = pgEnum("session_status", ["PLANNED", "STARTED", "ENDED", "CANCELLED"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["PRESENT", "LATE", "ABSENT"]);
export const correctionStatusEnum = pgEnum("correction_status", ["PENDING", "APPROVED", "REJECTED"]);
export const cycleStatusEnum = pgEnum("cycle_status", ["OPEN", "PAID", "LATE", "CLOSED"]);
export const parentPaymentStatusEnum = pgEnum("parent_payment_status", ["PENDING", "SUCCEEDED", "FAILED"]);
export const payoutStatusEnum = pgEnum("payout_status", [
  "TO_COMPUTE",
  "PENDING_VALIDATION",
  "AUTHORIZED",
  "PROCESSING",
  "PAID",
  "FAILED",
  "BLOCKED_DISPUTE",
  "CANCELLED",
]);
export const complaintCategoryEnum = pgEnum("complaint_category", COMPLAINT_CATEGORIES);
export const complaintRecipientsEnum = pgEnum("complaint_recipients", ["PARTNER", "ADMIN", "BOTH"]);
export const complaintPriorityEnum = pgEnum("complaint_priority", ["NORMAL", "HIGH"]);
export const complaintStatusEnum = pgEnum("complaint_status", [
  "NEW",
  "IN_PROGRESS",
  "INFO_REQUESTED",
  "AWAITING_DECISION",
  "RESOLVED",
  "REJECTED",
  "REOPENED",
]);

export const users = pgTable("users", {
  id: id(),
  phone: text("phone").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  name: text("name").notNull(),
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  ...stamps,
});

export const partners = pgTable("partners", {
  id: id(),
  name: text("name").notNull(),
  attachCode: text("attach_code").notNull().unique(),
  managerId: uuid("manager_id").notNull().references(() => users.id),
  ...stamps,
});

export const children = pgTable("children", {
  id: id(),
  parentId: uuid("parent_id").notNull().references(() => users.id),
  firstName: text("first_name").notNull(),
  grade: gradeEnum("grade").notNull(),
  ...stamps,
}, (t) => [index("children_parent_idx").on(t.parentId)]);

export const teacherProfiles = pgTable("teacher_profiles", {
  id: id(),
  userId: uuid("user_id").notNull().unique().references(() => users.id),
  partnerId: uuid("partner_id").references(() => partners.id),
  bio: text("bio"),
  subjects: subjectEnum("subjects").array().notNull().default(sql`'{}'`),
  grades: gradeEnum("grades").array().notNull().default(sql`'{}'`),
  experienceYears: smallint("experience_years"),
  /** Quartiers desservis (domicile des familles). */
  zones: text("zones").array().notNull().default(sql`'{}'`),
  city: text("city").notNull().default("Yaoundé"),
  /** Décision #2 ouverte : qui fixe le tarif. Nullable tant que non tranché. */
  monthlyRate: integer("monthly_rate"),
  cvFileKey: text("cv_file_key"),
  ...stamps,
});

export const diplomas = pgTable("diplomas", {
  id: id(),
  teacherId: uuid("teacher_id").notNull().references(() => teacherProfiles.id),
  title: text("title").notNull(),
  institution: text("institution"),
  year: smallint("year"),
  fileKey: text("file_key"),
  status: diplomaStatusEnum("status").notNull().default("DECLARED"),
  ...stamps,
});

export const availabilities = pgTable("availabilities", {
  id: id(),
  teacherId: uuid("teacher_id").notNull().references(() => teacherProfiles.id),
  weekday: smallint("weekday").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
});

export const courseRequests = pgTable("course_requests", {
  id: id(),
  parentId: uuid("parent_id").notNull().references(() => users.id),
  childId: uuid("child_id").notNull().references(() => children.id),
  grade: gradeEnum("grade").notNull(),
  subjects: subjectEnum("subjects").array().notNull(),
  /** Uniquement à domicile : quartier et ville de la famille. */
  neighbourhood: text("neighbourhood").notNull(),
  city: text("city").notNull(),
  weekdays: smallint("weekdays").array().notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  durationMonths: smallint("duration_months").notNull(),
  startDate: date("start_date").notNull(),
  budget: integer("budget"),
  status: requestStatusEnum("status").notNull().default("OPEN"),
  ...stamps,
});

export const applications = pgTable("applications", {
  id: id(),
  requestId: uuid("request_id").notNull().references(() => courseRequests.id),
  teacherId: uuid("teacher_id").notNull().references(() => teacherProfiles.id),
  rank: smallint("rank").notNull(),
  status: applicationStatusEnum("status").notNull().default("PENDING"),
  presentedAt: timestamp("presented_at", { withTimezone: true }),
  ...stamps,
}, (t) => [
  uniqueIndex("applications_request_teacher_uq").on(t.requestId, t.teacherId),
  uniqueIndex("applications_request_rank_uq").on(t.requestId, t.rank),
]);

export const bookings = pgTable("bookings", {
  id: id(),
  requestId: uuid("request_id").notNull().unique().references(() => courseRequests.id),
  teacherId: uuid("teacher_id").notNull().references(() => teacherProfiles.id),
  parentId: uuid("parent_id").notNull().references(() => users.id),
  startDate: date("start_date").notNull(),
  paymentMode: paymentModeEnum("payment_mode").notNull(),
  /** Prix d'un cycle de 30 jours. */
  cyclePrice: integer("cycle_price"),
  status: bookingStatusEnum("status").notNull().default("PENDING_TEACHER"),
  ...stamps,
});

export const sessions = pgTable("sessions", {
  id: id(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id),
  scheduledStart: timestamp("scheduled_start", { withTimezone: true }).notNull(),
  scheduledEnd: timestamp("scheduled_end", { withTimezone: true }).notNull(),
  status: sessionStatusEnum("status").notNull().default("PLANNED"),
  startedDeviceAt: timestamp("started_device_at", { withTimezone: true }),
  startedServerAt: timestamp("started_server_at", { withTimezone: true }),
  endedDeviceAt: timestamp("ended_device_at", { withTimezone: true }),
  endedServerAt: timestamp("ended_server_at", { withTimezone: true }),
  ...stamps,
}, (t) => [index("sessions_booking_idx").on(t.bookingId)]);

export const attendances = pgTable("attendances", {
  id: id(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id),
  childId: uuid("child_id").notNull().references(() => children.id),
  status: attendanceStatusEnum("status").notNull(),
  deviceAt: timestamp("device_at", { withTimezone: true }).notNull(),
  serverAt: timestamp("server_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("attendances_session_child_uq").on(t.sessionId, t.childId)]);

export const sessionReports = pgTable("session_reports", {
  id: id(),
  sessionId: uuid("session_id").notNull().unique().references(() => sessions.id),
  topics: text("topics"),
  exercises: text("exercises"),
  homework: text("homework"),
  difficulties: text("difficulties"),
  recommendations: text("recommendations"),
  incidents: text("incidents"),
  ...stamps,
});

export const correctionRequests = pgTable("correction_requests", {
  id: id(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id),
  authorId: uuid("author_id").notNull().references(() => users.id),
  field: text("field").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value").notNull(),
  reason: text("reason").notNull(),
  status: correctionStatusEnum("status").notNull().default("PENDING"),
  decidedBy: uuid("decided_by").references(() => users.id),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  ...stamps,
});

export const billingCycles = pgTable("billing_cycles", {
  id: id(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalAmount: integer("total_amount").notNull(),
  paidAmount: integer("paid_amount").notNull().default(0),
  status: cycleStatusEnum("status").notNull().default("OPEN"),
  ...stamps,
});

export const parentPayments = pgTable("parent_payments", {
  id: id(),
  cycleId: uuid("cycle_id").notNull().references(() => billingCycles.id),
  amount: integer("amount").notNull(),
  provider: text("provider").notNull().default("FAKE"),
  providerRef: text("provider_ref"),
  status: parentPaymentStatusEnum("status").notNull().default("PENDING"),
  receiptNumber: text("receipt_number").unique(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  ...stamps,
});

export const teacherPayouts = pgTable("teacher_payouts", {
  id: id(),
  teacherId: uuid("teacher_id").notNull().references(() => teacherProfiles.id),
  cycleId: uuid("cycle_id").notNull().references(() => billingCycles.id),
  grossAmount: integer("gross_amount").notNull(),
  commissionAmount: integer("commission_amount").notNull(),
  /** Décision #6 ouverte : frais du prestataire. */
  providerFee: integer("provider_fee"),
  netAmount: integer("net_amount").notNull(),
  status: payoutStatusEnum("status").notNull().default("TO_COMPUTE"),
  authorizedBy: uuid("authorized_by").references(() => users.id),
  refusalReason: text("refusal_reason"),
  providerConfirmationRef: text("provider_confirmation_ref"),
  executedAt: timestamp("executed_at", { withTimezone: true }),
  ...stamps,
});

export const complaints = pgTable("complaints", {
  id: id(),
  number: text("number").notNull().unique(),
  parentId: uuid("parent_id").notNull().references(() => users.id),
  sessionId: uuid("session_id").references(() => sessions.id),
  category: complaintCategoryEnum("category").notNull(),
  recipients: complaintRecipientsEnum("recipients").notNull(),
  priority: complaintPriorityEnum("priority").notNull().default("NORMAL"),
  status: complaintStatusEnum("status").notNull().default("NEW"),
  assigneeId: uuid("assignee_id").references(() => users.id),
  /** Décision #14 ouverte : délai de traitement. */
  dueAt: timestamp("due_at", { withTimezone: true }),
  ...stamps,
});

export const complaintMessages = pgTable("complaint_messages", {
  id: id(),
  complaintId: uuid("complaint_id").notNull().references(() => complaints.id),
  authorId: uuid("author_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  attachments: text("attachments").array().notNull().default(sql`'{}'`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: id(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
  channel: text("channel").notNull().default("PUSH"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("notifications_user_idx").on(t.userId)]);

export const auditLogs = pgTable("audit_logs", {
  id: id(),
  actorId: uuid("actor_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: uuid("entity_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
