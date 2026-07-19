import type {
  ReactNode,
} from "react";

import RequireSignedInUser from "../../components/access/RequireSignedInUser";

type ProfilesLayoutProps = {
  children: ReactNode;
};

export default function ProfilesLayout({
  children,
}: ProfilesLayoutProps) {
  return (
    <RequireSignedInUser>
      {children}
    </RequireSignedInUser>
  );
}