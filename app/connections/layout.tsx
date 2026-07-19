import type {
  ReactNode,
} from "react";

import RequireSignedInUser from "../../components/access/RequireSignedInUser";

type ConnectionsLayoutProps = {
  children: ReactNode;
};

export default function ConnectionsLayout({
  children,
}: ConnectionsLayoutProps) {
  return (
    <RequireSignedInUser>
      {children}
    </RequireSignedInUser>
  );
}