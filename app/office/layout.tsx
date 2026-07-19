import type {
  ReactNode,
} from "react";

import RequireSignedInUser from "../../components/access/RequireSignedInUser";

type OfficeLayoutProps = {
  children: ReactNode;
};

export default function OfficeLayout({
  children,
}: OfficeLayoutProps) {
  return (
    <RequireSignedInUser>
      {children}
    </RequireSignedInUser>
  );
}