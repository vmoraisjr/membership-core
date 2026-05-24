import "./globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

import { Toaster } from "@/components/ui/sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Membership Core",
  description: "Multi-tenant membership platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>{children} <Toaster /> </body>
    </html>
  );
}