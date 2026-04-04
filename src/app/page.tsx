import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Frontend barbería listo para landing multi-tenant</h1>
      <p className="max-w-xl text-sm text-zinc-600">
        Para ver una landing pública básica entra a un slug, por ejemplo:
      </p>
      <Link href="/demo-barber" className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white">
        Abrir /demo-barber
      </Link>
    </main>
  );
}
