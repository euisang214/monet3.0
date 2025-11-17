import { vi } from 'vitest';

/**
 * Test helper utilities
 */

/**
 * Mock NextAuth session for API route testing
 */
export const mockAuth = (session: any) => {
  vi.doMock('@/auth', () => ({
    auth: vi.fn(() => Promise.resolve(session)),
  }));
};

/**
 * Create a mock Request object for API route testing
 */
export const createMockRequest = (options: {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  url?: string;
} = {}): Request => {
  const {
    method = 'GET',
    body = null,
    headers = {},
    url = 'http://localhost:3000',
  } = options;

  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : null,
  });
};

/**
 * Parse JSON response from API routes
 */
export const parseJsonResponse = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/**
 * Create a date in the future
 */
export const futureDate = (hours: number = 24): Date => {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

/**
 * Create a date in the past
 */
export const pastDate = (hours: number = 24): Date => {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
};

/**
 * Wait for async operations to complete
 */
export const wait = (ms: number = 0): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Mock environment variable for a test
 */
export const withEnv = (key: string, value: string, fn: () => void | Promise<void>) => {
  const original = process.env[key];
  process.env[key] = value;
  try {
    return fn();
  } finally {
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  }
};

/**
 * Generate a valid QC-passing feedback summary (>= 200 words)
 */
export const generateValidFeedbackSummary = (): string => {
  return `During our consultation call, we had a comprehensive discussion about the candidate's career trajectory and professional development goals. The candidate demonstrated strong technical knowledge and clear communication skills throughout our conversation. We explored several key areas including their current role, desired career path, and specific challenges they're facing in their job search.

I provided detailed insights based on my industry experience, particularly focusing on market trends and hiring practices relevant to their field. We discussed strategies for positioning themselves more effectively for senior-level roles, including how to highlight their leadership experience and quantifiable achievements in their resume and during interviews.

The candidate was highly engaged and asked thoughtful questions about navigating career transitions, negotiating compensation packages, and building a professional network in their target industry. I shared specific examples from my own career progression and recommended resources that would be valuable for their particular situation.

We also spent significant time reviewing their current skill set and identifying areas where additional development would be beneficial. I provided concrete recommendations for online courses, certifications, and professional communities that would help them stay current with industry trends and expand their expertise.

Additionally, we discussed the importance of personal branding and maintaining an active presence on professional networking platforms. I offered guidance on how to craft compelling content that showcases their expertise and attracts opportunities aligned with their career goals.

Overall, the session was productive and the candidate left with a clear action plan for moving forward. I believe they have strong potential and with the strategic adjustments we discussed, they should see positive results in their job search efforts.`;
};

/**
 * Calculate minutes until a date
 */
export const minutesUntil = (date: Date): number => {
  return Math.floor((date.getTime() - Date.now()) / (60 * 1000));
};

/**
 * Calculate minutes since a date
 */
export const minutesSince = (date: Date): number => {
  return Math.floor((Date.now() - date.getTime()) / (60 * 1000));
};

/**
 * Create a date at a specific time today
 */
export const todayAt = (hours: number, minutes: number = 0): Date => {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Create a date at a specific time tomorrow
 */
export const tomorrowAt = (hours: number, minutes: number = 0): Date => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Mock Stripe webhook event
 */
export const createStripeWebhookEvent = (type: string, data: any) => {
  return {
    id: 'evt_test_' + Math.random().toString(36).substring(7),
    object: 'event',
    type,
    data: {
      object: data,
    },
    created: Math.floor(Date.now() / 1000),
    livemode: false,
  };
};
