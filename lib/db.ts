import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface UserVoteRow {
  id: string;
  userId: string;
  billId: string;
  vote: 'Yea' | 'Nay' | 'Abstain';
  createdAt: string;
}

const DB_DIR = path.join(process.cwd(), 'db');
const DB_FILE = path.join(DB_DIR, 'user_votes.json');

function ensureDbFile() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]', 'utf8');
}

function readAll(): UserVoteRow[] {
  ensureDbFile();
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as UserVoteRow[];
}

function writeAll(rows: UserVoteRow[]) {
  ensureDbFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(rows, null, 2), 'utf8');
}

export function insertUserVote(input: Omit<UserVoteRow, 'id' | 'createdAt'>): UserVoteRow {
  const rows = readAll();
  const row: UserVoteRow = {
    id: crypto.randomUUID(),
    userId: input.userId,
    billId: input.billId,
    vote: input.vote,
    createdAt: new Date().toISOString()
  };
  rows.push(row);
  writeAll(rows);
  return row;
}

export function listVotesForBill(billId: string): UserVoteRow[] {
  return readAll().filter((row) => row.billId === billId);
}
