export default function AmbientOffice() {
  return (
    <>
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8f5ef_0%,#ece4d8_100%)]" />

      {/* Warm morning light */}
      <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-white/70 blur-[140px]" />

      <div className="absolute right-0 top-20 h-[450px] w-[450px] rounded-full bg-[#efd8b4]/40 blur-[150px]" />

      {/* Gentle floor glow */}
      <div className="absolute bottom-[-120px] left-1/2 h-[350px] w-[900px] -translate-x-1/2 rounded-full bg-[#d7c1a3]/25 blur-[120px]" />

      {/* Very subtle texture */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(#000 0.6px, transparent 0.6px)",
          backgroundSize: "24px 24px",
        }}
      />
    </>
  );
}