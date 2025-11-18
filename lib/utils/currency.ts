/**
 * Currency conversion utilities
 * Centralized currency conversion functions to avoid duplication
 */

/**
 * Convert USD dollars to cents for Stripe API
 * Stripe requires amounts in the smallest currency unit (cents for USD)
 * @param usd - Amount in USD dollars
 * @returns Amount in cents (rounded to nearest integer)
 */
export function usdToCents(usd: number): number {
  return Math.round(usd * 100);
}

/**
 * Convert cents to USD dollars
 * @param cents - Amount in cents
 * @returns Amount in USD dollars
 */
export function centsToUsd(cents: number): number {
  return cents / 100;
}

/**
 * Format USD amount for display
 * @param usd - Amount in USD dollars
 * @param includeSymbol - Whether to include the $ symbol (default: true)
 * @returns Formatted currency string
 */
export function formatUsd(usd: number, includeSymbol: boolean = true): string {
  const formatted = usd.toFixed(2);
  return includeSymbol ? `$${formatted}` : formatted;
}

/**
 * Format cents amount for display
 * @param cents - Amount in cents
 * @param includeSymbol - Whether to include the $ symbol (default: true)
 * @returns Formatted currency string
 */
export function formatCents(cents: number, includeSymbol: boolean = true): string {
  return formatUsd(centsToUsd(cents), includeSymbol);
}
