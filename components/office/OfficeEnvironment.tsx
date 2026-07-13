import type { ReactNode } from "react";
import OfficeBackground from "./OfficeBackground";
import OfficeBackButton from "./OfficeBackButton";

type OfficeEnvironmentProps = {
  children: ReactNode;
};

export default function OfficeEnvironment({
  children,
}: OfficeEnvironmentProps) {
  return (
    <main className="relative h-[100svh] w-full overflow-hidden bg-[#d9c3a6]">
      <OfficeBackground />
      <OfficeBackButton />
      {children}
    </main>
  );
}