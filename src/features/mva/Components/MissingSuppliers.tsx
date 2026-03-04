import { AlertTriangle } from "lucide-react";
import { formatTermLabel } from "@/lib/format";

type MissingSuppliersProps = {
  suppliers: { id: string; name: string }[];
  prevTerm: number;
};

export function MissingSuppliers({
  suppliers,
  prevTerm,
}: MissingSuppliersProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">
            {suppliers.length} leverandør{suppliers.length > 1 ? "er" : ""} fra
            T{prevTerm} ({formatTermLabel(prevTerm)}) mangler i denne terminen
          </p>
          <ul className="mt-2 space-y-1">
            {suppliers.map((s) => (
              <li key={s.id} className="text-sm text-muted-foreground">
                {s.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
