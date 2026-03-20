import type { Metadata } from "next";
import { Press_Start_2P, Bangers } from "next/font/google";
import "./globals.css";

const pixelFont = Press_Start_2P({
  weight: "400",
  variable: "--font-pixel",
  subsets: ["latin"],
});

const comicFont = Bangers({
  weight: "400",
  variable: "--font-comic",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EP Slot Booking",
  description: "Book your exam slot — March 23 to 26, 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${pixelFont.variable} ${comicFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
