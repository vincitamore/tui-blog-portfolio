/**
 * Admin Password Change API
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, hashPassword, verifyPassword } from '../_lib/auth.js';
import { readJsonBlob, writeJsonBlob, CONTENT_KEYS } from '../_lib/storage.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const isAdmin = await verifyAuth(req);
  if (!isAdmin) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update to new password
    const config = await readJsonBlob<{ passwordHash?: string }>(CONTENT_KEYS.ADMIN, {});
    config.passwordHash = hashPassword(newPassword);
    await writeJsonBlob(CONTENT_KEYS.ADMIN, config);

    return res.json({ success: true });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ error: 'Failed to update password' });
  }
}
