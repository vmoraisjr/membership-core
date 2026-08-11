"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type MobileNavContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const MobileNavContext =
  createContext<MobileNavContextValue | null>(
    null
  );

export function MobileNavProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <MobileNavContext.Provider
      value={{ open, setOpen }}
    >
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const context = useContext(
    MobileNavContext
  );

  if (!context) {
    throw new Error(
      "useMobileNav must be used within a MobileNavProvider"
    );
  }

  return context;
}
