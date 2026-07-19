import type {
  ReactNode,
} from "react";

import RequireSignedInUser from "../../components/access/RequireSignedInUser";

type ProjectLayoutProps = {
  children: ReactNode;
};

export default function ProjectLayout({
  children,
}: ProjectLayoutProps) {
  return (
    <RequireSignedInUser>
      {children}
    </RequireSignedInUser>
  );
}