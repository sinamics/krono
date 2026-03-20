"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Search } from "lucide-react";

type Supplier = {
  id: string;
  name: string;
};

type Props = {
  suppliers: Supplier[];
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const terms = [
  { value: "1", label: "T1 (Jan-Feb)" },
  { value: "2", label: "T2 (Mar-Apr)" },
  { value: "3", label: "T3 (Mai-Jun)" },
  { value: "4", label: "T4 (Jul-Aug)" },
  { value: "5", label: "T5 (Sep-Okt)" },
  { value: "6", label: "T6 (Nov-Des)" },
];

export function TransactionFilters({ suppliers }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "ALL") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/transactions?${params.toString()}`);
    },
    [router, searchParams]
  );

  const selectedSupplierId = searchParams.get("supplierId");
  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  const filteredSuppliers = supplierSearch
    ? suppliers.filter((s) =>
        s.name.toLowerCase().includes(supplierSearch.toLowerCase())
      )
    : suppliers;

  useEffect(() => {
    if (supplierOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    } else {
      setSupplierSearch("");
    }
  }, [supplierOpen]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={searchParams.get("year") ?? String(currentYear)}
        onValueChange={(v) => updateParam("year", v)}
      >
        <SelectTrigger className="w-[100px]" size="sm">
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
        <SelectTrigger className="w-[160px]" size="sm">
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
        <SelectTrigger className="w-[120px]" size="sm">
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
        <SelectTrigger className="w-[150px]" size="sm">
          <SelectValue placeholder="Alle MVA-koder" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Alle MVA-koder</SelectItem>
          <SelectItem value="CODE_52">Kode 52</SelectItem>
          <SelectItem value="CODE_86">Kode 86</SelectItem>
          <SelectItem value="CODE_1">Kode 1</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("source") ?? "ALL"}
        onValueChange={(v) => updateParam("source", v)}
      >
        <SelectTrigger className="w-[130px]" size="sm">
          <SelectValue placeholder="Alle kilder" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Alle kilder</SelectItem>
          <SelectItem value="manual">Manuell</SelectItem>
          <SelectItem value="stripe">Stripe</SelectItem>
          <SelectItem value="paypal">PayPal</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={supplierOpen}
            size="sm"
            className="w-[180px] justify-between font-normal"
          >
            <span className="truncate">
              {selectedSupplier ? selectedSupplier.name : "Alle leverandører"}
            </span>
            <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <div className="p-2">
            <Input
              ref={searchInputRef}
              placeholder="Søk leverandør..."
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent rounded-sm"
              onClick={() => {
                updateParam("supplierId", "ALL");
                setSupplierOpen(false);
              }}
            >
              <Check
                className={`size-3.5 ${!selectedSupplierId ? "opacity-100" : "opacity-0"}`}
              />
              Alle leverandører
            </button>
            {filteredSuppliers.map((s) => (
              <button
                key={s.id}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent rounded-sm"
                onClick={() => {
                  updateParam("supplierId", s.id);
                  setSupplierOpen(false);
                }}
              >
                <Check
                  className={`size-3.5 ${selectedSupplierId === s.id ? "opacity-100" : "opacity-0"}`}
                />
                <span className="truncate">{s.name}</span>
              </button>
            ))}
            {filteredSuppliers.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Ingen treff
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Søk..."
          defaultValue={searchParams.get("search") ?? ""}
          className="w-[180px] pl-8 h-8"
          onChange={(e) => {
            const timeout = setTimeout(() => {
              updateParam("search", e.target.value);
            }, 400);
            return () => clearTimeout(timeout);
          }}
        />
      </div>
    </div>
  );
}
