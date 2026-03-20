import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/withAuth";
import { getSupplierById } from "@/features/suppliers/Actions/getSupplierById";
import { EditSupplierForm } from "@/features/suppliers/Components/EditSupplierForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditSupplierPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const { id } = await params;
  const supplier = await getSupplierById(id);
  if (!supplier) notFound();

  const isNorwegian = supplier.type === "NORWEGIAN";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/suppliers">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Rediger leverandør
          </h1>
          <p className="text-sm text-muted-foreground">{supplier.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left column: Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Oppsummering</CardTitle>
              <Badge
                variant="outline"
                className={
                  isNorwegian
                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30"
                    : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30"
                }
              >
                {isNorwegian ? "Norsk" : "Utenlandsk"}
              </Badge>
            </div>
            <CardDescription>{supplier.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Navn</p>
                <p className="font-medium">{supplier.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Land</p>
                <p className="font-medium">{supplier.country}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Valuta</p>
                <p className="font-medium">{supplier.currency}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {isNorwegian ? "Org.nr" : "VAT-ID"}
                </p>
                <p className="font-medium">
                  {isNorwegian
                    ? supplier.orgNr || "—"
                    : supplier.vatId || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  Standardkategori
                </p>
                <p className="font-medium">
                  {supplier.defaultCategory || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  Transaksjoner
                </p>
                <p className="font-medium">{supplier._count.transactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right column: Edit form */}
        <div>
          <EditSupplierForm supplier={supplier} />
        </div>
      </div>
    </div>
  );
}
