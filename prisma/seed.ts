import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const firms = ['Centerview','Goldman Sachs','JP Morgan','PJT Partners','Morgan Stanley','Qatalyst','Evercore','Lazard','Barclays','Houlihan Lokey','Rothschild & Co','Bain & Company'];

function pick<T>(arr:T[]) { return arr[Math.floor(Math.random()*arr.length)] }

async function main(){
  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@monet.local' },
    update: {},
    create: { email:'admin@monet.local', role:'CANDIDATE', hashedPassword: await bcrypt.hash('admin123!', 10) }
  });

  // Candidates
  const candidates = [];
  for(let i=1;i<=25;i++){
    const email = `cand${i}@monet.local`;
    const user = await prisma.user.create({
      data: {
        email, role:'CANDIDATE', hashedPassword: await bcrypt.hash('cand123!', 10),
        candidateProfile: { create: { experience: [], education: [] }}
      }
    });
    candidates.push(user);
  }

  // Professionals
  const professionals = [];
  for(let i=1;i<=12;i++){
    const email = `pro${i}@monet.local`;
    const firm = pick(firms);
    const price = 30 + i;
    const user = await prisma.user.create({
      data: {
        email, role:'PROFESSIONAL', hashedPassword: await bcrypt.hash('pro123!', 10),
        professionalProfile: { create: {
          employer: firm,
          title: i%3===0 ? 'Associate' : i%3===1 ? 'Senior Associate' : 'VP',
          seniority: i%3===0 ? 'Junior' : i%3===1 ? 'Mid' : 'Senior',
          bio: 'Experienced finance professional with transaction and coverage background.',
          priceUSD: price,
          availabilityPrefs: {}
        }}
      }
    });
    professionals.push(user);
  }

  // Bookings & Feedback
  const pro1 = professionals[0];
  const pro2 = professionals[1];
  const cand1 = candidates[0];
  const cand2 = candidates[1];

  const now = new Date();
  const inTwoDays = new Date(now.getTime() + 2*24*60*60*1000);

  const b1 = await prisma.booking.create({
    data: {
      candidateId: cand1.id, professionalId: pro1.id, status:'accepted',
      startAt: inTwoDays, endAt: new Date(inTwoDays.getTime() + 30*60*1000)
    }
  });
  const b2 = await prisma.booking.create({
    data: {
      candidateId: cand2.id, professionalId: pro1.id, status:'completed',
      startAt: new Date(now.getTime()-5*24*60*60*1000), endAt: new Date(now.getTime()-5*24*60*60*1000 + 30*60*1000)
    }
  });
  const b3 = await prisma.booking.create({
    data: {
      candidateId: cand2.id, professionalId: pro2.id, status:'requested',
      startAt: new Date(now.getTime()+3*24*60*60*1000), endAt: new Date(now.getTime()+3*24*60*60*1000 + 30*60*1000)
    }
  });

  // Payments & payouts
  await prisma.payment.create({
    data: { bookingId: b2.id, amountGross: 5000, platformFee: 1000, escrowHoldId: 'pi_test', status: 'held' }
  });
  await prisma.payout.create({
    data: { bookingId: b2.id, proStripeAccountId:'acct_test', amountNet: 4000, status:'blocked' }
  });

  // Feedback (incl. one 'revise')
  const longText = Array.from({length:220}, (_,i)=>`word${i}`).join(' ');
  await prisma.feedback.create({
    data: {
      bookingId: b2.id,
      starsCategory1: 5, starsCategory2: 4, starsCategory3: 5,
      extraCategoryRatings: {}, wordCount: 220, actions: ['Refine DCF','Prepare comps','Rehearse pitch'],
      text: longText, submittedAt: new Date(), qcStatus:'passed', qcReport:{},
    }
  });

  const shortText = Array.from({length:120}, (_,i)=>`w${i}`).join(' ');
  await prisma.feedback.create({
    data: {
      bookingId: b1.id,
      starsCategory1: 4, starsCategory2: 4, starsCategory3: 4,
      extraCategoryRatings: {}, wordCount: 120, actions: ['A','B','C'],
      text: shortText, submittedAt: new Date(), qcStatus:'revise', qcReport:{},
    }
  });

  // Seed a payout linked to feedback to meet gating flow
  await prisma.payout.create({
    data: { bookingId: b1.id, proStripeAccountId:'acct_test', amountNet: 3000, status: 'blocked', reason: 'Awaiting QC pass' }
  });

  console.log('Seed complete');
}

main().finally(async ()=>{ await prisma.$disconnect(); });
