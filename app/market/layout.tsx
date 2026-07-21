import type { ReactNode } from "react";

type MarketLayoutProps = {
  children: ReactNode;
};

export default function MarketLayout({
  children,
}: MarketLayoutProps) {
  return children;
}