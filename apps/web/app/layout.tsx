import "./globals.css";

import type { Metadata } from "next";

import { AppFooter } from "@/components/branding/app-footer";
import { Toaster } from "@/components/ui/sonner";
import {
  SHEEP_APP_ICON_LIGHT_PATH,
  SHEEP_BRAND_SIGNATURE,
} from "@/lib/branding";
import messages from "@/messages/pt-BR.json";
import { TranslationProvider } from "@/i18n/provider";
import {
  defaultLocale,
  getMessage,
} from "@/i18n/messages";

export const metadata: Metadata = {
  title: SHEEP_BRAND_SIGNATURE,
  description: getMessage(
    "app.metadata.description"
  ),
  icons: {
    icon: SHEEP_APP_ICON_LIGHT_PATH,
    apple: SHEEP_APP_ICON_LIGHT_PATH,
  },
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
      <body className="min-h-screen">
        <TranslationProvider
          locale={defaultLocale}
          messages={messages}
        >
          <div className="flex min-h-screen flex-col bg-background">
            <div className="flex-1">
              {children}
            </div>
            <AppFooter />
          </div>
          <Toaster />
        </TranslationProvider>
      </body>
    </html>
  );
}
