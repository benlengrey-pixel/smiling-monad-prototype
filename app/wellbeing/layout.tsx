import type {
  ReactNode,
} from "react";

import RequireSignedInUser from "../../components/access/RequireSignedInUser";

type WellbeingLayoutProps = {
  children: ReactNode;
};

export default function WellbeingLayout({
  children,
}: WellbeingLayoutProps) {
  return (
    <RequireSignedInUser>
      {children}
    </RequireSignedInUser>
  );
}