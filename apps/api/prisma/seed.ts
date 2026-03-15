import { PrismaClient } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function hash(password: string): string {
  return bcrypt.hashSync(password, 12);
}

async function main() {
  console.log('🌱 Seeding CareQueue database...\n');

  // ─── 1. ADMIN ─────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@carequeue.com' },
    update: {},
    create: {
      email: 'admin@carequeue.com',
      passwordHash: hash('Admin@123'),
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✅ Admin        → admin@carequeue.com       / Admin@123`);

  // ─── 2. CLINIC STAFF ──────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'staff@carequeue.com' },
    update: {},
    create: {
      email: 'staff@carequeue.com',
      passwordHash: hash('Staff@123'),
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'CLINIC_STAFF',
      isActive: true,
    },
  });
  console.log(`✅ Clinic Staff → staff@carequeue.com       / Staff@123`);

  // ─── 3. DOCTOR 1 — Cardiology ─────────────────────────────────────────────
  const doctor1User = await prisma.user.upsert({
    where: { email: 'dr.smith@carequeue.com' },
    update: {},
    create: {
      email: 'dr.smith@carequeue.com',
      passwordHash: hash('Doctor@123'),
      firstName: 'James',
      lastName: 'Smith',
      role: 'DOCTOR',
      isActive: true,
    },
  });

  const doctor1 = await prisma.doctor.upsert({
    where: { licenseNumber: 'LIC-001-CARD' },
    update: {},
    create: {
      userId: doctor1User.id,
      specialization: 'Cardiology',
      licenseNumber: 'LIC-001-CARD',
      phone: '+1-555-0101',
      bio: 'Experienced cardiologist with over 10 years in interventional cardiology.',
    },
  });

  // Set availability Mon–Fri 09:00–17:00
  for (const day of [1, 2, 3, 4, 5]) {
    await prisma.doctorAvailability.upsert({
      where: { doctorId_dayOfWeek: { doctorId: doctor1.id, dayOfWeek: day } },
      update: {},
      create: { doctorId: doctor1.id, dayOfWeek: day, startTime: '09:00', endTime: '17:00', isAvailable: true },
    });
  }
  // Mark weekends unavailable
  for (const day of [0, 6]) {
    await prisma.doctorAvailability.upsert({
      where: { doctorId_dayOfWeek: { doctorId: doctor1.id, dayOfWeek: day } },
      update: {},
      create: { doctorId: doctor1.id, dayOfWeek: day, startTime: '09:00', endTime: '17:00', isAvailable: false },
    });
  }
  console.log(`✅ Doctor       → dr.smith@carequeue.com    / Doctor@123  (Cardiology, Mon–Fri 09–17)`);

  // ─── 4. DOCTOR 2 — General Practice ──────────────────────────────────────
  const doctor2User = await prisma.user.upsert({
    where: { email: 'dr.patel@carequeue.com' },
    update: {},
    create: {
      email: 'dr.patel@carequeue.com',
      passwordHash: hash('Doctor@123'),
      firstName: 'Priya',
      lastName: 'Patel',
      role: 'DOCTOR',
      isActive: true,
    },
  });

  const doctor2 = await prisma.doctor.upsert({
    where: { licenseNumber: 'LIC-002-GP' },
    update: {},
    create: {
      userId: doctor2User.id,
      specialization: 'General Practice',
      licenseNumber: 'LIC-002-GP',
      phone: '+1-555-0102',
      bio: 'Family medicine physician focused on preventive care and chronic disease management.',
    },
  });

  for (const day of [1, 2, 3, 4, 5]) {
    await prisma.doctorAvailability.upsert({
      where: { doctorId_dayOfWeek: { doctorId: doctor2.id, dayOfWeek: day } },
      update: {},
      create: { doctorId: doctor2.id, dayOfWeek: day, startTime: '08:00', endTime: '16:00', isAvailable: true },
    });
  }
  for (const day of [0, 6]) {
    await prisma.doctorAvailability.upsert({
      where: { doctorId_dayOfWeek: { doctorId: doctor2.id, dayOfWeek: day } },
      update: {},
      create: { doctorId: doctor2.id, dayOfWeek: day, startTime: '08:00', endTime: '16:00', isAvailable: false },
    });
  }
  console.log(`✅ Doctor       → dr.patel@carequeue.com    / Doctor@123  (General Practice, Mon–Fri 08–16)`);

  // ─── 5. PATIENT ───────────────────────────────────────────────────────────
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@carequeue.com' },
    update: {},
    create: {
      email: 'patient@carequeue.com',
      passwordHash: hash('Patient@123'),
      firstName: 'John',
      lastName: 'Doe',
      role: 'PATIENT',
      isActive: true,
    },
  });

  await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      dateOfBirth: new Date('1990-05-15'),
      gender: 'Male',
      phone: '+1-555-0201',
      address: '123 Main Street, New York, NY 10001',
      emergencyContact: 'Jane Doe — +1-555-0202',
      medicalHistory: 'No known drug allergies. History of mild hypertension.',
    },
  });
  console.log(`✅ Patient      → patient@carequeue.com     / Patient@123`);

  // ─── 6. SAMPLE APPOINTMENT ────────────────────────────────────────────────
  const patient = await prisma.patient.findUnique({ where: { userId: patientUser.id } });

  if (patient) {
    // Find the next weekday (Mon–Fri) for a sample appointment
    const next = new Date();
    next.setDate(next.getDate() + 1);
    while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1);
    next.setHours(10, 0, 0, 0);

    const existing = await prisma.appointment.findFirst({
      where: { patientId: patient.id, doctorId: doctor1.id },
    });

    if (!existing) {
      await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doctor1.id,
          scheduledAt: next,
          duration: 30,
          status: 'SCHEDULED',
          reason: 'Annual cardiac check-up',
          notes: 'Patient reports occasional chest discomfort. First visit.',
        },
      });
      console.log(`✅ Appointment  → John Doe with Dr. Smith on ${next.toDateString()} at 10:00 AM`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Seed complete! Login credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ADMIN        admin@carequeue.com      Admin@123');
  console.log('  STAFF        staff@carequeue.com      Staff@123');
  console.log('  DOCTOR       dr.smith@carequeue.com   Doctor@123');
  console.log('  DOCTOR       dr.patel@carequeue.com   Doctor@123');
  console.log('  PATIENT      patient@carequeue.com    Patient@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
