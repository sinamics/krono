import { getSuppliers } from "@/features/suppliers/Actions/getSuppliers";
import { SupplierList } from "@/features/suppliers/Components/SupplierList";

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="flex flex-col gap-6">
      <SupplierList suppliers={suppliers} />
    </div>
  );
}
