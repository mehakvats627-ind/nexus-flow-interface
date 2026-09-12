import { ethers } from "ethers";

/**
 * Calculates Keccak-256 hash of a delivered content payload.
 * Returns standard 0x-prefixed 32-byte hex string.
 */
export function computeContentHash(content: string): string {
  if (!content) {
    return ethers.keccak256(ethers.toUtf8Bytes(""));
  }
  return ethers.keccak256(ethers.toUtf8Bytes(content));
}

/**
 * Validates whether a provided contentHash matches the payload.
 */
export function verifyContentHash(content: string, expectedHash: string): boolean {
  const actual = computeContentHash(content);
  return actual.toLowerCase() === expectedHash.toLowerCase();
}
