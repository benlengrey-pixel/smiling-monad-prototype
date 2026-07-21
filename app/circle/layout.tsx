import type {
  ReactNode,
} from "react";

import RequireAuthenticatedUser from "@/components/access/RequireAuthenticatedUser";

type CircleLayoutProps = {
  children: ReactNode;
};

export default function CircleLayout({
  children,
}: CircleLayoutProps) {
  return (
    <RequireAuthenticatedUser>
      {children}
    </RequireAuthenticatedUser>
  );
}