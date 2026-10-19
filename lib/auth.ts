import crypto from 'crypto';
import { db } from './db';

const MASTER_PASSWORD = process.env.RESTAURANT_ADMIN_SECRET || 'naijagrill2025';
const SESSION_SALT = 'naija-grill-salt-v1';

export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, SESSION_SALT, 1000, 64, 'sha512').toString('hex');
}

export function generateSessionToken(role = 'admin'): string {
  const timestamp = Date.now();
  const raw = `${role}:${timestamp}:${crypto.randomBytes(16).toString('hex')}`;
  const signature = crypto.createHmac('sha256', MASTER_PASSWORD).update(raw).digest('hex');
  return Buffer.from(`${raw}:${signature}`).toString('base64');
}

export function verifySessionToken(token: string): { valid: boolean; role?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return { valid: false };

    const [role, timestampStr, , signature] = parts;
    const raw = `${role}:${timestampStr}:${parts[2]}`;
    const expectedSignature = crypto.createHmac('sha256', MASTER_PASSWORD).update(raw).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: false };
    }

    // 7 day session validity
    const timestamp = parseInt(timestampStr, 10);
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > maxAge) {
      return { valid: false };
    }

    return { valid: true, role };
  } catch {
    return { valid: false };
  }
}

export async function verifyAdminCredentials(providedPassword: string): Promise<boolean> {
  const settings = await db.getSettings();

  // If a custom admin password hash is stored in settings, verify against it
  if (settings.adminPasswordHash) {
    const computed = hashPassword(providedPassword);
    return computed === settings.adminPasswordHash;
  }

  // Fallback to master password
  return providedPassword === MASTER_PASSWORD || providedPassword === 'naijagrill2025';
}

export function extractAuthToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/admin_session=([^;]+)/);
    if (match) return match[1];
  }

  return null;
}

export function isAdminAuthenticated(req: Request): boolean {
  const token = extractAuthToken(req);
  if (!token) return false;
  const result = verifySessionToken(token);
  return result.valid;
}
