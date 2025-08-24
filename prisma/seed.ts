import { PrismaClient, Role, BookingStatus, PaymentStatus, QCStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// helper to pick a random item
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// sample data
const firms = [
  'Centerview',
  'Goldman Sachs',
  'JP Morgan',
  'PJT Partners',
  'Morgan Stanley',
  'Qatalyst',
  'Evercore',
  'Lazard',
  'Barclays',
  'Houlihan Lokey',
  'Rothschild & Co',
  'Bain & Company',
];

const titles = ['Analyst', 'Associate', 'Vice President'];

async function createCandidates() {
  const out = [];

  // tester account
  const euisang = await prisma.user.upsert({
    where: { email: 'euisang214@gmail.com' },
    update: {},
    create: {
      email: 'euisang214@gmail.com',
      role: Role.CANDIDATE,
      hashedPassword: await bcrypt.hash('candidate123!', 10),
      candidateProfile: { create: { experience: [], education: [] } },
    },
  });
  out.push(euisang);

  // tester account
  const victoria = await prisma.user.upsert({
    where: { email: 'victoriagehh@gmail.com' },
    update: {},
    create: {
      email: 'victoriagehh@gmail.com',
      role: Role.CANDIDATE,
      hashedPassword: await bcrypt.hash('professional123!', 10),
      candidateProfile: { create: { experience: [], education: [] } },
    },
  });
  out.push(victoria);

  // additional mock candidates
  for (let i = 1; i <= 9; i++) {
    const user = await prisma.user.create({
      data: {
        email: `candidate${i}@example.com`,
        role: Role.CANDIDATE,
        hashedPassword: await bcrypt.hash('candidate123!', 10),
        candidateProfile: { create: { experience: [], education: [] } },
      },
    });
    out.push(user);
  }

  return out;
}

async function createProfessionals() {
  const out = [];

  // mock professionals
  for (let i = 1; i <= 9; i++) {
    const user = await prisma.user.create({
      data: {
        email: `pro${i}@example.com`,
        role: Role.CANDIDATE,
        hashedPassword: await bcrypt.hash('professional123!', 10),
        professionalProfile: {
          create: {
            employer: pick(firms),
            title: pick(titles),
            seniority: pick(['Junior', 'Mid', 'Senior']),
            bio: 'Experienced finance professional with transaction and coverage background.',
            priceUSD: 80 + i,
            availabilityPrefs: {},
          },
        },
      },
    });
    out.push(user);
  }

  return out;
}

async function createBookings(candidates: any[], professionals: any[]) {
  const bookings = [] as any[];

  // upcoming call between testers
  const startUpcoming = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const upcoming = await prisma.booking.create({
    data: {
      candidateId: candidates[0].id,
      professionalId: professionals[0].id,
      status: BookingStatus.accepted,
      startAt: startUpcoming,
      endAt: new Date(startUpcoming.getTime() + 30 * 60 * 1000),
      zoomMeetingId: 'zoom-upcoming-test',
      zoomJoinUrl: 'https://zoom.example.com/upcoming',
    },
  });
  bookings.push(upcoming);

  // prior completed call between testers
  const pastStart = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const past = await prisma.booking.create({
    data: {
      candidateId: candidates[0].id,
      professionalId: professionals[0].id,
      status: BookingStatus.completed,
      startAt: pastStart,
      endAt: new Date(pastStart.getTime() + 30 * 60 * 1000),
    },
  });
  bookings.push(past);

  await prisma.payment.create({
    data: {
      bookingId: past.id,
      amountGross: 10000,
      platformFee: 2000,
      escrowHoldId: 'pi_test_past',
      status: PaymentStatus.released,
    },
  });

  await prisma.feedback.create({
    data: {
      bookingId: past.id,
      starsCategory1: 5,
      starsCategory2: 5,
      starsCategory3: 5,
      extraCategoryRatings: {},
      wordCount: 50,
      actions: ['Mock interview', 'Resume review'],
      text: 'Great session with helpful insights for recruiting.',
      submittedAt: new Date(),
      qcStatus: QCStatus.passed,
      qcReport: {},
    },
  });

  // additional mock bookings
  for (let i = 0; i < 18; i++) {
    const cand = pick(candidates);
    const pro = pick(professionals);
    const start = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000);
    const completed = i % 2 === 0;
    const booking = await prisma.booking.create({
      data: {
        candidateId: cand.id,
        professionalId: pro.id,
        status: completed ? BookingStatus.completed : BookingStatus.requested,
        startAt: start,
        endAt: new Date(start.getTime() + 30 * 60 * 1000),
      },
    });
    bookings.push(booking);

    if (completed) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amountGross: 9000 + i * 100,
          platformFee: 1500,
          escrowHoldId: `pi_mock_${i}`,
          status: PaymentStatus.held,
        },
      });

      await prisma.feedback.create({
        data: {
          bookingId: booking.id,
          starsCategory1: 4,
          starsCategory2: 5,
          starsCategory3: 4,
          extraCategoryRatings: {},
          wordCount: 40,
          actions: ['Follow up', 'Practice more'],
          text: 'Solid advice and actionable next steps.',
          submittedAt: new Date(),
          qcStatus: QCStatus.passed,
          qcReport: {},
        },
      });
    }
  }

  return bookings;
}

async function seedChatHistory(candidateId: string, professionalId: string) {
  const convoId = `${candidateId}_${professionalId}`;
  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: candidateId,
        entity: 'chat',
        entityId: convoId,
        action: 'message',
        metadata: { text: 'Hi Victoria, excited to learn from you!' },
      },
      {
        actorUserId: professionalId,
        entity: 'chat',
        entityId: convoId,
        action: 'message',
        metadata: { text: 'Hi Euisang, looking forward to our session.' },
      },
    ],
  });
}

async function main() {
  // admin account for testing
  await prisma.user.upsert({
    where: { email: 'admin@monet.local' },
    update: {},
    create: {
      email: 'admin@monet.local',
      role: Role.ADMIN,
      hashedPassword: await bcrypt.hash('admin123!', 10),
    },
  });

  const candidates = await createCandidates();
  const professionals = await createProfessionals();

  await createBookings(candidates, professionals);

  // chat history between tester accounts
  await seedChatHistory(candidates[0].id, professionals[0].id);

  console.log('Seed complete');
}

main().finally(async () => {
  await prisma.$disconnect();
});

