import type {
  ReactNode,
} from "react";

import RequireAuthenticatedUser from "@/components/access/RequireAuthenticatedUser";

type ConnectionsLayoutProps = {
  children: ReactNode;
};

export default function ConnectionsLayout({
  children,
}: ConnectionsLayoutProps) {
  return (
    <RequireAuthenticatedUser>
      {children}
    </RequireAuthenticatedUser>
  );
}