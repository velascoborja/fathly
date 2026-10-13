import type { Metadata, Viewport } from "next";
import { Fira_Code, Inter } from "next/font/google";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fathly",
  description: "Control compartido del presupuesto mensual del hogar.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${firaCode.variable} h-full antialiased`}
      style={{ backgroundColor: "#ffffff", colorScheme: "light" }}
    >
      <body className="flex min-h-full flex-col" style={{ backgroundColor: "#ffffff" }}>
        <noscript>
          <style>{`
            @layer base {
              [data-fathly-loading] { display: none !important; }
              [hidden]:has(> [data-fathly-signin]) { display: block !important; }
            }
          `}</style>
        </noscript>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
