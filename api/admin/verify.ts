/**
 * Admin Session Verify API
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const isValid = await verifyAuth(req);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    return res.json({ valid: true });
  } catch (error) {
    console.error('Verify error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
}
