import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Parallel Routes & Intercept Routes DEMO",
  description: "A demo project for Next.js 13.4's new features: Parallel Routes and Intercept Routes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={inter.variable}>
      <head></head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
