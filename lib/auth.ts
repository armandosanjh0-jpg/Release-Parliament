import crypto from 'node:crypto';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

interface UserRecord extends SessionUser {
  password: string;
}

const SESSION_COOKIE = 'rp_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24;
const sessions = new Map<string, SessionUser>();

function parseUsers(): UserRecord[] {
  const configured = process.env.BASIC_AUTH_USERS;
  if (!configured) {
    return [{ id: 'demo-user', email: 'demo@releaseparliament.ca', name: 'Demo User', password: 'demo1234' }];
  }

  return configured.split(',').map((entry, index) => {
    const [email, password, name] = entry.split(':');
    return {
      id: `user-${index + 1}`,
      email: email.trim(),
      password: (password || '').trim(),
      name: (name || email.split('@')[0]).trim()
    };
  });
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function authenticate(email: string, password: string): SessionUser | null {
  const user = parseUsers().find((candidate) => safeEqual(candidate.email, email));
  if (!user || !safeEqual(user.password, password)) return null;
  return { id: user.id, email: user.email, name: user.name };
}

export function createSession(user: SessionUser): string {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, user);
  return token;
}

export function getUserFromToken(token?: string | null): SessionUser | null {
  if (!token) return null;
  return sessions.get(token) ?? null;
}

export function destroySession(token?: string | null): void {
  if (!token) return;
  sessions.delete(token);
}

export function buildSessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function sessionCookieName(): string {
  return SESSION_COOKIE;
}
