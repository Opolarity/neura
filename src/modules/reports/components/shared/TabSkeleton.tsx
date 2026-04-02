export function TabSkeleton() {
  return (
    <div className="space-y-4 mt-6">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-muted animate-pulse rounded-lg" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-52 bg-muted animate-pulse rounded-lg" />
        <div className="h-52 bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
  );
}
