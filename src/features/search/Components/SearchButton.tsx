"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="hidden md:flex gap-2 text-muted-foreground"
      onClick={() => window.dispatchEvent(new Event("open-search"))}
    >
      <Search className="size-3.5" />
      <span className="text-xs">Sok...</span>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
}
