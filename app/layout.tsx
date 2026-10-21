import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'MONEY_DUMB', // Change this
  description: 'Financial Command Center',
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
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
    <html lang="en">
      <head>
        {/* idleAustin Core Typography: Outfit (headings), Geist (body), Fira Code (monetary/telemetry) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400..600&family=Geist:wght@300..800&family=Outfit:wght@400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen" style={{ background: 'var(--as-bg-base)', color: 'var(--as-text-primary)', fontFamily: 'var(--as-font-body)' }}>
        {children}
      </body>
    </html>
  );
}