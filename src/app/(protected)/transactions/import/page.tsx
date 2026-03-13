import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/withAuth";
import { db } from "@/lib/db";
import { BulkImportWizard } from "@/features/transactions/Components/BulkImportWizard";
import { Button } from "@/components/ui/button";

export default async function BulkImportPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const suppliers = await db.supplier.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/transactions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Importer faktura</h1>
      </div>
      <BulkImportWizard suppliers={suppliers} />
    </div>
  );
}
