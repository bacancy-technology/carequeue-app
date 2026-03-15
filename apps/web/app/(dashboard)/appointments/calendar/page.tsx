'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DatesSetArg } from '@fullcalendar/core';
import { appointmentsApi } from '../../../../lib/api/appointments';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED:   '#0D9488',
  RESCHEDULED: '#F59E0B',
  COMPLETED:   '#10B981',
  CANCELLED:   '#EF4444',
};

export default function CalendarPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState({
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar', dateRange.dateFrom, dateRange.dateTo],
    queryFn: () => appointmentsApi.getCalendarEvents(dateRange.dateFrom, dateRange.dateTo),
  });

  const handleDatesSet = useCallback((info: DatesSetArg) => {
    setDateRange({
      dateFrom: info.startStr.split('T')[0],
      dateTo: info.endStr.split('T')[0],
    });
  }, []);

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      router.push(`/appointments/${info.event.id}`);
    },
    [router],
  );

  const calendarEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    backgroundColor: STATUS_COLORS[e.status] ?? '#6B7280',
    borderColor: STATUS_COLORS[e.status] ?? '#6B7280',
    extendedProps: e.extendedProps,
  }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1D1F]">Calendar</h1>
          <p className="text-sm text-[#9CA3AF] mt-0.5">Click any appointment to view details</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-[#6B7280]">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="capitalize">{status.toLowerCase()}</span>
              </div>
            ))}
          </div>
          <Link
            href="/appointments/new"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Book
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E4DE] shadow-sm p-4 [&_.fc-button]:!bg-teal-600 [&_.fc-button]:!border-teal-600 [&_.fc-button:hover]:!bg-teal-700 [&_.fc-button-active]:!bg-teal-800 [&_.fc-today-button]:!bg-[#F0F1EE] [&_.fc-today-button]:!border-[#E2E4DE] [&_.fc-today-button]:!text-[#4B5563] [&_.fc-toolbar-title]:!text-lg [&_.fc-toolbar-title]:!font-bold [&_.fc-toolbar-title]:!text-[#1A1D1F] [&_.fc-col-header-cell]:!font-medium [&_.fc-col-header-cell]:!text-[#6B7280]">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center text-sm text-[#9CA3AF]">
            Loading calendar…
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={calendarEvents}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            height="auto"
            slotMinTime="07:00:00"
            slotMaxTime="21:00:00"
            allDaySlot={false}
            nowIndicator
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false }}
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false }}
          />
        )}
      </div>
    </div>
  );
}
