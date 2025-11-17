import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { flags } from '@/lib/flags';
import { z } from 'zod';

const validateSchema = z.object({
  text: z.string(),
  actions: z.array(z.string()),
  starsCategory1: z.number().int().min(1).max(5),
  starsCategory2: z.number().int().min(1).max(5),
  starsCategory3: z.number().int().min(1).max(5),
});

/**
 * POST /api/feedback/validate
 * LLM-based validation of feedback quality before submission
 * Returns suggestions if feedback needs improvement
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Only professionals can validate feedback (they're the ones submitting it)
    if (session.user.role !== 'PROFESSIONAL') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = validateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'validation_error', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { text, actions, starsCategory1, starsCategory2, starsCategory3 } = parsed.data;

    // Basic validation (same as submission endpoint)
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const basicIssues: string[] = [];

    if (wordCount < 200) {
      basicIssues.push(`Feedback is too short (${wordCount} words). Minimum 200 words required.`);
    }

    if (actions.length !== 3) {
      basicIssues.push(`Exactly 3 action items required. You provided ${actions.length}.`);
    }

    // If basic validation fails, return immediately
    if (basicIssues.length > 0) {
      return NextResponse.json({
        approved: false,
        issues: basicIssues,
        suggestions: [
          'Add more detail to your written feedback to reach 200 words',
          'Ensure you have exactly 3 specific, actionable items',
        ],
      });
    }

    // If LLM feature is disabled, approve immediately after basic checks
    if (!flags.FEATURE_QC_LLM) {
      return NextResponse.json({
        approved: true,
        message: 'Feedback meets basic requirements',
      });
    }

    // LLM-based validation using Anthropic Claude
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      console.warn('ANTHROPIC_API_KEY not set, skipping LLM validation');
      return NextResponse.json({
        approved: true,
        message: 'Feedback meets basic requirements',
      });
    }

    // Call Anthropic API
    const prompt = `You are a quality control expert reviewing professional feedback for a job candidate after a consultation call.

Review the following feedback and determine if it is substantial, meaningful, and valuable:

**Written Feedback:**
${text}

**Action Items:**
${actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

**Star Ratings:**
- Category 1 (Technical Skills): ${starsCategory1}/5
- Category 2 (Communication): ${starsCategory2}/5
- Category 3 (Problem Solving): ${starsCategory3}/5

**Quality Criteria:**
1. Is the feedback specific and detailed? (not generic)
2. Does it provide concrete examples from the call?
3. Are the action items specific, actionable, and relevant?
4. Is the overall feedback valuable and helpful to the candidate?
5. Does it justify the star ratings given?

**Your task:**
- If the feedback is high quality, respond with: APPROVED
- If it needs improvement, respond with: NEEDS_IMPROVEMENT followed by 2-3 specific suggestions

Format your response as:
STATUS: [APPROVED or NEEDS_IMPROVEMENT]
SUGGESTIONS: [If NEEDS_IMPROVEMENT, provide 2-3 bullet points with specific suggestions]`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Anthropic API error:', await response.text());
      // Fall back to approval if LLM fails
      return NextResponse.json({
        approved: true,
        message: 'Feedback meets basic requirements',
      });
    }

    const result = await response.json();
    const llmResponse = result.content[0].text;

    // Parse LLM response
    const statusMatch = llmResponse.match(/STATUS:\s*(APPROVED|NEEDS_IMPROVEMENT)/i);
    const suggestionsMatch = llmResponse.match(/SUGGESTIONS:\s*([\s\S]+)/i);

    const isApproved = statusMatch?.[1]?.toUpperCase() === 'APPROVED';

    if (isApproved) {
      return NextResponse.json({
        approved: true,
        message: 'Feedback is high quality and ready to submit!',
      });
    } else {
      // Parse suggestions from LLM response
      const suggestionsText = suggestionsMatch?.[1] || '';
      const suggestions = suggestionsText
        .split('\n')
        .map(s => s.trim())
        .filter(s => s && (s.startsWith('-') || s.startsWith('•') || s.match(/^\d+\./)))
        .map(s => s.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''))
        .slice(0, 3); // Limit to 3 suggestions

      return NextResponse.json({
        approved: false,
        issues: ['The feedback could be more detailed and specific'],
        suggestions: suggestions.length > 0 ? suggestions : [
          'Add specific examples from the conversation',
          'Make action items more concrete and actionable',
          'Provide more detailed reasoning for the ratings given',
        ],
      });
    }
  } catch (error: any) {
    console.error('Feedback validation error:', error);

    // On error, fail open (approve the feedback) to not block users
    return NextResponse.json({
      approved: true,
      message: 'Feedback meets basic requirements',
      note: 'Advanced validation temporarily unavailable',
    });
  }
}
