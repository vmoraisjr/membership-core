"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMobileNav } from "./mobile-nav-context";

export function MobileNavTrigger() {
  const { setOpen } = useMobileNav();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="lg:hidden"
      aria-label="Abrir menu de navegação"
      onClick={() => setOpen(true)}
    >
      <Menu className="size-4" />
    </Button>
  );
}
