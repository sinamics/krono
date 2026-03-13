import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/withAuth";
import { getTransactionById } from "@/features/transactions/Actions/getTransactions";
import { db } from "@/lib/db";
import { ExpenseForm } from "@/features/transactions/Components/ExpenseForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function UtleggsskjemaPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const { id } = await params;
  const transaction = await getTransactionById(id, session.organizationId);
  if (!transaction) notFound();

  const settings = await db.businessSettings.findUnique({
    where: { organizationId: session.organizationId },
  });

  return (
    <ExpenseForm
      transaction={transaction}
      businessName={settings?.businessName ?? undefined}
      orgNr={settings?.orgNr ?? undefined}
      ownerName={session.user.name}
    />
  );
}
