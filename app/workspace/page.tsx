import Link from "next/link";

export default function WorkspacePage() {
  return (
    <main>
      <header>
        <Link href="/">Back to Office</Link>
      </header>

      <section>
        <h1>Workspace</h1>
        <p>Your current task will appear here.</p>
      </section>
    </main>
  );
}