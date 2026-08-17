import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/nav/top-nav";
import { BottomNav } from "@/components/nav/bottom-nav";
import { auth } from "@/lib/auth";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Artsy — Discover original work from independent creators",
  description:
    "A marketplace for one-of-one and limited-edition creations — paintings, sculpture, ceramics, furniture, and more, made by real people you'd never otherwise find.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased bg-paper text-ink">
        <TopNav session={session} />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <BottomNav session={session} />
      </body>
    </html>
  );
}
