import Link from 'next/link';

export default function ErrorPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  const reason = searchParams.reason ?? 'unknown_error';

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-violet-100 flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="text-6xl">😔</div>
      <h1 className="text-4xl font-black tracking-tight text-slate-800">
        Something went wrong
      </h1>
      <p className="max-w-sm text-lg text-slate-600">
        The installation didn&rsquo;t complete ({reason}). Please try again.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-emerald-700 px-7 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-emerald-800"
      >
        Back to home
      </Link>
    </main>
  );
}
