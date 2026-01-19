/**
 * Authentication helpers for Vercel serverless functions
 * Uses Vercel KV for session storage (replaces in-memory sessions)
 */

import { kv } from '@vercel/kv';
import crypto from 'crypto';
import type { VercelRequest } from '@vercel/node';
import { readJsonBlob, CONTENT_KEYS } from './storage.js';

const SESSION_DURATION = 24 * 60 * 60; // 24 hours in seconds
const SESSION_PREFIX = 'session:';

// Default password hash for "password" - CHANGE THIS IN PRODUCTION
const DEFAULT_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';

/**
 * Generate secure session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash password using SHA-256
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Create a new session
 */
export async function createSession(token: string): Promise<void> {
  await kv.set(`${SESSION_PREFIX}${token}`, { createdAt: Date.now() }, { ex: SESSION_DURATION });
}

/**
 * Validate a session token
 */
export async function validateSession(token: string): Promise<boolean> {
  const session = await kv.get(`${SESSION_PREFIX}${token}`);
  return session !== null;
}

/**
 * Delete a session
 */
export async function deleteSession(token: string): Promise<void> {
  await kv.del(`${SESSION_PREFIX}${token}`);
}

/**
 * Extract bearer token from request
 */
export function extractToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Verify request has valid authentication
 */
export async function verifyAuth(req: VercelRequest): Promise<boolean> {
  const token = extractToken(req);
  if (!token) return false;
  return validateSession(token);
}

/**
 * Get stored password hash
 */
export async function getPasswordHash(): Promise<string> {
  const config = await readJsonBlob<{ passwordHash?: string }>(CONTENT_KEYS.ADMIN, {});
  return config.passwordHash || DEFAULT_HASH;
}

/**
 * Verify password against stored hash
 */
export async function verifyPassword(password: string): Promise<boolean> {
  const storedHash = await getPasswordHash();
  const providedHash = hashPassword(password);
  return providedHash === storedHash;
}
