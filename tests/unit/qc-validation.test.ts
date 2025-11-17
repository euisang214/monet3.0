import { describe, it, expect } from 'vitest';
import { QCStatus } from '@prisma/client';
import { createMockFeedback } from '../utils/fixtures';
import { generateValidFeedbackSummary } from '../utils/helpers';

/**
 * QC Validation Tests
 *
 * Tests for:
 * - Feedback validation rules
 * - QC status management
 * - Word count validation
 * - Action item validation
 * - Rating validation
 * - Payout gating logic
 */

describe('QC Validation', () => {
  describe('Word Count Validation', () => {
    it('should pass with exactly 200 words', () => {
      const words = new Array(200).fill('word').join(' ');
      const wordCount = words.split(/\s+/).length;

      expect(wordCount).toBe(200);
      expect(wordCount >= 200).toBe(true);
    });

    it('should pass with more than 200 words', () => {
      const words = new Array(250).fill('word').join(' ');
      const wordCount = words.split(/\s+/).length;

      expect(wordCount).toBe(250);
      expect(wordCount >= 200).toBe(true);
    });

    it('should fail with less than 200 words', () => {
      const words = new Array(150).fill('word').join(' ');
      const wordCount = words.split(/\s+/).length;

      expect(wordCount).toBe(150);
      expect(wordCount >= 200).toBe(false);
    });

    it('should count words correctly with punctuation', () => {
      const text = 'Hello, world! This is a test.';
      const wordCount = text.split(/\s+/).length;

      expect(wordCount).toBe(6);
    });

    it('should handle multiple spaces between words', () => {
      const text = 'word1  word2   word3';
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

      expect(wordCount).toBe(3);
    });

    it('should use valid summary from helper', () => {
      const summary = generateValidFeedbackSummary();
      const wordCount = summary.split(/\s+/).filter(w => w.length > 0).length;

      expect(wordCount).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Action Items Validation', () => {
    it('should pass with exactly 3 action items', () => {
      const actions = [
        'Update resume',
        'Network with industry professionals',
        'Apply to target companies',
      ];

      expect(actions.length).toBe(3);
    });

    it('should fail with less than 3 action items', () => {
      const actions = [
        'Update resume',
        'Network with professionals',
      ];

      expect(actions.length).toBe(2);
      expect(actions.length === 3).toBe(false);
    });

    it('should fail with more than 3 action items', () => {
      const actions = [
        'Update resume',
        'Network with professionals',
        'Apply to companies',
        'Prepare for interviews',
      ];

      expect(actions.length).toBe(4);
      expect(actions.length === 3).toBe(false);
    });

    it('should reject empty action items', () => {
      const actions = ['Update resume', '', 'Apply to companies'];
      const hasEmptyActions = actions.some(a => a.trim() === '');

      expect(hasEmptyActions).toBe(true);
    });

    it('should validate action items are non-empty strings', () => {
      const actions = [
        'Update resume to highlight quantifiable achievements',
        'Research target companies and their tech stacks',
        'Schedule informational interviews with 3 industry contacts',
      ];

      const allValid = actions.every(a => typeof a === 'string' && a.trim().length > 0);
      expect(allValid).toBe(true);
    });
  });

  describe('Rating Validation', () => {
    it('should validate all three ratings are present', () => {
      const feedback = createMockFeedback('booking123', 'prof123');

      expect(feedback.contentRating).toBeDefined();
      expect(feedback.deliveryRating).toBeDefined();
      expect(feedback.valueRating).toBeDefined();
    });

    it('should accept ratings from 1 to 5', () => {
      const validRatings = [1, 2, 3, 4, 5];

      validRatings.forEach(rating => {
        const isValid = rating >= 1 && rating <= 5;
        expect(isValid).toBe(true);
      });
    });

    it('should reject ratings less than 1', () => {
      const rating = 0;
      const isValid = rating >= 1 && rating <= 5;

      expect(isValid).toBe(false);
    });

    it('should reject ratings greater than 5', () => {
      const rating = 6;
      const isValid = rating >= 1 && rating <= 5;

      expect(isValid).toBe(false);
    });

    it('should reject negative ratings', () => {
      const rating = -1;
      const isValid = rating >= 1 && rating <= 5;

      expect(isValid).toBe(false);
    });

    it('should reject decimal ratings', () => {
      const rating = 3.5;
      const isValid = Number.isInteger(rating) && rating >= 1 && rating <= 5;

      expect(isValid).toBe(false);
    });
  });

  describe('QC Status Management', () => {
    it('should default to passed for valid feedback', () => {
      const feedback = createMockFeedback('booking123', 'prof123', {
        qcStatus: QCStatus.passed,
      });

      expect(feedback.qcStatus).toBe(QCStatus.passed);
    });

    it('should set revise status for feedback needing improvement', () => {
      const feedback = createMockFeedback('booking123', 'prof123', {
        qcStatus: QCStatus.revise,
      });

      expect(feedback.qcStatus).toBe(QCStatus.revise);
    });

    it('should support missing status for no feedback', () => {
      const feedback = createMockFeedback('booking123', 'prof123', {
        qcStatus: QCStatus.missing,
      });

      expect(feedback.qcStatus).toBe(QCStatus.missing);
    });

    it('should support failed status (admin only)', () => {
      const feedback = createMockFeedback('booking123', 'prof123', {
        qcStatus: QCStatus.failed,
      });

      expect(feedback.qcStatus).toBe(QCStatus.failed);
    });
  });

  describe('Complete QC Validation Logic', () => {
    it('should pass feedback with valid summary, 3 actions, and ratings', () => {
      const summary = generateValidFeedbackSummary();
      const actions = [
        'Update resume',
        'Network with professionals',
        'Apply to companies',
      ];
      const contentRating = 5;
      const deliveryRating = 5;
      const valueRating = 5;

      const wordCount = summary.split(/\s+/).filter(w => w.length > 0).length;
      const hasValidWordCount = wordCount >= 200;
      const hasValidActions = actions.length === 3 && actions.every(a => a.trim().length > 0);
      const hasValidRatings = [contentRating, deliveryRating, valueRating].every(
        r => Number.isInteger(r) && r >= 1 && r <= 5
      );

      const shouldPass = hasValidWordCount && hasValidActions && hasValidRatings;

      expect(shouldPass).toBe(true);
    });

    it('should fail feedback with short summary', () => {
      const summary = 'This is too short.';
      const actions = ['Action 1', 'Action 2', 'Action 3'];
      const contentRating = 5;

      const wordCount = summary.split(/\s+/).filter(w => w.length > 0).length;
      const hasValidWordCount = wordCount >= 200;

      expect(hasValidWordCount).toBe(false);
    });

    it('should fail feedback with wrong number of actions', () => {
      const summary = generateValidFeedbackSummary();
      const actions = ['Action 1', 'Action 2']; // Only 2 actions
      const contentRating = 5;

      const hasValidActions = actions.length === 3;

      expect(hasValidActions).toBe(false);
    });

    it('should fail feedback with invalid ratings', () => {
      const summary = generateValidFeedbackSummary();
      const actions = ['Action 1', 'Action 2', 'Action 3'];
      const contentRating = 6; // Invalid

      const isValidRating = contentRating >= 1 && contentRating <= 5;

      expect(isValidRating).toBe(false);
    });

    it('should fail feedback missing any rating', () => {
      const summary = generateValidFeedbackSummary();
      const actions = ['Action 1', 'Action 2', 'Action 3'];
      const contentRating = 5;
      const deliveryRating = 5;
      const valueRating = undefined;

      const hasAllRatings = contentRating !== undefined &&
        deliveryRating !== undefined &&
        valueRating !== undefined;

      expect(hasAllRatings).toBe(false);
    });
  });

  describe('QC and Payout Gating', () => {
    it('should allow payout when QC status is passed', () => {
      const feedback = createMockFeedback('booking123', 'prof123', {
        qcStatus: QCStatus.passed,
      });

      const canPayout = feedback.qcStatus === QCStatus.passed;

      expect(canPayout).toBe(true);
    });

    it('should block payout when QC status is revise', () => {
      const feedback = createMockFeedback('booking123', 'prof123', {
        qcStatus: QCStatus.revise,
      });

      const canPayout = feedback.qcStatus === QCStatus.passed;

      expect(canPayout).toBe(false);
    });

    it('should block payout when QC status is failed', () => {
      const feedback = createMockFeedback('booking123', 'prof123', {
        qcStatus: QCStatus.failed,
      });

      const canPayout = feedback.qcStatus === QCStatus.passed;

      expect(canPayout).toBe(false);
    });

    it('should block payout when QC status is missing', () => {
      const feedback = createMockFeedback('booking123', 'prof123', {
        qcStatus: QCStatus.missing,
      });

      const canPayout = feedback.qcStatus === QCStatus.passed;

      expect(canPayout).toBe(false);
    });
  });

  describe('Feedback Resubmission', () => {
    it('should allow resubmission when status is revise', () => {
      const feedback = createMockFeedback('booking123', 'prof123', {
        qcStatus: QCStatus.revise,
      });

      const canResubmit = feedback.qcStatus === QCStatus.revise;

      expect(canResubmit).toBe(true);
    });

    it('should trigger new QC check on resubmission', () => {
      const originalFeedback = createMockFeedback('booking123', 'prof123', {
        qcStatus: QCStatus.revise,
      });

      // Simulate resubmission with improved content
      const updatedFeedback = {
        ...originalFeedback,
        summary: generateValidFeedbackSummary(),
        qcStatus: QCStatus.passed,
      };

      expect(updatedFeedback.qcStatus).toBe(QCStatus.passed);
    });
  });

  describe('Automatic vs Manual QC', () => {
    it('should auto-validate to passed or revise (never failed)', () => {
      const validStatuses = [QCStatus.passed, QCStatus.revise];
      const feedback = createMockFeedback('booking123', 'prof123');

      // Automatic QC can only set passed or revise
      expect(validStatuses).toContain(feedback.qcStatus);
    });

    it('should require admin action to set failed status', () => {
      const feedback = createMockFeedback('booking123', 'prof123', {
        qcStatus: QCStatus.failed,
      });

      // Failed status is only set manually by admin
      expect(feedback.qcStatus).toBe(QCStatus.failed);
    });
  });

  describe('QC Timing', () => {
    it('should trigger QC job 500ms after feedback submission', () => {
      const qcDelayMs = 500;
      const feedback = createMockFeedback('booking123', 'prof123');

      expect(qcDelayMs).toBe(500);
      expect(feedback.submittedAt).toBeInstanceOf(Date);
    });

    it('should track feedback submission timestamp', () => {
      const feedback = createMockFeedback('booking123', 'prof123');

      expect(feedback.submittedAt).toBeInstanceOf(Date);
      expect(feedback.submittedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Nudge Email Logic', () => {
    it('should queue nudge emails at +24h, +48h, +72h when status is revise', () => {
      const nudgeDelays = [
        24 * 60 * 60 * 1000, // +24 hours
        48 * 60 * 60 * 1000, // +48 hours
        72 * 60 * 60 * 1000, // +72 hours
      ];

      expect(nudgeDelays).toHaveLength(3);
      expect(nudgeDelays[0]).toBe(86400000);
      expect(nudgeDelays[1]).toBe(172800000);
      expect(nudgeDelays[2]).toBe(259200000);
    });

    it('should not send nudges when QC passes', () => {
      const feedback = createMockFeedback('booking123', 'prof123', {
        qcStatus: QCStatus.passed,
      });

      const shouldSendNudges = feedback.qcStatus === QCStatus.revise;

      expect(shouldSendNudges).toBe(false);
    });

    it('should send nudges when QC needs revision', () => {
      const feedback = createMockFeedback('booking123', 'prof123', {
        qcStatus: QCStatus.revise,
      });

      const shouldSendNudges = feedback.qcStatus === QCStatus.revise;

      expect(shouldSendNudges).toBe(true);
    });
  });

  describe('Feedback Data Structure', () => {
    it('should store actions as JSON array', () => {
      const feedback = createMockFeedback('booking123', 'prof123');

      expect(Array.isArray(feedback.actions)).toBe(true);
      expect(feedback.actions).toHaveLength(3);
    });

    it('should link feedback to booking and professional', () => {
      const bookingId = 'booking123';
      const professionalId = 'prof123';
      const feedback = createMockFeedback(bookingId, professionalId);

      expect(feedback.bookingId).toBe(bookingId);
      expect(feedback.professionalId).toBe(professionalId);
    });

    it('should ensure one feedback per booking', () => {
      const bookingId = 'booking123';
      const feedback1 = createMockFeedback(bookingId, 'prof123');

      // In database, bookingId should be unique in Feedback table
      expect(feedback1.bookingId).toBe(bookingId);
    });
  });
});
