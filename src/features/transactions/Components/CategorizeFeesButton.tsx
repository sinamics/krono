"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tags, Loader2 } from "lucide-react";
import { categorizePaymentFees } from "@/features/arsoppgjor/Actions/categorizePaymentFees";

export function CategorizeFeesButton({ count }: { count: number }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  if (count === 0 || done) return null;

  async function handleClick() {
    setLoading(true);
    try {
      const result = await categorizePaymentFees();
      setDone(true);
      router.refresh();
      alert(`${result.updated} transaksjoner kategorisert som Betalingsgebyr`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-1.5 size-4 animate-spin" />
      ) : (
        <Tags className="mr-1.5 size-4" />
      )}
      Kategoriser {count} Stripe/PayPal-gebyrer
    </Button>
  );
}
