/**
 * Centralized error constants and error response utilities
 * Provides consistent error codes and helper functions for API responses
 */

import { NextResponse } from 'next/server';

/**
 * Standard API error codes
 * Using const assertion to provide strong typing
 */
export const API_ERRORS = {
  // Authentication & Authorization
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',

  // Resource Errors
  NOT_FOUND: 'not_found',
  BOOKING_NOT_FOUND: 'booking_not_found',
  FEEDBACK_NOT_FOUND: 'feedback_not_found',
  PAYMENT_NOT_FOUND: 'payment_not_found',

  // Validation Errors
  VALIDATION_ERROR: 'validation_error',
  INVALID_BODY: 'invalid_body',
  INVALID_PAYLOAD: 'invalid_payload',
  INVALID_QC_STATUS: 'invalid_qc_status',
  INVALID_EMAIL: 'invalid_email',

  // Business Logic Errors
  EMAIL_IN_USE: 'email_in_use',
  EMAIL_NOT_VERIFIED: 'email_not_verified',
  BOOKING_NOT_COMPLETED: 'booking_not_completed',
  LATE_CANCELLATION: 'late_cancellation',
  REVIEW_ALREADY_EXISTS: 'review_already_exists',

  // Payment Errors
  MISSING_PAYMENT_INTENT: 'missing_payment_intent',
  PAYMENT_NOT_SUCCEEDED: 'not_succeeded',
  PAYMENT_MISMATCH: 'payment_mismatch',
  ALREADY_REFUNDED: 'already_refunded',
  PAYMENT_ALREADY_RELEASED: 'payment_already_released',
  PAYMENT_NOT_HELD: 'payment_not_held',
  REFUND_FAILED: 'refund_failed',

  // QC & Feedback Errors
  QC_NOT_PASSED: 'qc_not_passed',

  // Stripe & External Service Errors
  PROFESSIONAL_NO_STRIPE_ACCOUNT: 'professional_no_stripe_account',
  GOOGLE_AUTH_REQUIRED: 'google_auth_required',
  FAILED_TO_FETCH: 'failed_to_fetch',

  // Generic
  INTERNAL_ERROR: 'internal_error',
  INVALID: 'invalid',
} as const;

// Type for error codes
export type ApiErrorCode = typeof API_ERRORS[keyof typeof API_ERRORS];

/**
 * HTTP status codes mapped to common use cases
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;

/**
 * Create a standardized error response
 * @param code - Error code from API_ERRORS
 * @param status - HTTP status code (default: 400)
 * @param details - Optional additional error details
 * @returns NextResponse with error payload
 */
export function createErrorResponse(
  code: ApiErrorCode,
  status: number = HTTP_STATUS.BAD_REQUEST,
  details?: Record<string, unknown>
): NextResponse {
  const payload = details ? { error: code, ...details } : { error: code };
  return NextResponse.json(payload, { status });
}

/**
 * Create an unauthorized (401) error response
 */
export function unauthorizedError(): NextResponse {
  return createErrorResponse(API_ERRORS.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
}

/**
 * Create a forbidden (403) error response
 */
export function forbiddenError(): NextResponse {
  return createErrorResponse(API_ERRORS.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
}

/**
 * Create a not found (404) error response
 */
export function notFoundError(code: ApiErrorCode = API_ERRORS.NOT_FOUND): NextResponse {
  return createErrorResponse(code, HTTP_STATUS.NOT_FOUND);
}

/**
 * Create a validation error (400) response
 * @param details - Validation error details (e.g., Zod errors)
 */
export function validationError(details?: Record<string, unknown>): NextResponse {
  return createErrorResponse(API_ERRORS.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST, details);
}

/**
 * Create an internal server error (500) response
 * @param message - Error message
 */
export function internalError(message?: string): NextResponse {
  const details = message ? { message } : undefined;
  return createErrorResponse(API_ERRORS.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_ERROR, details);
}

/**
 * Create a success response
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 */
export function successResponse<T>(data: T, status: number = HTTP_STATUS.OK): NextResponse {
  return NextResponse.json({ data }, { status });
}
