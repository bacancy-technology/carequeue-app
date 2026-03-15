export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[#F0F1EE] rounded-lg ${className}`} />
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-[#E2E4DE]">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <div className="w-9 h-9 rounded-full bg-[#F0F1EE] animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-[#F0F1EE] rounded-lg animate-pulse w-32" />
            <div className="h-3 bg-[#F0F1EE] rounded-lg animate-pulse w-24" />
          </div>
          {Array.from({ length: cols - 2 }).map((_, j) => (
            <div key={j} className="h-3.5 bg-[#F0F1EE] rounded-lg animate-pulse w-20 hidden md:block" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E4DE] p-5 animate-pulse">
      <div className="w-10 h-10 bg-[#F0F1EE] rounded-xl mb-4" />
      <div className="h-7 bg-[#F0F1EE] rounded-lg w-16 mb-2" />
      <div className="h-4 bg-[#F0F1EE] rounded-lg w-28" />
    </div>
  );
}
