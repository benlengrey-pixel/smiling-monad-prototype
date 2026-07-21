import type { ReactNode } from "react";

type SchoolLayoutProps = {
  children: ReactNode;
};

export default function SchoolLayout({
  children,
}: SchoolLayoutProps) {
  return children;
}