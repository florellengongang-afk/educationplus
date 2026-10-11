import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EducationPlus — Administration",
  description: "Espaces Partenaire et Administrateur d'EducationPlus, répétiteurs à domicile.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
