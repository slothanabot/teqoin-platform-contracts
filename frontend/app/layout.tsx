import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "TeQoin Flaunch - Token Launcher",
  description: "Launch ERC-20 meme coins in TeQoin L2 testnet with no code",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen flex flex-col max-w-md mx-auto border-x border-cardBorder shadow-2xl bg-background">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
