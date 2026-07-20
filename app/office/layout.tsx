import type {
  ReactNode,
} from "react";

type OfficeLayoutProps = {
  children: ReactNode;
};

export default function OfficeLayout({
  children,
}: OfficeLayoutProps) {
  return children;
}