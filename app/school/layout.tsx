import type {
  ReactNode,
} from "react";

import RequireSignedInUser from "../../components/access/RequireSignedInUser";

type SchoolLayoutProps = {
  children: ReactNode;
};

export default function SchoolLayout({
  children,
}: SchoolLayoutProps) {
  return (
    <RequireSignedInUser>
      {children}
    </RequireSignedInUser>
  );
}