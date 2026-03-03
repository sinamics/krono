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
  currentTerm: number;
};

export function TermSelector({ currentYear, currentTerm }: TermSelectorProps) {
  const router = useRouter();
  const currentYearNum = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYearNum - i);

  function handleChange(year: string, term: string) {
    router.push(`/mva?year=${year}&term=${term}`);
  }

  return (
    <div className="flex items-center gap-3">
      <Select
        value={String(currentYear)}
        onValueChange={(y) => handleChange(y, String(currentTerm))}
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
        value={String(currentTerm)}
        onValueChange={(t) => handleChange(String(currentYear), t)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Velg termin" />
        </SelectTrigger>
        <SelectContent>
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
