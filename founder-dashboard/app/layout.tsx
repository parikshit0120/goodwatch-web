import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoodWatch Ops Dashboard",
  description: "Private founder operations dashboard",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
