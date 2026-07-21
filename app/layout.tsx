import type {
  Metadata,
  Viewport,
} from "next";

import GlobalCompanionDock from "@/components/companion/GlobalCompanionDock";

import "./globals.css";

export const metadata: Metadata = {
  title: "The Smiling Monad",
  description: "Smiling Monad Space",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <GlobalCompanionDock />
      </body>
    </html>
  );
}