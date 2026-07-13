import "./globals.css";

export const metadata = {
  title: "The Smiling Monad",
  description: "Smiling Monad Office",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}