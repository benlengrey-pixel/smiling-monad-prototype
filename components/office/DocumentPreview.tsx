type DocumentPreviewProps = {
  label: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  accent?: "sand" | "blue" | "purple";
};

const accentStyles = {
  sand: "text-[#9a8067]",
  blue: "text-[#7188a5]",
  purple: "text-[#8873a3]",
};

export default function DocumentPreview({
  label,
  title,
  subtitle,
  children,
  accent = "sand",
}: DocumentPreviewProps) {
  return (
    <article
      className="
        rounded-[1.6rem]
        border
        border-white/75
        bg-[#fffdf9]/88
        p-6
        shadow-[0_14px_40px_rgba(61,43,28,0.08)]
        backdrop-blur-xl
        transition
        duration-300
        hover:-translate-y-1
        hover:shadow-[0_20px_55px_rgba(61,43,28,0.12)]
      "
    >
      <p
        className={`text-xs font-semibold uppercase tracking-[0.18em] ${accentStyles[accent]}`}
      >
        {label}
      </p>

      <h2 className="mt-3 text-xl font-semibold text-[#211d19]">
        {title}
      </h2>

      {subtitle && (
        <p className="mt-2 text-sm text-[#74695f]">
          {subtitle}
        </p>
      )}

      {children && (
        <div className="mt-6 border-t border-black/5 pt-4 text-sm leading-6 text-[#5f574f]">
          {children}
        </div>
      )}
    </article>
  );
}