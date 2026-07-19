import type {
  ReactNode,
} from "react";

import RequireSignedInUser from "../../components/access/RequireSignedInUser";

type CommunityLayoutProps = {
  children: ReactNode;
};

export default function CommunityLayout({
  children,
}: CommunityLayoutProps) {
  return (
    <RequireSignedInUser>
      {children}
    </RequireSignedInUser>
  );
}