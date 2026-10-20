import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Moriarty — sua plataforma de estudos", template: "%s · Moriarty" },
  description:
    "Plataforma de estudos com cronograma, revisão espaçada, simulados, biblioteca e compartilhamento seguro de materiais.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
