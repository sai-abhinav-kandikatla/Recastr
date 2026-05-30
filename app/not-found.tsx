import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-white">
      <div className="max-w-lg text-center">
        <p className="text-sm uppercase tracking-[0.18em] text-violet-300">404</p>
        <h1 className="mt-4 text-4xl font-medium tracking-normal">This content pack does not exist.</h1>
        <p className="mt-4 text-sm leading-6 text-slate-400">Head back to the dashboard and open one of the demo projects.</p>
        <Button asChild className="mt-6 bg-white text-slate-950 hover:bg-slate-200">
          <Link href="/dashboard">Open dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
