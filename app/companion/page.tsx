import Link from "next/link";

export default function CompanionPage() {
  return (
    <main className="min-h-screen bg-[#f7f2e8] p-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-blue-600 hover:underline"
        >
          ← Home
        </Link>

        <h1 className="mt-6 text-4xl font-bold">
          🤖 Companion
        </h1>

        <p className="mt-4 text-gray-600">
          External AI Companion
        </p>

        <div className="mt-8 space-y-4">
          <Link
            href="/companion/chat"
            className="block rounded-xl border bg-white p-6 hover:bg-gray-50"
          >
            💬 Open Chat
          </Link>

          <div className="rounded-xl border bg-white p-6">
            <strong>Gateway</strong>
            <p className="mt-2 text-gray-600">
              Ready
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <strong>Permissions</strong>
            <p className="mt-2 text-gray-600">
              Approval required
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
