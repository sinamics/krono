"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const terms = [
  { value: "1", label: "Termin 1 (Jan-Feb)" },
  { value: "2", label: "Termin 2 (Mar-Apr)" },
  { value: "3", label: "Termin 3 (Mai-Jun)" },
  { value: "4", label: "Termin 4 (Jul-Aug)" },
  { value: "5", label: "Termin 5 (Sep-Okt)" },
  { value: "6", label: "Termin 6 (Nov-Des)" },
];

export function TransactionFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "ALL") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/transactions?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={searchParams.get("year") ?? String(currentYear)}
        onValueChange={(v) => updateParam("year", v)}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="År" />
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
        value={searchParams.get("term") ?? "ALL"}
        onValueChange={(v) => updateParam("term", v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Alle terminer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Alle terminer</SelectItem>
          {terms.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("type") ?? "ALL"}
        onValueChange={(v) => updateParam("type", v)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Alle typer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Alle typer</SelectItem>
          <SelectItem value="SALE">Salg</SelectItem>
          <SelectItem value="EXPENSE">Utgift</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("mvaCode") ?? "ALL"}
        onValueChange={(v) => updateParam("mvaCode", v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Alle MVA-koder" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Alle MVA-koder</SelectItem>
          <SelectItem value="CODE_52">Kode 52</SelectItem>
          <SelectItem value="CODE_86">Kode 86</SelectItem>
          <SelectItem value="CODE_1">Kode 1</SelectItem>
        </SelectContent>
      </Select>

      <Input
        placeholder="Søk beskrivelse..."
        defaultValue={searchParams.get("search") ?? ""}
        className="w-[200px]"
        onChange={(e) => {
          const timeout = setTimeout(() => {
            updateParam("search", e.target.value);
          }, 400);
          return () => clearTimeout(timeout);
        }}
      />
    </div>
  );
}
