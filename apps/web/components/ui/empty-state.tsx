interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-12 h-12 rounded-2xl bg-[#F0F1EE] flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-[#1A1D1F] font-semibold">{title}</p>
      {description && <p className="text-sm text-[#6B7280] mt-1">{description}</p>}
    </div>
  );
}
