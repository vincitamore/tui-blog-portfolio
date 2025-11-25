/**
 * Admin Authentication System
 * Uses SHA-256 hashing for secure password verification
 * Session-based auth (not persisted to localStorage for security)
 */

// Pre-computed SHA-256 hash of your admin password
// To generate: run in browser console:
// crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourpassword'))
//   .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''))
// Default password is "amore" - CHANGE THIS IN PRODUCTION
const ADMIN_PASSWORD_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'; // "password" - change this!

let isAdminSession = false;

/**
 * Hash a string using SHA-256
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify admin password
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === ADMIN_PASSWORD_HASH;
}

/**
 * Set admin session status
 */
export function setAdminSession(status: boolean): void {
  isAdminSession = status;
}

/**
 * Check if current session is admin
 */
export function isAdmin(): boolean {
  return isAdminSession;
}

/**
 * Logout admin session
 */
export function logoutAdmin(): void {
  isAdminSession = false;
}

/**
 * Generate a hash for a new password (for setup)
 */
export async function generatePasswordHash(password: string): Promise<string> {
  return hashPassword(password);
}


