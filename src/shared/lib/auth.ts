/**
 * Admin Authentication System
 * Uses server-side session tokens for secure authentication
 * All admin API requests require valid session token
 */

// Session token stored in memory (cleared on page refresh for security)
let sessionToken: string | null = null;

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
      return true;
    }
    return false;
  } catch (e) {
    console.error('Login failed:', e);
    return false;
  }
}

/**
 * Set admin session status (for compatibility - actual session managed by token)
 */
export function setAdminSession(status: boolean): void {
  if (!status) {
    sessionToken = null;
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


