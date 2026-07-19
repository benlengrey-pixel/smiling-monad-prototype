import type {
  ReactNode,
} from "react";

import RequireSignedInUser from "../../components/access/RequireSignedInUser";

type CircleLayoutProps = {
  children: ReactNode;
};

export default function CircleLayout({
  children,
}: CircleLayoutProps) {
  return (
    <RequireSignedInUser>
      {children}
    </RequireSignedInUser>
  );
}