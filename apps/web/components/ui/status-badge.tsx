const statusMap: Record<string, { label: string; className: string }> = {
  SCHEDULED:   { label: 'Scheduled',   className: 'bg-teal-50 text-teal-700 border border-teal-200' },
  COMPLETED:   { label: 'Completed',   className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  CANCELLED:   { label: 'Cancelled',   className: 'bg-rose-50 text-rose-700 border border-rose-200' },
  RESCHEDULED: { label: 'Rescheduled', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
};

export function StatusBadge({ status }: { status: string }) {
  const s = statusMap[status] ?? { label: status, className: 'bg-[#F0F1EE] text-[#4B5563] border border-[#E2E4DE]' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
}
