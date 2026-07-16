import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const kurland = localFont({
  src: [
    {
      path: "../fonts/Kurland/Kurland-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Kurland/Kurland-Italic.otf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Prive Stories — групповой памятный подарок",
  description:
    "Собираем воспоминания, чувства и личные истории и превращаем их в памятный артефакт.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={kurland.variable}>
      <body className={kurland.className}>{children}</body>
    </html>
  );
}
