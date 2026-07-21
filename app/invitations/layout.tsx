import type {
  ReactNode,
} from "react";

import RequireAuthenticatedUser from "@/components/access/RequireAuthenticatedUser";

type InvitationsLayoutProps = {
  children: ReactNode;
};

export default function InvitationsLayout({
  children,
}: InvitationsLayoutProps) {
  return (
    <RequireAuthenticatedUser>
      {children}
    </RequireAuthenticatedUser>
  );
}