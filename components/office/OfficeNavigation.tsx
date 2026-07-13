type OfficeNavigationProps = {
  items: {
    label: string;
    active?: boolean;
  }[];
};

export default function OfficeNavigation({
  items,
}: OfficeNavigationProps) {
  return (
    <nav className="mb-8">
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.label}>
            <button
              className={`w-full rounded-xl px-4 py-3 text-left transition ${
                item.active
                  ? "bg-black text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}