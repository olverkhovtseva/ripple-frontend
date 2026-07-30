import type { Metadata, Viewport } from "next";
import { Inter, Unbounded } from "next/font/google";
import LavaCursor from "@/components/effects/LavaCursor";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-oswald",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Prive Stories — подарок, который растрогает до слез",
  description:
    "Сервис сам соберет теплые воспоминания, истории и фотографии от друзей, близких или коллег и оформит их в презентацию, книгу или видео-фильм.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} ${unbounded.variable}`}>
      <body>
        <LavaCursor />
        {children}
      </body>
    </html>
  );
}
