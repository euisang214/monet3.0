# QC Rubric (MVP)

**Required checks**

1. Word count ≥ 200
2. Exactly 3 action items
3. Stars provided for:
   - Cultural Fit
   - Interest in Industry/Role
   - Technical Knowledge
4. Tone: professional, specific, actionable
5. Extra categories optional (from `FEEDBACK_EXTRA_CATEGORIES`).

**Outcomes**

- `passed` — all checks met.
- `revise` — validation missing or unclear; nudge at +24h and +48h.
- `failed` — persistent issues after grace period; auto‑refund and block payout.

This rubric is evaluated in `lib/qc.ts` and enforced by a BullMQ worker.
