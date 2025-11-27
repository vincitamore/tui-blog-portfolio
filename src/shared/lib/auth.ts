/**
 * Admin Authentication System
 * Uses server-side session tokens for secure authentication
 * All admin API requests require valid session token
 * Session persists across page refreshes using localStorage
 */

const SESSION_STORAGE_KEY = 'admin_session_token';

// Session token - loaded from localStorage on init
let sessionToken: string | null = null;

// Initialize from localStorage
if (typeof window !== 'undefined') {
  sessionToken = localStorage.getItem(SESSION_STORAGE_KEY);
}

/**
 * Save token to localStorage
 */
function persistToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  
  if (token) {
    localStorage.setItem(SESSION_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

/**
 * Get the current auth token for API requests
 */
export function getAuthToken(): string | null {
  return sessionToken;
}

/**
 * Get auth headers for API requests
 */
export function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }
  return headers;
}

/**
 * Login with password - returns true if successful
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    
    if (response.ok) {
      const data = await response.json();
      sessionToken = data.token;
      persistToken(sessionToken);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Login failed:', e);
    return false;
  }
}

/**
 * Restore session from localStorage - verifies token is still valid
 * Returns true if session was successfully restored
 */
export async function restoreSession(): Promise<boolean> {
  // No token stored
  if (!sessionToken) {
    return false;
  }
  
  try {
    // Verify token is still valid with server
    const response = await fetch('/api/admin/verify', {
      headers: getAuthHeaders(),
    });
    
    if (response.ok) {
      return true;
    }
    
    // Token invalid/expired - clear it
    sessionToken = null;
    persistToken(null);
    return false;
  } catch (e) {
    // Server error - keep token but return false
    // (might just be network issue)
    return false;
  }
}

/**
 * Set admin session status (for compatibility - actual session managed by token)
 */
export function setAdminSession(status: boolean): void {
  if (!status) {
    sessionToken = null;
    persistToken(null);
  }
}

/**
 * Check if current session is admin (has valid token)
 */
export function isAdmin(): boolean {
  return sessionToken !== null;
}

/**
 * Logout admin session
 */
export async function logoutAdmin(): Promise<void> {
  if (sessionToken) {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (e) {
      // Ignore logout errors
    }
  }
  sessionToken = null;
  persistToken(null);
}

/**
 * Change admin password (requires auth and current password)
 */
export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!sessionToken) {
    return { success: false, error: 'Not authenticated' };
  }
  
  try {
    const response = await fetch('/api/admin/password', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    
    if (response.ok) {
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


