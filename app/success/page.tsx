import Link from 'next/link';

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-violet-100 flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="text-6xl">🌿</div>
      <h1 className="text-4xl font-black tracking-tight text-slate-800">
        You&rsquo;re all set!
      </h1>
      <p className="max-w-sm text-lg text-slate-600">
        ChillScreen is now installed. Head to Slack, find{' '}
        <strong>ChillScreen</strong> under Apps, and pick your first scene.
      </p>
      <Link
        href="slack://open"
        className="rounded-xl bg-emerald-700 px-7 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-emerald-800"
      >
        Open Slack
      </Link>
      <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition">
        Back to home
      </Link>
    </main>
  );
}
