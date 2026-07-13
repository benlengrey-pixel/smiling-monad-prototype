type FloatingObjectProps = {
  title: string;
  subtitle?: string;
  preview?: string;
  x: number;
  y: number;
};

export default function FloatingObject({
  title,
  subtitle,
  preview,
  x,
  y,
}: FloatingObjectProps) {
  return (
    <button
      className="
        absolute
        w-80
        rounded-[24px]
        bg-white/55
        p-6
        text-left
        backdrop-blur-2xl
        shadow-[0_6px_25px_rgba(0,0,0,.05)]
        transition-all
        duration-300
        hover:-translate-y-1
        hover:bg-white/90
        hover:shadow-[0_18px_50px_rgba(0,0,0,.10)]
      "
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
    >
      <div className="text-xl font-medium text-neutral-900">
        {title}
      </div>

      {subtitle && (
        <div className="mt-1 text-sm text-neutral-500">
          {subtitle}
        </div>
      )}

      {preview && (
        <div className="mt-4 line-clamp-2 text-sm leading-6 text-neutral-500">
          {preview}
        </div>
      )}
    </button>
  );
}