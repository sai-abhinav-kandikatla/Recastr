export default function TasksLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-44 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex gap-2 rounded-2xl border bg-card p-2">
        <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="rounded-2xl border bg-card p-4" key={index}>
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-4 w-4/5 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-9 w-40 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
