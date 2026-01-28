/**
 * SSH Session Token Generation
 * Creates a JWT for authenticating with the SSH WebSocket proxy
 *
 * POST /api/ssh/session
 * Requires: Admin authentication
 * Returns: { token, wsUrl, expiresAt }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_lib/auth.js';
import * as jose from 'jose';

const TOKEN_EXPIRY = '1h'; // 1 hour
const TOKEN_EXPIRY_SECONDS = 60 * 60;

/**
 * Get the JWT signing key from environment
 */
function getSigningKey(): Uint8Array {
  const secret = process.env.SSH_SESSION_SECRET;
  if (!secret) {
    throw new Error('SSH_SESSION_SECRET environment variable not configured');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Get the WebSocket proxy URL
 */
function getWSProxyUrl(): string {
  const url = process.env.SSH_WS_PROXY_URL;
  if (!url) {
    throw new Error('SSH_WS_PROXY_URL environment variable not configured');
  }
  return url;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin authentication
  const isAuthed = await verifyAuth(req);
  if (!isAuthed) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Generate JWT token for SSH proxy
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + TOKEN_EXPIRY_SECONDS;

    const token = await new jose.SignJWT({
      purpose: 'ssh',
      adminId: 'admin', // Could extract from session if needed
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(TOKEN_EXPIRY)
      .sign(getSigningKey());

    const wsUrl = getWSProxyUrl();

    return res.status(200).json({
      token,
      wsUrl,
      expiresAt: expiresAt * 1000, // Return as milliseconds for JS Date
    });
  } catch (error) {
    console.error('[SSH Session] Error generating token:', error);

    // Don't expose internal error details
    const message = error instanceof Error && error.message.includes('environment variable')
      ? error.message
      : 'Failed to create SSH session';

    return res.status(500).json({ error: message });
  }
}
