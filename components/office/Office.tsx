type OfficeProps = {
  children: React.ReactNode;
};

export default function Office({
  children,
}: OfficeProps) {
  return (
    <main className="relative h-screen overflow-hidden bg-[#efe8de]">

      {/* Ambient room */}
      <div className="absolute inset-0">
        {children}
      </div>

    </main>
  );
}