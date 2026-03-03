import { getSuppliers } from "@/features/suppliers/Actions/getSuppliers";
import { SupplierList } from "@/features/suppliers/Components/SupplierList";

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="container mx-auto py-6">
      <SupplierList suppliers={suppliers} />
    </div>
  );
}
