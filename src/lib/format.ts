import { format } from "date-fns";
import { nb } from "date-fns/locale";

export function formatCurrency(amount: number, currency = "NOK"): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd.MM.yyyy", { locale: nb });
}

export function formatTermLabel(term: number): string {
  const labels: Record<number, string> = {
    1: "Jan-Feb",
    2: "Mar-Apr",
    3: "Mai-Jun",
    4: "Jul-Aug",
    5: "Sep-Okt",
    6: "Nov-Des",
  };
  return labels[term] ?? `Termin ${term}`;
}

export function getTermFromDate(date: Date): number {
  const month = date.getMonth() + 1;
  return Math.ceil(month / 2);
}

export function getTermPeriod(date: Date): string {
  const year = date.getFullYear();
  const term = getTermFromDate(date);
  return `${year}-${term}`;
}

export function getTermDeadline(year: number, term: number): Date {
  const deadlineMonth = term * 2 + 1; // Month after the term ends
  if (deadlineMonth > 12) {
    return new Date(year + 1, 0, 10); // January 10 next year
  }
  return new Date(year, deadlineMonth - 1, 10);
}

export function getMvaCodeLabel(code: string): string {
  const labels: Record<string, string> = {
    CODE_52: "Kode 52 - Utførsel",
    CODE_86: "Kode 86 - Utland",
    CODE_1: "Kode 1 - Inngående 25%",
    CODE_11: "Kode 11 - Inngående 15%",
    CODE_13: "Kode 13 - Inngående 12%",
    CODE_81: "Kode 81 - Import varer",
  };
  return labels[code] ?? code;
}
