import Companion from "@/components/companion/Companion";

export default function OfficeSidebar() {
  return (
    <div className="h-full">
      <Companion
        name="Companion"
        avatar="/branding/logo.png"
        status="ready"
        focus="Ready to help you today."
      />
    </div>
  );
}
