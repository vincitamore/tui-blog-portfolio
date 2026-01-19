/**
 * Visitor Logs API (Admin only)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJsonBlob, CONTENT_KEYS } from './_lib/storage';
import { verifyAuth } from './_lib/auth';

interface VisitorLog {
  ip: string;
  timestamp: string;
  userAgent: string;
}

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

  const isAdmin = await verifyAuth(req);
  if (!isAdmin) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const logs = await readJsonBlob<VisitorLog[]>(CONTENT_KEYS.VISITORS, []);
    return res.json(logs);
  } catch (error) {
    console.error('Error fetching visitor logs:', error);
    return res.status(500).json({ error: 'Failed to read visitor logs' });
  }
}
