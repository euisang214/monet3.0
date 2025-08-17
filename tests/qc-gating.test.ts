import { describe, expect, it } from 'vitest';

function qcPass(wordCount: number, actions: string[]){
  return wordCount>=200 && actions.length===3;
}

describe('QC gating', ()=>{
  it('passes when >=200 words and 3 actions', ()=>{
    expect(qcPass(220, ['a','b','c'])).toBe(true);
  });
  it('fails when short', ()=>{
    expect(qcPass(150, ['a','b','c'])).toBe(false);
  });
});
