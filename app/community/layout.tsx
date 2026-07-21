import type { ReactNode } from "react";

type CommunityLayoutProps = {
  children: ReactNode;
};

export default function CommunityLayout({
  children,
}: CommunityLayoutProps) {
  return children;
}