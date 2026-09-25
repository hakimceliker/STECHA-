import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stech AI",
  description: "Türkçe konuşan, günlük hayata hazır AI asistanı",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
