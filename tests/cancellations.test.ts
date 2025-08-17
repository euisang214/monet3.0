import { describe, expect, it } from 'vitest';

function refundRule(actor: 'candidate'|'professional', minutesUntilStart: number){
  if(actor==='professional') return 'full_refund';
  return minutesUntilStart >= 180 ? 'full_refund' : 'half_refund';
}

describe('cancellation rules', ()=>{
  it('candidate early cancel => full refund', ()=>{
    expect(refundRule('candidate', 181)).toBe('full_refund');
  });
  it('candidate late cancel => half refund', ()=>{
    expect(refundRule('candidate', 30)).toBe('half_refund');
  });
  it('pro cancel => full refund', ()=>{
    expect(refundRule('professional', 10)).toBe('full_refund');
  });
});
