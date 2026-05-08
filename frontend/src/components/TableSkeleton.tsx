export default function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-surface-2/50">
          <div className="shimmer h-3 w-40 rounded-full" />
          <div className="shimmer h-3 w-32 rounded-full" />
          <div className="shimmer h-3 w-28 rounded-full ml-auto" />
          <div className="shimmer h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
