import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "mix & fire — קהילת ערבוב צבעי גלזורה",
  description:
    "תעדו ערבובים של צבעי גלזורה, העלו תמונות של התוצאה האמיתית, וגלו מה יצא לאחרים.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-border py-6 text-center text-sm text-muted">
          mix &amp; fire · קהילת ערבוב צבעי גלזורה
        </footer>
      </body>
    </html>
  );
}
