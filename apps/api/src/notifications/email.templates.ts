const BASE = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F8FAFC;padding:40px 0;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">
      <div style="background:#2563EB;padding:28px 32px;">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">CareQueue</h1>
      </div>
      <div style="padding:32px;">
        {{BODY}}
      </div>
      <div style="padding:20px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;text-align:center;">
        <p style="margin:0;font-size:12px;color:#94A3B8;">© ${new Date().getFullYear()} CareQueue · This is an automated message.</p>
      </div>
    </div>
  </div>
`;

function wrap(body: string) {
  return BASE.replace('{{BODY}}', body);
}

function apptBlock(details: {
  patientName: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  duration: number;
  reason: string;
}) {
  return `
    <table style="width:100%;border-collapse:collapse;margin:20px 0;border-radius:10px;overflow:hidden;border:1px solid #E2E8F0;">
      ${[
        ['Patient',         details.patientName],
        ['Doctor',          `Dr. ${details.doctorName} · ${details.specialization}`],
        ['Date',            details.date],
        ['Time',            `${details.time} (${details.duration} min)`],
        ['Reason',          details.reason],
      ].map(([label, value], i) => `
        <tr style="background:${i % 2 === 0 ? '#F8FAFC' : '#fff'};">
          <td style="padding:12px 16px;font-size:13px;color:#64748B;font-weight:500;width:120px;">${label}</td>
          <td style="padding:12px 16px;font-size:13px;color:#1E293B;font-weight:600;">${value}</td>
        </tr>`).join('')}
    </table>
  `;
}

// ── Templates ──────────────────────────────────────────────────────────────────

export function appointmentConfirmedEmail(p: {
  patientName: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  duration: number;
  reason: string;
}) {
  return wrap(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#1E293B;">Appointment Confirmed ✓</h2>
    <p style="margin:0 0 24px;color:#64748B;font-size:14px;">Your appointment has been successfully booked.</p>
    ${apptBlock(p)}
    <p style="margin:24px 0 0;font-size:13px;color:#64748B;">
      Please arrive 10 minutes early. If you need to cancel or reschedule, do so at least 24 hours in advance.
    </p>
  `);
}

export function appointmentReminderEmail(p: {
  patientName: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  duration: number;
  reason: string;
}) {
  return wrap(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#1E293B;">Appointment Reminder 🔔</h2>
    <p style="margin:0 0 24px;color:#64748B;font-size:14px;">You have an appointment <strong>tomorrow</strong>.</p>
    ${apptBlock(p)}
    <p style="margin:24px 0 0;font-size:13px;color:#64748B;">
      Please arrive 10 minutes early and bring your ID and insurance card if applicable.
    </p>
  `);
}

export function appointmentCancelledEmail(p: {
  patientName: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  reason: string;
}) {
  return wrap(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#EF4444;">Appointment Cancelled</h2>
    <p style="margin:0 0 24px;color:#64748B;font-size:14px;">The following appointment has been cancelled.</p>
    ${apptBlock({ ...p, duration: 0 }).replace('(0 min)', '')}
    <p style="margin:24px 0 0;font-size:13px;color:#64748B;">
      To book a new appointment please visit the clinic portal or contact us directly.
    </p>
  `);
}

export function appointmentRescheduledEmail(p: {
  patientName: string;
  doctorName: string;
  specialization: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  duration: number;
  reason: string;
}) {
  return wrap(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#F59E0B;">Appointment Rescheduled</h2>
    <p style="margin:0 0 24px;color:#64748B;font-size:14px;">Your appointment has been moved to a new time.</p>
    <div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#92400E;">
      <strong>Previous:</strong> ${p.oldDate} at ${p.oldTime}
    </div>
    ${apptBlock({ patientName: p.patientName, doctorName: p.doctorName, specialization: p.specialization, date: p.newDate, time: p.newTime, duration: p.duration, reason: p.reason })}
  `);
}

export function inviteEmail(p: { name: string; role: string; inviteUrl: string }) {
  return wrap(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#1E293B;">You're invited to CareQueue</h2>
    <p style="margin:0 0 24px;color:#64748B;font-size:14px;">
      Hi ${p.name}, you've been added as a <strong>${p.role}</strong> on CareQueue.
      Click the button below to set up your password and activate your account.
      This link expires in <strong>7 days</strong>.
    </p>
    <a href="${p.inviteUrl}"
       style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:15px;margin-bottom:24px;">
      Accept Invitation
    </a>
    <p style="margin:0;font-size:13px;color:#94A3B8;">
      If you weren't expecting this invitation, you can safely ignore this email.
    </p>
    <p style="margin:8px 0 0;font-size:12px;color:#94A3B8;">
      Or copy this link: <a href="${p.inviteUrl}" style="color:#2563EB;">${p.inviteUrl}</a>
    </p>
  `);
}

export function doctorAppointmentEmail(p: {
  doctorName: string;
  patientName: string;
  date: string;
  time: string;
  duration: number;
  reason: string;
  type: 'BOOKED' | 'CANCELLED' | 'RESCHEDULED';
}) {
  const typeLabel = { BOOKED: 'New Appointment Booked', CANCELLED: 'Appointment Cancelled', RESCHEDULED: 'Appointment Rescheduled' }[p.type];
  const color = { BOOKED: '#10B981', CANCELLED: '#EF4444', RESCHEDULED: '#F59E0B' }[p.type];
  return wrap(`
    <h2 style="margin:0 0 8px;font-size:22px;color:${color};">${typeLabel}</h2>
    <p style="margin:0 0 24px;color:#64748B;font-size:14px;">Dr. ${p.doctorName}, this is a notification about your schedule.</p>
    <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #E2E8F0;">
      ${[['Patient', p.patientName], ['Date', p.date], ['Time', `${p.time} (${p.duration} min)`], ['Reason', p.reason]]
        .map(([l, v], i) => `<tr style="background:${i % 2 === 0 ? '#F8FAFC' : '#fff'};"><td style="padding:12px 16px;font-size:13px;color:#64748B;width:100px;">${l}</td><td style="padding:12px 16px;font-size:13px;color:#1E293B;font-weight:600;">${v}</td></tr>`).join('')}
    </table>
  `);
}
