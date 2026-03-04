"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTermLabel } from "@/lib/format";

type TermSelectorProps = {
  currentYear: number;
  currentTerm: number | null;
};

export function TermSelector({ currentYear, currentTerm }: TermSelectorProps) {
  const router = useRouter();
  const currentYearNum = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYearNum - i);

  function handleYearChange(year: string) {
    if (currentTerm) {
      router.push(`/mva?year=${year}&term=${currentTerm}`);
    } else {
      router.push(`/mva?year=${year}`);
    }
  }

  function handleTermChange(term: string) {
    if (term === "ALL") {
      router.push(`/mva?year=${currentYear}`);
    } else {
      router.push(`/mva?year=${currentYear}&term=${term}`);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Select
        value={String(currentYear)}
        onValueChange={handleYearChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Velg år" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentTerm ? String(currentTerm) : "ALL"}
        onValueChange={handleTermChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Velg termin" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Alle terminer</SelectItem>
          {[1, 2, 3, 4, 5, 6].map((t) => (
            <SelectItem key={t} value={String(t)}>
              Termin {t} ({formatTermLabel(t)})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
