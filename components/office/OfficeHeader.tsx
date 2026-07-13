type OfficeHeaderProps = {
  office: string;
  mode: string;
};

export default function OfficeHeader({
  office,
  mode,
}: OfficeHeaderProps) {
  return (
    <header className="mb-8 flex items-center justify-between border-b border-gray-200 pb-5">
      <div>
        <h1 className="text-3xl font-semibold">
          {office}
        </h1>

        <p className="mt-1 text-gray-500">
          {mode}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded-full border px-4 py-2 hover:bg-gray-100">
          Search
        </button>

        <button className="rounded-full border px-4 py-2 hover:bg-gray-100">
          Community
        </button>

        <button className="rounded-full border px-4 py-2 hover:bg-gray-100">
          Profile
        </button>
      </div>
    </header>
  );
}