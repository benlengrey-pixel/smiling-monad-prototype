export default function OfficeBackground() {
  return (
    <picture>
      <source media="(max-width: 639px)" srcSet="/office.mobile.png" />

      <img
        src="/office.desktop.png"
        alt="Smiling Monad Office"
        className="absolute inset-0 h-full w-full select-none object-cover object-center"
        draggable={false}
      />
    </picture>
  );
}