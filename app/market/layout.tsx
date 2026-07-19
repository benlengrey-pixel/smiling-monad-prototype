import type {
  ReactNode,
} from "react";

import RequireSignedInUser from "../../components/access/RequireSignedInUser";

type MarketLayoutProps = {
  children: ReactNode;
};

export default function MarketLayout({
  children,
}: MarketLayoutProps) {
  return (
    <RequireSignedInUser>
      {children}
    </RequireSignedInUser>
  );
}