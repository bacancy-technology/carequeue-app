'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '../../../lib/api/patients';
import { EmptyState } from '../../../components/ui/empty-state';
import { TableSkeleton } from '../../../components/ui/skeleton';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function calcAge(dob: string) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, page],
    queryFn: () => patientsApi.list({ search: search || undefined, page, limit }),
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1A1D1F]">Patients</h1>
          {data && <p className="text-sm text-[#6B7280] mt-0.5">{data.total} total patients</p>}
        </div>
        <Link
          href="/patients/new"
          className="inline-flex items-center gap-2 bg-teal-600 hover:opacity-90 text-white text-sm font-semibold px-3 sm:px-4 py-2.5 rounded-xl transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Add Patient</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative w-full sm:max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email or phone..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#E2E4DE] bg-white text-[#1A1D1F] placeholder:text-[#6B7280] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
          />
        </div>
      </div>

      {/* Table / Cards */}
      <div className="bg-white rounded-2xl border border-[#E2E4DE] overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : !data?.data.length ? (
          <EmptyState title="No patients found" description="Add your first patient to get started" />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E4DE] bg-[#F0F1EE]">
                    <th className="text-left px-6 py-3.5 font-semibold text-[#6B7280] text-xs uppercase tracking-wide">Patient</th>
                    <th className="text-left px-6 py-3.5 font-semibold text-[#6B7280] text-xs uppercase tracking-wide">Age / Gender</th>
                    <th className="text-left px-6 py-3.5 font-semibold text-[#6B7280] text-xs uppercase tracking-wide">Phone</th>
                    <th className="text-left px-6 py-3.5 font-semibold text-[#6B7280] text-xs uppercase tracking-wide">Registered</th>
                    <th className="text-left px-6 py-3.5 font-semibold text-[#6B7280] text-xs uppercase tracking-wide">Status</th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E4DE]">
                  {data.data.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F0F1EE]/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {p.user.firstName[0]}{p.user.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1A1D1F]">{p.user.firstName} {p.user.lastName}</p>
                            <p className="text-xs text-[#6B7280]">{p.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#1A1D1F]">{calcAge(p.dateOfBirth)} yrs · {p.gender}</td>
                      <td className="px-6 py-4 text-[#6B7280]">{p.phone}</td>
                      <td className="px-6 py-4 text-[#6B7280]">{formatDate(p.createdAt)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          p.user.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {p.user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/patients/${p.id}`}
                          className="text-teal-600 hover:underline text-xs font-semibold"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-[#E2E4DE]">
              {data.data.map((p) => (
                <Link key={p.id} href={`/patients/${p.id}`} className="flex items-center gap-3 px-4 py-4 hover:bg-[#F0F1EE]/60 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {p.user.firstName[0]}{p.user.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1A1D1F] truncate">{p.user.firstName} {p.user.lastName}</p>
                    <p className="text-xs text-[#6B7280] truncate">{p.user.email}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">{calcAge(p.dateOfBirth)} yrs · {p.gender} · {p.phone}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      p.user.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {p.user.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <svg className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-t border-[#E2E4DE] text-sm">
                <p className="text-[#6B7280] text-xs sm:text-sm">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} of {data.total}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 rounded-lg border border-[#E2E4DE] text-[#1A1D1F] disabled:opacity-40 hover:bg-[#F0F1EE] transition-colors text-xs sm:text-sm font-medium"
                  >
                    ← Prev
                  </button>
                  <span className="px-2 text-[#6B7280] text-xs font-medium">{page} / {totalPages}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 rounded-lg border border-[#E2E4DE] text-[#1A1D1F] disabled:opacity-40 hover:bg-[#F0F1EE] transition-colors text-xs sm:text-sm font-medium"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
