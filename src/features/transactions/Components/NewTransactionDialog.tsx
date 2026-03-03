"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { supplier } from "@/generated/db/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionForm } from "./TransactionForm";

type Props = {
  suppliers: supplier[];
};

export function NewTransactionDialog({ suppliers }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Ny transaksjon
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ny transaksjon</DialogTitle>
        </DialogHeader>
        <TransactionForm
          suppliers={suppliers}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
