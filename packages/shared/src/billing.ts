/** Cycles de 30 jours, échéances des parents et calcul des versements aux enseignants. */
import { productConfig } from "./config";

export type PaymentMode = "FULL" | "SPLIT" | "FLEXIBLE";

const DAY_MS = 86_400_000;

/** Date "YYYY-MM-DD" → jour du cycle (1 = date de démarrage). */
export function dayOfCycle(cycleStart: string, date: string): number {
  return Math.floor((Date.parse(date) - Date.parse(cycleStart)) / DAY_MS) + 1;
}

export function cycleEndDate(cycleStart: string): string {
  const end = new Date(Date.parse(cycleStart) + (productConfig.billingCycleDays - 1) * DAY_MS);
  return end.toISOString().slice(0, 10);
}

export interface Installment {
  day: number;
  amount: number;
}

/**
 * Échéancier d'un cycle (montants entiers en FCFA).
 * FULL : tout au jour 30 · SPLIT : 50 % au jour 15, le reste au jour 30 · FLEXIBLE : pas d'échéance fixe, solde dû au jour 30.
 */
export function installments(total: number, mode: PaymentMode): Installment[] {
  if (!Number.isInteger(total) || total < 0) throw new Error("Montant invalide.");
  if (mode === "SPLIT") {
    const first = Math.floor(total / 2);
    return [
      { day: 15, amount: first },
      { day: 30, amount: total - first },
    ];
  }
  return [{ day: 30, amount: total }];
}

/** Montant exigible à un jour donné (cumul des échéances passées). */
export function amountDue(total: number, mode: PaymentMode, day: number): number {
  return installments(total, mode)
    .filter((i) => i.day <= day)
    .reduce((sum, i) => sum + i.amount, 0);
}

export type PaymentCheck = { ok: true } | { ok: false; reason: "EXCEEDS_BALANCE" | "ADVANCE_BLOCKED" | "INVALID_AMOUNT" };

/**
 * Vérifie un paiement parent. La règle « pas d'avance après J20 » n'est appliquée
 * que si le flag est activé (décision #11) — et ne bloque jamais une somme déjà due.
 */
export function checkParentPayment(input: {
  total: number;
  paid: number;
  mode: PaymentMode;
  day: number;
  amount: number;
}): PaymentCheck {
  const { total, paid, mode, day, amount } = input;
  if (!Number.isInteger(amount) || amount <= 0) return { ok: false, reason: "INVALID_AMOUNT" };
  if (paid + amount > total) return { ok: false, reason: "EXCEEDS_BALANCE" };
  if (productConfig.blockVoluntaryAdvanceAfterDay20 && day > 20) {
    const stillDue = Math.max(0, amountDue(total, mode, day) - paid);
    if (amount > stillDue) return { ok: false, reason: "ADVANCE_BLOCKED" };
  }
  return { ok: true };
}

/** Versement enseignant : brut − 20 % − frais prestataire (inconnus tant que non décidés). */
export function computePayout(gross: number, providerFee: number | null = null) {
  if (!Number.isInteger(gross) || gross < 0) throw new Error("Montant invalide.");
  const commission = Math.round(gross * productConfig.commissionRate);
  return {
    gross,
    commission,
    providerFee,
    net: gross - commission - (providerFee ?? 0),
    feeUndecided: providerFee === null,
  };
}

export type PayoutStatus =
  | "TO_COMPUTE"
  | "PENDING_VALIDATION"
  | "AUTHORIZED"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "BLOCKED_DISPUTE"
  | "CANCELLED";

const PAYOUT_TRANSITIONS: Record<PayoutStatus, PayoutStatus[]> = {
  TO_COMPUTE: ["PENDING_VALIDATION", "CANCELLED"],
  PENDING_VALIDATION: ["AUTHORIZED", "BLOCKED_DISPUTE", "CANCELLED"],
  AUTHORIZED: ["PROCESSING", "BLOCKED_DISPUTE", "CANCELLED"],
  PROCESSING: ["PAID", "FAILED"],
  PAID: [],
  FAILED: ["PROCESSING", "CANCELLED"],
  BLOCKED_DISPUTE: ["PENDING_VALIDATION", "CANCELLED"],
  CANCELLED: [],
};

export function canTransitionPayout(from: PayoutStatus, to: PayoutStatus): boolean {
  return PAYOUT_TRANSITIONS[from].includes(to);
}

/** PAID n'est possible qu'avec une confirmation du prestataire. */
export function markPayoutPaid(current: PayoutStatus, providerConfirmationRef: string | null): PayoutStatus {
  if (current !== "PROCESSING") throw new Error("Seul un versement en cours peut passer à Payé.");
  if (!providerConfirmationRef) throw new Error("Confirmation du prestataire requise.");
  return "PAID";
}
