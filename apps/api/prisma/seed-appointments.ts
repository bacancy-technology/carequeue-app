/**
 * Seed script — dummy appointments between a specific patient and doctor.
 *
 * Usage (point DATABASE_URL at the target DB before running):
 *
 *   DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
 *     npx ts-node --project tsconfig.json -e "require('./prisma/seed-appointments.ts')"
 *
 * Or with tsx (simpler):
 *   DATABASE_URL="postgresql://..." npx tsx prisma/seed-appointments.ts
 */

import { PrismaClient, AppointmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

const PATIENT_EMAIL = 'lilianacevedo@yopmail.com';
const DOCTOR_EMAIL  = 'dr.smith@carequeue.com';

// Spread across the past 60 days and next 30 days so the calendar looks alive
const APPOINTMENTS: {
  daysFromToday: number;   // negative = past, positive = future
  hour: number;            // UTC hour (09–16 keeps within a 09:00-17:00 window)
  minute: number;
  duration: number;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  cancellationReason?: string;
}[] = [
  // ── Past / completed ──────────────────────────────────────────────────────
  { daysFromToday: -55, hour: 9,  minute: 0,  duration: 30, status: 'COMPLETED', reason: 'Annual physical check-up', notes: 'Patient in good health, blood pressure normal.' },
  { daysFromToday: -48, hour: 10, minute: 30, duration: 45, status: 'COMPLETED', reason: 'Follow-up after lab results', notes: 'Cholesterol slightly elevated, dietary changes recommended.' },
  { daysFromToday: -40, hour: 14, minute: 0,  duration: 30, status: 'COMPLETED', reason: 'Persistent headache evaluation', notes: 'Prescribed ibuprofen, advised to monitor stress levels.' },
  { daysFromToday: -33, hour: 11, minute: 0,  duration: 30, status: 'COMPLETED', reason: 'Skin rash consultation', notes: 'Mild contact dermatitis, topical cream prescribed.' },
  { daysFromToday: -25, hour: 9,  minute: 30, duration: 30, status: 'COMPLETED', reason: 'Routine blood pressure check' },
  // ── Past / cancelled ──────────────────────────────────────────────────────
  { daysFromToday: -20, hour: 15, minute: 0,  duration: 30, status: 'CANCELLED', reason: 'Flu symptoms', cancellationReason: 'Patient feeling better, cancelled by patient.' },
  { daysFromToday: -14, hour: 13, minute: 30, duration: 30, status: 'CANCELLED', reason: 'Knee pain follow-up', cancellationReason: 'Scheduling conflict, rebooked for a later date.' },
  // ── Past / rescheduled ────────────────────────────────────────────────────
  { daysFromToday: -10, hour: 10, minute: 0,  duration: 45, status: 'RESCHEDULED', reason: 'Diabetes management review', notes: 'Original slot moved due to doctor leave.' },
  // ── Upcoming / scheduled ─────────────────────────────────────────────────
  { daysFromToday:   3, hour: 9,  minute: 0,  duration: 30, status: 'SCHEDULED', reason: 'Allergy testing review' },
  { daysFromToday:   7, hour: 11, minute: 30, duration: 30, status: 'SCHEDULED', reason: 'Cholesterol follow-up', notes: 'Bring latest lab report.' },
  { daysFromToday:  12, hour: 14, minute: 0,  duration: 45, status: 'SCHEDULED', reason: 'Comprehensive wellness check' },
  { daysFromToday:  18, hour: 10, minute: 0,  duration: 30, status: 'SCHEDULED', reason: 'Vaccination — flu shot' },
  { daysFromToday:  22, hour: 15, minute: 30, duration: 30, status: 'SCHEDULED', reason: 'Back pain consultation' },
  { daysFromToday:  28, hour: 9,  minute: 30, duration: 60, status: 'SCHEDULED', reason: 'Pre-surgery consultation', notes: 'Patient needs clearance for minor procedure.' },
];

async function main() {
  console.log('🔍  Looking up patient and doctor…');

  const patientUser = await prisma.user.findUnique({
    where: { email: PATIENT_EMAIL },
    include: { patient: true },
  });
  if (!patientUser?.patient) {
    throw new Error(`Patient not found for email: ${PATIENT_EMAIL}`);
  }

  const doctorUser = await prisma.user.findUnique({
    where: { email: DOCTOR_EMAIL },
    include: { doctor: true },
  });
  if (!doctorUser?.doctor) {
    throw new Error(`Doctor not found for email: ${DOCTOR_EMAIL}`);
  }

  const patientId = patientUser.patient.id;
  const doctorId  = doctorUser.doctor.id;

  console.log(`✅  Patient : ${patientUser.firstName} ${patientUser.lastName} (${patientId})`);
  console.log(`✅  Doctor  : ${doctorUser.firstName} ${doctorUser.lastName} (${doctorId})`);
  console.log(`\n📅  Creating ${APPOINTMENTS.length} appointments…\n`);

  const now = new Date();

  for (const appt of APPOINTMENTS) {
    const scheduledAt = new Date(now);
    scheduledAt.setUTCDate(now.getUTCDate() + appt.daysFromToday);
    scheduledAt.setUTCHours(appt.hour, appt.minute, 0, 0);

    const created = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        scheduledAt,
        duration:           appt.duration,
        status:             appt.status,
        reason:             appt.reason,
        notes:              appt.notes ?? null,
        cancellationReason: appt.cancellationReason ?? null,
      },
    });

    const label = appt.daysFromToday < 0 ? 'past  ' : 'future';
    console.log(`  [${label}]  ${scheduledAt.toISOString().slice(0, 16)}  ${appt.status.padEnd(12)}  ${appt.reason}`);
    void created;
  }

  console.log(`\n✅  Done — ${APPOINTMENTS.length} appointments seeded.`);
}

main()
  .catch((e) => { console.error('❌ ', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
