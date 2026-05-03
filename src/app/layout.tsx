import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eng. Shehab Elebady | Star Math Portal",
  description:
    "Personal portfolio and secure mathematics examination portal for Eng. Shehab Elebady.",
  icons: {
    icon: "/favicon.ico"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
