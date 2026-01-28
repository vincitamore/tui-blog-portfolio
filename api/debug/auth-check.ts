/**
 * Debug endpoint to check auth configuration
 * DELETE THIS AFTER DEBUGGING
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  const providedToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const envToken = process.env.ADMIN_API_TOKEN;

  res.json({
    hasEnvToken: !!envToken,
    envTokenLength: envToken?.length || 0,
    envTokenPrefix: envToken?.slice(0, 8) || null,
    providedTokenLength: providedToken?.length || 0,
    providedTokenPrefix: providedToken?.slice(0, 8) || null,
    tokensMatch: envToken && providedToken && envToken === providedToken,
  });
}
