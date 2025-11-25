/**
 * Admin Authentication System
 * Uses SHA-256 hashing for secure password verification
 * Session-based auth (not persisted to localStorage for security)
 */

// Password hash is fetched from server
let currentPasswordHash: string | null = null;
let isAdminSession = false;

// Default password hash for "password"
const DEFAULT_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';

// Fetch the current password hash from server
async function fetchPasswordHash(): Promise<string> {
  if (currentPasswordHash) return currentPasswordHash;
  
  try {
    const response = await fetch('/api/admin/hash');
    if (response.ok) {
      const data = await response.json();
      const hash = data.hash as string;
      currentPasswordHash = hash;
      return hash;
    }
  } catch (e) {
    console.error('Failed to fetch password hash:', e);
  }
  
  // Fallback to default hash
  return DEFAULT_HASH;
}

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
  const storedHash = await fetchPasswordHash();
  return hash === storedHash;
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

/**
 * Change admin password (requires current password verification)
 */
export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  // Verify current password first
  const isValid = await verifyAdminPassword(currentPassword);
  if (!isValid) {
    return { success: false, error: 'Current password is incorrect' };
  }
  
  // Hash the new password
  const newHash = await hashPassword(newPassword);
  
  try {
    const response = await fetch('/api/admin/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash: newHash }),
    });
    
    if (response.ok) {
      // Update cached hash
      currentPasswordHash = newHash;
      return { success: true };
    } else {
      const data = await response.json();
      return { success: false, error: data.error || 'Failed to update password' };
    }
  } catch (e) {
    console.error('Failed to change password:', e);
    return { success: false, error: 'Server error' };
  }
}


