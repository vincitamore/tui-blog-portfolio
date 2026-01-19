/**
 * Who Am I API - Returns visitor's IP address
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

function getClientIp(req: VercelRequest): string {
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             'unknown';
  return Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();
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

  const clientIp = getClientIp(req);
  return res.json({ ip: clientIp });
}
