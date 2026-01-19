/**
 * Visitor Logging API
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJsonBlob, writeJsonBlob, CONTENT_KEYS } from './_lib/storage';

interface VisitorLog {
  ip: string;
  timestamp: string;
  userAgent: string;
}

const MAX_VISITOR_LOGS = 100;

function getClientIp(req: VercelRequest): string {
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             'unknown';
  return Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();
}

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
    const logs = await readJsonBlob<VisitorLog[]>(CONTENT_KEYS.VISITORS, []);
    const clientIp = getClientIp(req);

    // Don't log duplicate visits from same IP within 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentVisit = logs.find(log =>
      log.ip === clientIp && new Date(log.timestamp).getTime() > fiveMinutesAgo
    );

    if (!recentVisit) {
      logs.unshift({
        ip: clientIp,
        timestamp: new Date().toISOString(),
        userAgent: (req.headers['user-agent'] || 'unknown').slice(0, 200),
      });
      await writeJsonBlob(CONTENT_KEYS.VISITORS, logs.slice(0, MAX_VISITOR_LOGS));
    }

    return res.json({ ok: true });
  } catch (error) {
    // Don't fail if logging fails
    return res.json({ ok: true });
  }
}
