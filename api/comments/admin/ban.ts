/**
 * Admin IP Ban API - Manage banned IPs
 * GET: List all banned IPs
 * POST: Ban an IP
 * DELETE: Unban an IP
 * Requires admin authentication
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readJsonBlob, writeJsonBlob, CONTENT_KEYS } from '../../_lib/storage.js';
import { verifyAuth } from '../../_lib/auth.js';

interface BanEntry {
  ip: string;
  reason: string;
  bannedAt: string;
  bannedBy: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify admin auth for all methods
  const isAdmin = await verifyAuth(req);
  if (!isAdmin) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  // GET - List all banned IPs
  if (req.method === 'GET') {
    try {
      const bannedIps = await readJsonBlob<BanEntry[]>(CONTENT_KEYS.BANNED_IPS, []);
      return res.json(bannedIps);
    } catch (error) {
      console.error('Error fetching banned IPs:', error);
      return res.status(500).json({ error: 'Failed to fetch banned IPs' });
    }
  }

  // POST - Ban an IP
  if (req.method === 'POST') {
    const { ip, reason } = req.body;

    if (!ip || typeof ip !== 'string' || !ip.trim()) {
      return res.status(400).json({ error: 'IP address is required' });
    }

    try {
      const bannedIps = await readJsonBlob<BanEntry[]>(CONTENT_KEYS.BANNED_IPS, []);

      // Check if already banned
      if (bannedIps.some(entry => entry.ip === ip.trim())) {
        return res.status(400).json({ error: 'IP is already banned' });
      }

      const banEntry: BanEntry = {
        ip: ip.trim(),
        reason: reason || 'No reason provided',
        bannedAt: new Date().toISOString(),
        bannedBy: 'admin',
      };

      bannedIps.push(banEntry);
      await writeJsonBlob(CONTENT_KEYS.BANNED_IPS, bannedIps);

      return res.status(201).json(banEntry);
    } catch (error) {
      console.error('Error banning IP:', error);
      return res.status(500).json({ error: 'Failed to ban IP' });
    }
  }

  // DELETE - Unban an IP
  if (req.method === 'DELETE') {
    const { ip } = req.body;

    if (!ip || typeof ip !== 'string' || !ip.trim()) {
      return res.status(400).json({ error: 'IP address is required' });
    }

    try {
      const bannedIps = await readJsonBlob<BanEntry[]>(CONTENT_KEYS.BANNED_IPS, []);

      const index = bannedIps.findIndex(entry => entry.ip === ip.trim());
      if (index === -1) {
        return res.status(404).json({ error: 'IP is not banned' });
      }

      bannedIps.splice(index, 1);
      await writeJsonBlob(CONTENT_KEYS.BANNED_IPS, bannedIps);

      return res.json({ success: true });
    } catch (error) {
      console.error('Error unbanning IP:', error);
      return res.status(500).json({ error: 'Failed to unban IP' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
