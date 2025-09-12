import { PrismaClient, Role, BookingStatus, PaymentStatus, QCStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SCHOOLS, JOB_TITLES, DEGREE_TITLES } from '../lib/profileOptions';

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

type TenorPeriod = { start: string; finish: string };
type ExperienceEntry = { firm: string; title: string; startDate: Date; endDate: Date };
type EducationEntry = { school: string; title: string; startDate: Date; endDate: Date };

const jobTitles = JOB_TITLES;
const degreeTitles = DEGREE_TITLES;
const schools = SCHOOLS;

const experiencePeriods: TenorPeriod[] = [
  { start: '2018-01-01', finish: '2019-01-01' },
  { start: '2019-01-01', finish: '2020-01-01' },
  { start: '2020-01-01', finish: '2021-01-01' },
  { start: '2021-01-01', finish: '2022-01-01' },
  { start: '2022-01-01', finish: '2023-01-01' },
];
const educationPeriods: TenorPeriod[] = [
  { start: '2014-09-01', finish: '2018-06-01' },
  { start: '2015-09-01', finish: '2019-06-01' },
  { start: '2016-09-01', finish: '2020-06-01' },
  { start: '2017-09-01', finish: '2021-06-01' },
  { start: '2018-09-01', finish: '2022-06-01' },
];

const randomPeriod = (periods: TenorPeriod[]): TenorPeriod => pick(periods);

const randomExperience = (): ExperienceEntry => {
  const period = randomPeriod(experiencePeriods);
  return {
    firm: pick(firms),
    title: pick(jobTitles),
    startDate: new Date(period.start),
    endDate: new Date(period.finish),
  };
};

const randomEducation = (): EducationEntry => {
  const period = randomPeriod(educationPeriods);
  return {
    school: pick(schools),
    title: pick(degreeTitles),
    startDate: new Date(period.start),
    endDate: new Date(period.finish),
  };
};

// mock profile details
const candidateInterests = ['Investment Banking', 'Private Equity', 'Consulting', 'Startups', 'Hedge Funds'];
const candidateActivities = ['Finance club', 'Case competitions', 'Volunteering', 'Blogging', 'Sports'];

const professionalInterests = ['Mergers and Acquisitions', 'Private Equity', 'Venture Capital', 'FinTech', 'Consulting'];
const professionalActivities = ['Mentoring', 'Volunteering', 'Cycling', 'Traveling', 'Blogging'];

// sample names for users
const firstNames = ['Alex', 'Jamie', 'Taylor', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Avery', 'Parker', 'Quinn'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Hernandez'];
const randomName = () => ({ firstName: pick(firstNames), lastName: pick(lastNames) });

// generate a simple corporate-style email based on name and firm
const corporateEmailFor = (
  firstName: string,
  lastName: string,
  employer: string,
) => {
  const domain = employer.toLowerCase().replace(/[^a-z]/g, '') + '.com';
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
};

async function createCandidates() {
  const out = [];

  // tester account
  const euisang = await prisma.user.upsert({
    where: { email: 'euisang214@gmail.com' },
    update: {},
    create: {
      id: 'candidate-euisang',
      email: 'euisang214@gmail.com',
      role: Role.CANDIDATE,
      hashedPassword: await bcrypt.hash('candidate123!', 10),
      firstName: 'Euisang',
      lastName: 'Kim',
    },
  });
  await prisma.candidateProfile.upsert({
    where: { userId: euisang.id },
    update: {},
    create: {
      userId: euisang.id,
      interests: [pick(candidateInterests), pick(candidateInterests)],
      activities: [pick(candidateActivities)],
      experience: { create: [randomExperience()] },
      education: { create: [randomEducation()] },
    },
  });
  out.push(euisang);

  // tester account
  const victoria = await prisma.user.upsert({
    where: { email: 'victoriagehh@gmail.com' },
    update: {},
    create: {
      id: 'candidate-victoria',
      email: 'victoriagehh@gmail.com',
      role: Role.CANDIDATE,
      hashedPassword: await bcrypt.hash('professional123!', 10),
      firstName: 'Victoria',
      lastName: 'Geh',
    },
  });
  await prisma.candidateProfile.upsert({
    where: { userId: victoria.id },
    update: {},
    create: {
      userId: victoria.id,
      interests: [pick(candidateInterests), pick(candidateInterests)],
      activities: [pick(candidateActivities)],
      experience: { create: [randomExperience()] },
      education: { create: [randomEducation()] },
    },
  });
  out.push(victoria);

  // additional mock candidates
  for (let i = 1; i <= 9; i++) {
    const { firstName, lastName } = randomName();
    const user = await prisma.user.create({
      data: {
        id: `candidate-${i}`,
        email: `candidate${i}@example.com`,
        role: Role.CANDIDATE,
        hashedPassword: await bcrypt.hash('candidate123!', 10),
        firstName,
        lastName,
      },
    });
    await prisma.candidateProfile.create({
      data: {
        userId: user.id,
        interests: [pick(candidateInterests), pick(candidateInterests)],
        activities: [pick(candidateActivities)],
        experience: { create: [randomExperience()] },
        education: { create: [randomEducation()] },
      },
    });
    out.push(user);
  }

  return out;
}

async function createProfessionals() {
  const out = [];

  // tester professional account
  const euisangss = await prisma.user.upsert({
    where: { email: 'euisangss@gmail.com' },
    update: {},
    create: {
      id: 'professional-euisangss',
      email: 'euisangss@gmail.com',
      role: Role.PROFESSIONAL,
      hashedPassword: await bcrypt.hash('professional123!', 10),
      firstName: 'Euisang',
      lastName: 'Seo',
    },
  });
  const euisangEmployer = pick(firms);
  await prisma.professionalProfile.upsert({
    where: { userId: euisangss.id },
    update: {},
    create: {
      userId: euisangss.id,
      employer: euisangEmployer,
      title: pick(jobTitles),
      bio: 'Experienced finance professional with transaction and coverage background.',
      priceUSD: 100,
      availabilityPrefs: {},
      interests: [pick(professionalInterests), pick(professionalInterests)],
      activities: [pick(professionalActivities)],
      experience: { create: [randomExperience(), randomExperience()] },
      education: { create: [randomEducation()] },
      corporateEmail: corporateEmailFor('Euisang', 'Seo', euisangEmployer),
    },
  });
  out.push({ ...euisangss, priceUSD: 100 });

  // additional mock professionals
  for (let i = 1; i <= 9; i++) {
    const { firstName, lastName } = randomName();
    const user = await prisma.user.create({
      data: {
        id: `professional-${i}`,
        email: `pro${i}@example.com`,
        role: Role.PROFESSIONAL,
        hashedPassword: await bcrypt.hash('professional123!', 10),
        firstName,
        lastName,
      },
    });
    const employer = pick(firms);
    await prisma.professionalProfile.create({
      data: {
        userId: user.id,
        employer,
        title: pick(jobTitles),
        bio: 'Experienced finance professional with transaction and coverage background.',
        priceUSD: 80 + i,
        availabilityPrefs: {},
        interests: [pick(professionalInterests), pick(professionalInterests)],
        activities: [pick(professionalActivities)],
        experience: { create: [randomExperience(), randomExperience()] },
        education: { create: [randomEducation()] },
        corporateEmail: corporateEmailFor(firstName, lastName, employer),
      },
    });
    out.push({ ...user, priceUSD: 80 + i });
  }

  return out;
}

async function createBookings(candidates: any[], professionals: any[]) {
  const bookings = [] as any[];

  // upcoming calls for tester candidates
  const upcomingSpecs = [
    {
      candidateIdx: 0,
      professionalIdx: 0,
      daysFromNow: 1,
      meetingId: 'zoom-upcoming-euisangss',
      joinUrl: 'https://zoom.example.com/upcoming-euisangss',
    },
    {
      candidateIdx: 1,
      professionalIdx: 0,
      daysFromNow: 4,
      meetingId: 'zoom-upcoming-victoria-euisangss',
      joinUrl: 'https://zoom.example.com/upcoming-victoria-euisangss',
    },
    {
      candidateIdx: 0,
      professionalIdx: 1,
      daysFromNow: 2,
      meetingId: 'zoom-upcoming-test',
      joinUrl: 'https://zoom.example.com/upcoming',
    },
    {
      candidateIdx: 0,
      professionalIdx: 2,
      daysFromNow: 5,
      meetingId: 'zoom-upcoming-test-2',
      joinUrl: 'https://zoom.example.com/upcoming-2',
    },
    {
      candidateIdx: 1,
      professionalIdx: 3,
      daysFromNow: 3,
      meetingId: 'zoom-upcoming-victoria',
      joinUrl: 'https://zoom.example.com/upcoming-victoria',
    },
    {
      candidateIdx: 1,
      professionalIdx: 4,
      daysFromNow: 7,
      meetingId: 'zoom-upcoming-victoria-2',
      joinUrl: 'https://zoom.example.com/upcoming-victoria-2',
    },
  ];

  // schedule upcoming calls at least 30 days in the future
  for (const spec of upcomingSpecs) {
    const start = new Date(
      Date.now() + (spec.daysFromNow + 30) * 24 * 60 * 60 * 1000,
    );
    const booking = await prisma.booking.create({
      data: {
        candidateId: candidates[spec.candidateIdx].id,
        professionalId: professionals[spec.professionalIdx].id,
        priceUSD: professionals[spec.professionalIdx].priceUSD,
        status: BookingStatus.accepted,
        startAt: start,
        endAt: new Date(start.getTime() + 30 * 60 * 1000),
        zoomMeetingId: spec.meetingId,
        zoomJoinUrl: spec.joinUrl,
      },
    });
    bookings.push(booking);
  }

  // past completed calls for testers with feedback
  const pastSpecs = [
    {
      candidateIdx: 0,
      professionalIdx: 0,
      daysAgo: 10,
      amountGross: 10500,
      platformFee: 2100,
      escrowHoldId: 'pi_test_past_euisangss',
      feedback: 'Insightful session with industry deep dive.',
      reviewRating: 5,
      reviewText: 'Candidate was well-prepared and engaged.',
    },
    {
      candidateIdx: 1,
      professionalIdx: 0,
      daysAgo: 12,
      amountGross: 9500,
      platformFee: 1900,
      escrowHoldId: 'pi_test_past_victoria_euisangss',
      feedback: 'Great insights for upcoming interviews.',
      reviewRating: 5,
      reviewText: 'Candidate asked insightful questions and is eager to learn.',
    },
    {
      candidateIdx: 0,
      professionalIdx: 1,
      daysAgo: 5,
      amountGross: 10000,
      platformFee: 2000,
      escrowHoldId: 'pi_test_past',
      feedback: 'Great session with helpful insights for recruiting.',
      reviewRating: 5,
      reviewText: 'Wonderful to mentor this candidate.',
    },
    {
      candidateIdx: 0,
      professionalIdx: 3,
      daysAgo: 15,
      amountGross: 12000,
      platformFee: 2500,
      escrowHoldId: 'pi_test_past_2',
      feedback: 'Another insightful session.',
      reviewRating: 4,
      reviewText: 'Candidate showed strong improvement.',
    },
    {
      candidateIdx: 1,
      professionalIdx: 4,
      daysAgo: 7,
      amountGross: 9000,
      platformFee: 1800,
      escrowHoldId: 'pi_test_past_3',
      feedback: 'Very helpful advice.',
      reviewRating: 5,
      reviewText: 'Engaged candidate with thoughtful questions.',
    },
    {
      candidateIdx: 1,
      professionalIdx: 5,
      daysAgo: 20,
      amountGross: 11000,
      platformFee: 2200,
      escrowHoldId: 'pi_test_past_4',
      feedback: 'Fantastic discussion.',
      reviewRating: 5,
      reviewText: 'Pleasure to work with this candidate.',
    },
  ];

  for (const spec of pastSpecs) {
    const start = new Date(Date.now() - spec.daysAgo * 24 * 60 * 60 * 1000);
    const booking = await prisma.booking.create({
      data: {
        candidateId: candidates[spec.candidateIdx].id,
        professionalId: professionals[spec.professionalIdx].id,
        priceUSD: professionals[spec.professionalIdx].priceUSD,
        status: BookingStatus.completed,
        startAt: start,
        endAt: new Date(start.getTime() + 30 * 60 * 1000),
      },
    });
    bookings.push(booking);

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amountGross: spec.amountGross,
        platformFee: spec.platformFee,
        escrowHoldId: spec.escrowHoldId,
        status: PaymentStatus.released,
      },
    });

    await prisma.feedback.create({
      data: {
        bookingId: booking.id,
        starsCategory1: 5,
        starsCategory2: 5,
        starsCategory3: 5,
        extraCategoryRatings: {},
        wordCount: 50,
        actions: ['Mock interview', 'Resume review'],
        text: spec.feedback,
        submittedAt: new Date(),
        qcStatus: QCStatus.passed,
        qcReport: {},
      },
    });

    await prisma.professionalReview.create({
      data: {
        bookingId: booking.id,
        rating: spec.reviewRating,
        text: spec.reviewText,
      },
    });
  }

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
        priceUSD: pro.priceUSD,
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

      await prisma.professionalReview.create({
        data: {
          bookingId: booking.id,
          rating: 4,
          text: 'Promising candidate who is eager to learn.',
        },
      });
    }
  }

  // additional bookings specific to professional euisangss@gmail.com
  const proEuisang = professionals.find(
    (p) => p.email === 'euisangss@gmail.com'
  );
  if (proEuisang) {
    // bookings with provided feedback
    for (let i = 0; i < 10; i++) {
      const cand = pick(candidates);
      const start = new Date(Date.now() - (i + 40) * 24 * 60 * 60 * 1000);
      const booking = await prisma.booking.create({
        data: {
          candidateId: cand.id,
          professionalId: proEuisang.id,
          priceUSD: proEuisang.priceUSD,
          status: BookingStatus.completed,
          startAt: start,
          endAt: new Date(start.getTime() + 30 * 60 * 1000),
        },
      });
      bookings.push(booking);

      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amountGross: 10000,
          platformFee: 2000,
          escrowHoldId: `pi_provided_${i}`,
          status: PaymentStatus.released,
        },
      });

      await prisma.feedback.create({
        data: {
          bookingId: booking.id,
          starsCategory1: 5,
          starsCategory2: 5,
          starsCategory3: 5,
          extraCategoryRatings: {},
          wordCount: 60,
          actions: ['Mock interview', 'Resume review'],
          text: `Detailed feedback session ${i + 1}.`,
          submittedAt: new Date(),
          qcStatus: QCStatus.passed,
          qcReport: {},
        },
      });
    }

    // bookings pending feedback
    for (let i = 0; i < 10; i++) {
      const cand = pick(candidates);
      const start = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000);
      const booking = await prisma.booking.create({
        data: {
          candidateId: cand.id,
          professionalId: proEuisang.id,
          priceUSD: proEuisang.priceUSD,
          status: BookingStatus.completed_pending_feedback,
          startAt: start,
          endAt: new Date(start.getTime() + 30 * 60 * 1000),
        },
      });
      bookings.push(booking);

      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amountGross: 10000,
          platformFee: 2000,
          escrowHoldId: `pi_pending_${i}`,
          status: PaymentStatus.released,
        },
      });
    }

    // incoming call requests scheduled at least 30 days out
    for (let i = 0; i < 10; i++) {
      const cand = pick(candidates);
      const start = new Date(
        Date.now() + (i + 1 + 30) * 24 * 60 * 60 * 1000,
      );
      const booking = await prisma.booking.create({
        data: {
          candidateId: cand.id,
          professionalId: proEuisang.id,
          priceUSD: proEuisang.priceUSD,
          status: BookingStatus.requested,
          startAt: start,
          endAt: new Date(start.getTime() + 30 * 60 * 1000),
        },
      });
      bookings.push(booking);
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
      firstName: 'Admin',
      lastName: 'User',
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

