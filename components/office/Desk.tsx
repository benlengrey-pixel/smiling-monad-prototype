type DeskProps = {
  children?: React.ReactNode;
};

export default function Desk({
  children,
}: DeskProps) {
  return (
    <section className="absolute inset-0">

      {/* The entire Office is the desk */}

      <div className="absolute inset-0">

        {/* Warm morning light */}
        <div className="absolute left-1/2 top-1/2 h-[900px] w-[1400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-[180px]" />

        {children}

      </div>

    </section>
  );
}