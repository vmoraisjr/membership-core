"use client";

import { ChevronDown, LogOut } from "lucide-react";

import type { AppRole } from "@/features/auth/constants/roles";
import { getRoleLabel } from "@/features/auth/constants/roles";
import { logoutAction } from "@/features/auth/actions/logout";
import { useTranslations } from "@/i18n/provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const APP_VERSION = "0.1.0";

type Props = {
  role: AppRole;
  currentUser: {
    name: string;
    email: string;
  };
};

export function UserMenu({ role, currentUser }: Props) {
  const t = useTranslations();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-border/70 bg-background/85 px-3 py-1.5 text-left shadow-[var(--shadow-xs)] transition-colors hover:bg-background"
        >
          <span className="text-xs font-medium text-foreground">
            {currentUser.name}
          </span>
          <span className="text-xs text-muted-foreground">
            · {getRoleLabel(role)}
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium text-foreground">
            {currentUser.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {currentUser.email}
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem disabled className="justify-between text-xs text-muted-foreground">
          <span>Versão</span>
          <span>{APP_VERSION}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <form action={logoutAction}>
          <DropdownMenuItem
            asChild
            variant="destructive"
          >
            <button type="submit" className="w-full">
              <LogOut className="size-4" />
              {t("shared.actions.signOut")}
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
