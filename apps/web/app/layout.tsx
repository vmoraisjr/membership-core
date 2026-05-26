import "./globals.css";

import type { Metadata } from "next";

import { Toaster } from "@/components/ui/sonner";

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
    <html lang="en" className="font-sans">
      <body>{children} <Toaster /> </body>
    </html>
  );
}
