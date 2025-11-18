/**
 * Payment calculation utilities
 * Centralized payment and fee calculations to avoid duplication
 */

/**
 * Calculate net amount after subtracting platform fee
 * @param amountGross - The gross amount before fees
 * @param platformFee - The platform fee to subtract
 * @returns The net amount (gross - fee)
 */
export function calculateNetAmount(amountGross: number, platformFee: number): number {
  return amountGross - platformFee;
}

/**
 * Calculate platform fee based on gross amount and fee percentage
 * @param amountGross - The gross amount
 * @param feePercentage - Fee percentage (e.g., 20 for 20%)
 * @returns The platform fee amount
 */
export function calculatePlatformFee(amountGross: number, feePercentage: number): number {
  return (amountGross * feePercentage) / 100;
}

/**
 * Calculate net amount given gross amount and fee percentage
 * @param amountGross - The gross amount
 * @param feePercentage - Fee percentage (e.g., 20 for 20%)
 * @returns The net amount after fee deduction
 */
export function calculateNetFromPercentage(amountGross: number, feePercentage: number): number {
  const fee = calculatePlatformFee(amountGross, feePercentage);
  return calculateNetAmount(amountGross, fee);
}
