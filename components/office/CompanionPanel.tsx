export default function CompanionPanel() {
  return (
    <div className="absolute left-12 top-12 z-20 max-w-sm">

      <div className="flex items-center gap-4">

        <div className="h-14 w-14 overflow-hidden rounded-full bg-[#e8dece] shadow-sm">

          <img
            src="/branding/logo.png"
            alt="Kimi"
            className="h-full w-full object-cover"
          />

        </div>

        <div>

          <h2 className="text-xl font-semibold">
            Kimi
          </h2>

          <p className="text-sm text-neutral-500">
            Ready
          </p>

        </div>

      </div>

      <div className="mt-8 space-y-4 text-lg leading-8 text-neutral-700">

        <p>Good morning Ben.</p>

        <p>Peter starts in two hours.</p>

      </div>

    </div>
  );
}