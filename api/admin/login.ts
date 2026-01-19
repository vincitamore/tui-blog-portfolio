/**
 * Admin Login API
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateSessionToken, createSession, verifyPassword } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    const isValid = await verifyPassword(password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Create session
    const token = generateSessionToken();
    await createSession(token);

    return res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed' });
  }
}
