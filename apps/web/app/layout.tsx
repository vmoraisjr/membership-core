import "./globals.css";

import type { Metadata } from "next";

import { Toaster } from "@/components/ui/sonner";
import messages from "@/messages/pt-BR.json";
import { TranslationProvider } from "@/i18n/provider";
import {
  defaultLocale,
  getMessage,
} from "@/i18n/messages";

export const metadata: Metadata = {
  title: "Membership Core",
  description: getMessage(
    "app.metadata.description"
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={defaultLocale}
      className="font-sans"
    >
      <body>
        <TranslationProvider
          locale={defaultLocale}
          messages={messages}
        >
          {children} <Toaster />
        </TranslationProvider>
      </body>
    </html>
  );
}
